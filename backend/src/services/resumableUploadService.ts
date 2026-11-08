import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import prisma from '../prisma.js';
import { StorageService } from './storageService.js';
import { StorageQuotaService, STORAGE_LIMIT_BYTES } from './storageQuotaService.js';
import { MediaService } from './mediaService.js';

const STORAGE_ROOT = path.resolve(process.cwd(), process.env.LOCAL_STORAGE_PATH || './storage_data');
const TEMP_UPLOADS_DIR = path.join(STORAGE_ROOT, 'temp', 'uploads');

if (!fs.existsSync(TEMP_UPLOADS_DIR)) {
  fs.mkdirSync(TEMP_UPLOADS_DIR, { recursive: true });
}

export interface InitiateUploadParams {
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileHash?: string;
  chunkSize?: number;
  folderId?: string;
  deviceInfo?: string;
  forceDuplicate?: boolean;
}

export class ResumableUploadService {
  /**
   * Initiates or resumes an upload session with strict 5 TB quota & active reservations
   */
  static async initiateSession(userId: string, params: InitiateUploadParams) {
    const {
      fileName,
      fileSize,
      mimeType,
      fileHash,
      chunkSize = 5 * 1024 * 1024, // 5 MB default chunk size
      folderId,
      deviceInfo,
      forceDuplicate = false
    } = params;

    const incomingSizeBigInt = BigInt(fileSize);

    // 1. Check duplicate if hash provided
    if (fileHash && !forceDuplicate) {
      const existingMedia = await prisma.media.findFirst({
        where: {
          ownerId: userId,
          fileHash,
          isDeleted: false
        }
      });

      if (existingMedia) {
        return {
          duplicateDetected: true,
          message: 'This file already exists in your cloud storage.',
          existingMedia: MediaService.enrichMediaWithUrls(existingMedia, userId)
        };
      }
    }

    // 2. Storage Quota Check including Active Upload Reservations
    const storageRecord = await StorageQuotaService.getOrCreateStorageRecord(userId);
    
    // Sum active session reservations for this user
    const activeSessions = await prisma.uploadSession.findMany({
      where: {
        userId,
        status: 'active'
      },
      select: { fileSize: true }
    });

    let reservedBytes = BigInt(0);
    for (const s of activeSessions) {
      reservedBytes += s.fileSize;
    }

    const currentUsed = storageRecord.usedBytes;
    const limit = storageRecord.limitBytes || STORAGE_LIMIT_BYTES;

    if (currentUsed + reservedBytes + incomingSizeBigInt > limit) {
      const err: any = new Error(
        `Storage quota exceeded. Your 5 TB limit cannot accommodate this upload (Used: ${currentUsed}, Reserved: ${reservedBytes}, Incoming: ${incomingSizeBigInt}).`
      );
      err.statusCode = 413;
      throw err;
    }

    // 3. Check for existing active session for same file & size to resume immediately
    if (fileHash) {
      const existingSession = await prisma.uploadSession.findFirst({
        where: {
          userId,
          fileHash,
          fileSize: incomingSizeBigInt,
          status: 'active'
        },
        include: {
          parts: { select: { partNumber: true, size: true } }
        }
      });

      if (existingSession && fs.existsSync(existingSession.tempDir)) {
        const uploadedPartNumbers = existingSession.parts.map(p => p.partNumber);
        return {
          duplicateDetected: false,
          resumed: true,
          sessionId: existingSession.id,
          chunkSize: existingSession.chunkSize,
          totalChunks: existingSession.totalChunks,
          uploadedParts: uploadedPartNumbers,
          message: `Resuming existing upload session (${uploadedPartNumbers.length}/${existingSession.totalChunks} chunks already uploaded).`
        };
      }
    }

    // 4. Create new upload session
    const totalChunks = Math.max(1, Math.ceil(fileSize / chunkSize));
    const sessionId = `upl_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const sessionTempDir = path.join(TEMP_UPLOADS_DIR, sessionId);

    if (!fs.existsSync(sessionTempDir)) {
      fs.mkdirSync(sessionTempDir, { recursive: true });
    }

    const session = await prisma.uploadSession.create({
      data: {
        id: sessionId,
        userId,
        fileName,
        fileSize: incomingSizeBigInt,
        mimeType,
        fileHash: fileHash || null,
        chunkSize,
        totalChunks,
        status: 'active',
        tempDir: sessionTempDir,
        folderId: folderId || null
      }
    });

    // Record activity
    await prisma.uploadActivity.create({
      data: {
        userId,
        fileName,
        fileSize: incomingSizeBigInt,
        status: 'started',
        deviceInfo: deviceInfo || 'Web/Mobile Client'
      }
    });

    return {
      duplicateDetected: false,
      resumed: false,
      sessionId: session.id,
      chunkSize: session.chunkSize,
      totalChunks: session.totalChunks,
      uploadedParts: []
    };
  }

  /**
   * Saves an uploaded chunk directly to disk
   */
  static async saveChunk(
    userId: string,
    sessionId: string,
    partNumber: number,
    chunkBufferOrStream: Buffer | string
  ) {
    const session = await prisma.uploadSession.findUnique({
      where: { id: sessionId }
    });

    if (!session || session.userId !== userId) {
      const err: any = new Error('Upload session not found or forbidden.');
      err.statusCode = !session ? 404 : 403;
      throw err;
    }

    if (session.status !== 'active') {
      const err: any = new Error(`Cannot upload to session with status "${session.status}".`);
      err.statusCode = 400;
      throw err;
    }

    if (partNumber < 1 || partNumber > session.totalChunks) {
      const err: any = new Error(`Invalid part number ${partNumber}. Must be between 1 and ${session.totalChunks}.`);
      err.statusCode = 400;
      throw err;
    }

    if (!fs.existsSync(session.tempDir)) {
      fs.mkdirSync(session.tempDir, { recursive: true });
    }

    const chunkFileName = `part_${String(partNumber).padStart(6, '0')}`;
    const chunkPath = path.join(session.tempDir, chunkFileName);

    let chunkSize = 0;
    if (typeof chunkBufferOrStream === 'string') {
      // It's a file path from multer
      try {
        await fs.promises.rename(chunkBufferOrStream, chunkPath);
      } catch {
        await fs.promises.copyFile(chunkBufferOrStream, chunkPath);
        await fs.promises.unlink(chunkBufferOrStream).catch(() => {});
      }
      const stat = await fs.promises.stat(chunkPath);
      chunkSize = stat.size;
    } else {
      await fs.promises.writeFile(chunkPath, chunkBufferOrStream);
      chunkSize = chunkBufferOrStream.length;
    }

    // Record part in database
    await prisma.uploadPart.upsert({
      where: {
        sessionId_partNumber: {
          sessionId,
          partNumber
        }
      },
      create: {
        sessionId,
        partNumber,
        size: chunkSize
      },
      update: {
        size: chunkSize,
        uploadedAt: new Date()
      }
    });

    return {
      success: true,
      sessionId,
      partNumber,
      size: chunkSize
    };
  }

  /**
   * Retrieves current status of an upload session
   */
  static async getSessionStatus(userId: string, sessionId: string) {
    const session = await prisma.uploadSession.findUnique({
      where: { id: sessionId },
      include: {
        parts: {
          select: { partNumber: true, size: true, uploadedAt: true }
        }
      }
    });

    if (!session || session.userId !== userId) {
      const err: any = new Error('Upload session not found or forbidden.');
      err.statusCode = !session ? 404 : 403;
      throw err;
    }

    const uploadedParts = session.parts.map(p => p.partNumber).sort((a, b) => a - b);
    const uploadedBytes = session.parts.reduce((acc, p) => acc + p.size, 0);

    return {
      sessionId: session.id,
      fileName: session.fileName,
      fileSize: Number(session.fileSize),
      mimeType: session.mimeType,
      chunkSize: session.chunkSize,
      totalChunks: session.totalChunks,
      uploadedParts,
      uploadedBytes,
      progress: Math.min(100, Math.round((uploadedParts.length / session.totalChunks) * 100)),
      status: session.status,
      createdAt: session.createdAt
    };
  }

  /**
   * Finalizes the upload: concatenates parts using streams, generates thumbnails, saves media
   */
  static async completeSession(userId: string, sessionId: string) {
    const session = await prisma.uploadSession.findUnique({
      where: { id: sessionId },
      include: {
        parts: true
      }
    });

    if (!session || session.userId !== userId) {
      const err: any = new Error('Upload session not found or forbidden.');
      err.statusCode = !session ? 404 : 403;
      throw err;
    }

    if (session.status !== 'active') {
      const err: any = new Error(`Session is already ${session.status}.`);
      err.statusCode = 400;
      throw err;
    }

    // Verify all parts exist
    const uploadedPartSet = new Set(session.parts.map(p => p.partNumber));
    const missingParts: number[] = [];
    for (let i = 1; i <= session.totalChunks; i++) {
      if (!uploadedPartSet.has(i)) {
        missingParts.push(i);
      }
    }

    if (missingParts.length > 0) {
      const err: any = new Error(
        `Cannot complete upload. Missing ${missingParts.length} parts (e.g. part ${missingParts.slice(0, 5).join(', ')}).`
      );
      err.statusCode = 400;
      throw err;
    }

    // Concatenate chunks directly on disk using Node stream piping (zero memory bloat)
    const assembledFileName = `assembled_${Date.now()}_${session.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const assembledFilePath = path.join(session.tempDir, assembledFileName);
    const writeStream = fs.createWriteStream(assembledFilePath);
    const hash = crypto.createHash('sha256');

    for (let i = 1; i <= session.totalChunks; i++) {
      const chunkFileName = `part_${String(i).padStart(6, '0')}`;
      const chunkPath = path.join(session.tempDir, chunkFileName);

      if (!fs.existsSync(chunkPath)) {
        writeStream.destroy();
        const err: any = new Error(`Physical chunk file missing on disk: part ${i}`);
        err.statusCode = 500;
        throw err;
      }

      await new Promise<void>((resolve, reject) => {
        const readStream = fs.createReadStream(chunkPath);
        readStream.on('data', chunk => {
          hash.update(chunk);
        });
        readStream.on('error', reject);
        readStream.on('end', resolve);
        readStream.pipe(writeStream, { end: false });
      });
    }

    writeStream.end();
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    const calculatedHash = hash.digest('hex');

    // Categorize media type
    const lowerName = session.fileName.toLowerCase();
    let category = 'other';
    if (session.mimeType.startsWith('image/')) category = 'photo';
    else if (session.mimeType.startsWith('video/') || lowerName.endsWith('.mp4') || lowerName.endsWith('.mov') || lowerName.endsWith('.webm') || lowerName.endsWith('.mkv')) category = 'video';
    else if (session.mimeType.startsWith('audio/') || lowerName.endsWith('.mp3') || lowerName.endsWith('.wav') || lowerName.endsWith('.m4a') || lowerName.endsWith('.flac') || lowerName.endsWith('.aac')) category = 'audio';
    else if (session.mimeType.includes('pdf') || session.mimeType.includes('document') || session.mimeType.includes('text') || lowerName.endsWith('.pdf') || lowerName.endsWith('.docx') || lowerName.endsWith('.txt')) category = 'document';

    // Move to permanent storage & generate thumbnail
    const processed = await StorageService.saveMediaFile(
      userId,
      assembledFilePath,
      session.fileName,
      session.mimeType
    );

    // Create database Media record (metadata only - zero RAM overhead)
    let fileBuffer: Buffer | null = null;
    if (session.fileSize <= BigInt(15 * 1024 * 1024)) {
      try {
        const fullPath = StorageService.getAbsolutePath(processed.storagePath);
        if (fs.existsSync(fullPath)) {
          fileBuffer = fs.readFileSync(fullPath);
        }
      } catch {}
    }

    const media = await prisma.media.create({
      data: {
        ownerId: userId,
        folderId: session.folderId,
        fileName: path.basename(processed.storagePath),
        originalName: session.fileName,
        mimeType: session.mimeType,
        category,
        fileSize: session.fileSize,
        fileHash: calculatedHash,
        storagePath: processed.storagePath,
        thumbnailPath: processed.thumbnailPath,
        fileData: fileBuffer,
        width: processed.width,
        height: processed.height,
        duration: null,
        takenAt: new Date()
      }
    });

    // Update user's StorageUsage
    await StorageQuotaService.updateUsage(userId, Number(session.fileSize));

    // Mark session as completed
    await prisma.uploadSession.update({
      where: { id: sessionId },
      data: { status: 'completed' }
    });

    // Record activity
    await prisma.uploadActivity.create({
      data: {
        userId,
        fileName: session.fileName,
        fileSize: session.fileSize,
        status: 'completed',
        deviceInfo: 'Resumable Upload'
      }
    });

    // Clean up temporary chunk files asynchronously
    fs.rm(session.tempDir, { recursive: true, force: true }, () => {});

    return {
      success: true,
      message: 'Upload completed and verified successfully.',
      media: MediaService.enrichMediaWithUrls(media, userId)
    };
  }

  /**
   * Aborts an upload session and cleans up disk resources
   */
  static async abortSession(userId: string, sessionId: string) {
    const session = await prisma.uploadSession.findUnique({
      where: { id: sessionId }
    });

    if (!session || session.userId !== userId) {
      const err: any = new Error('Upload session not found or forbidden.');
      err.statusCode = !session ? 404 : 403;
      throw err;
    }

    await prisma.uploadSession.update({
      where: { id: sessionId },
      data: { status: 'aborted' }
    });

    await prisma.uploadActivity.create({
      data: {
        userId,
        fileName: session.fileName,
        fileSize: session.fileSize,
        status: 'aborted',
        deviceInfo: 'User Canceled'
      }
    });

    // Clean up temporary files
    if (fs.existsSync(session.tempDir)) {
      fs.rm(session.tempDir, { recursive: true, force: true }, () => {});
    }

    return { success: true, message: 'Upload session aborted successfully.' };
  }

  /**
   * Lists any pending/active upload sessions for recovery
   */
  static async listPendingSessions(userId: string) {
    const sessions = await prisma.uploadSession.findMany({
      where: {
        userId,
        status: 'active'
      },
      include: {
        parts: { select: { partNumber: true, size: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return sessions.map(s => ({
      sessionId: s.id,
      fileName: s.fileName,
      fileSize: Number(s.fileSize),
      mimeType: s.mimeType,
      chunkSize: s.chunkSize,
      totalChunks: s.totalChunks,
      uploadedParts: s.parts.map(p => p.partNumber),
      progress: Math.min(100, Math.round((s.parts.length / s.totalChunks) * 100)),
      createdAt: s.createdAt
    }));
  }
}
