import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { Response } from 'express';
import prisma from '../prisma.js';
import { calculateBufferHash, calculateFileHash } from '../utils/hash.js';
import { StorageQuotaService } from './storageQuotaService.js';
import { StorageService } from './storageService.js';

export interface MediaFilterOptions {
  view?: 'photos' | 'videos' | 'audio' | 'favorites' | 'archive' | 'trash' | 'all' | 'files' | 'documents';
  albumId?: string;
  folderId?: string | null;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export const SUCHITH_FAMILY_IDS = [
  '2899f01c-bfe0-4114-9850-7782ab86a6af', // suchith@2007.com
  '3b0e7cf6-9a50-4dfe-ae3e-f8ff6ecd7e78', // suchith@gmail.com
  '7e43e689-641d-4514-adec-372cc9f83ed3'  // suchith2007kumar@gmail.com
];

export function isOwnerOrFamily(ownerId: string, userId: string): boolean {
  if (ownerId === userId) return true;
  if (SUCHITH_FAMILY_IDS.includes(ownerId) && SUCHITH_FAMILY_IDS.includes(userId)) return true;
  return false;
}

export class MediaService {
  /**
   * Upload and process a new media file (photos, videos of any size, or MP3 audio)
   */
  static async uploadMedia(
    userId: string,
    file: Express.Multer.File,
    forceDuplicate: boolean = false,
    folderId?: string | null
  ) {
    let fileHash: string;
    if (file.buffer) {
      fileHash = calculateBufferHash(file.buffer);
    } else if (file.path) {
      fileHash = await calculateFileHash(file.path);
    } else {
      fileHash = `${Date.now()}_${file.originalname}`;
    }

    // Determine category
    const lowerName = file.originalname.toLowerCase();
    let category = 'other';
    if (file.mimetype.startsWith('image/') || /\.(jpe?g|png|gif|webp|svg|bmp|heic|heif|tiff?)$/i.test(lowerName)) {
      category = 'photo';
    } else if (file.mimetype.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|wmv|3gp|flv|m4v)$/i.test(lowerName)) {
      category = 'video';
    } else if (file.mimetype.startsWith('audio/') || /\.(mp3|wav|m4a|flac|aac|ogg|wma|opus)$/i.test(lowerName)) {
      category = 'audio';
    } else if (file.mimetype.includes('pdf') || file.mimetype.includes('document') || file.mimetype.includes('text') || /\.(pdf|docx?|xlsx?|pptx?|txt|csv|zip|rar|tar|gz|7z)$/i.test(lowerName)) {
      category = 'document';
    }

    // 1. Duplicate Detection Check
    if (!forceDuplicate) {
      const existing = await prisma.media.findFirst({
        where: {
          ownerId: userId,
          fileHash,
          isDeleted: false
        }
      });

      if (existing) {
        if (file.path && fs.existsSync(file.path)) {
          await fs.promises.unlink(file.path).catch(() => {});
        }
        return {
          duplicateDetected: true,
          message: 'Duplicate file detected. This memory already exists in your library.',
          existingMedia: {
            id: existing.id,
            fileName: existing.fileName,
            createdAt: existing.createdAt
          }
        };
      }
    }

    // 2. Enforce 5 TB Storage Quota Check
    const quotaCheck = await StorageQuotaService.checkUploadAllowed(userId, file.size);
    if (!quotaCheck.allowed) {
      if (file.path && fs.existsSync(file.path)) {
        await fs.promises.unlink(file.path).catch(() => {});
      }
      const error: any = new Error(
        "Storage limit reached. You don't have enough available storage for this upload."
      );
      error.statusCode = 413;
      throw error;
    }

    // 3. Save to Private Storage & Generate Thumbnail (Streamed directly to disk, 0 RAM overhead)
    const fileSource = file.path || file.buffer;
    const processed = await StorageService.saveMediaFile(
      userId,
      fileSource,
      file.originalname,
      file.mimetype
    );

    // 4. Save Media Record to DB with Neon PostgreSQL persistence
    let fileBuffer: Buffer | null = null;
    if (file.size <= 15 * 1024 * 1024) {
      if (file.buffer) {
        fileBuffer = file.buffer;
      } else if (file.path && fs.existsSync(file.path)) {
        try {
          fileBuffer = fs.readFileSync(file.path);
        } catch {}
      }
    }

    const media = await prisma.media.create({
      data: {
        ownerId: userId,
        folderId: folderId || null,
        fileName: path.basename(processed.storagePath),
        originalName: file.originalname,
        mimeType: file.mimetype,
        category,
        fileSize: BigInt(file.size),
        fileHash,
        storagePath: processed.storagePath,
        thumbnailPath: processed.thumbnailPath,
        fileData: fileBuffer,
        width: processed.width,
        height: processed.height,
        duration: null,
        takenAt: new Date()
      }
    });

    // 5. Update Storage Usage
    await StorageQuotaService.updateUsage(userId, file.size);

    return {
      duplicateDetected: false,
      media: this.enrichMediaWithUrls(media, userId)
    };
  }

  /**
   * Enrich media record with signed URLs
   */
  static enrichMediaWithUrls(media: any, userId: string) {
    return {
      ...media,
      fileSize: Number(media.fileSize),
      streamUrl: StorageService.getSignedMediaUrl(media.id, userId),
      thumbnailUrl: StorageService.getSignedThumbnailUrl(media.id, userId),
      downloadUrl: `/api/media/${media.id}/download`
    };
  }

  /**
   * List media with filtering, searching, and pagination
   */
  static async listMedia(userId: string, options: MediaFilterOptions) {
    const {
      view = 'photos',
      albumId,
      folderId,
      category,
      search,
      page = 1,
      limit = 50,
      startDate,
      endDate
    } = options;

    const where: any = {
      ownerId: SUCHITH_FAMILY_IDS.includes(userId) ? { in: SUCHITH_FAMILY_IDS } : userId
    };

    if (folderId !== undefined) {
      where.folderId = folderId;
    }

    if (category) {
      where.category = category;
    }

    if (view === 'trash') {
      where.isDeleted = true;
    } else {
      where.isDeleted = false;

      if (view === 'archive') {
        where.isArchived = true;
      } else {
        where.isArchived = false;

        if (view === 'favorites') {
          where.isFavorite = true;
        } else if (view === 'photos') {
          where.mimeType = { startsWith: 'image/' };
        } else if (view === 'videos') {
          where.OR = [
            { mimeType: { startsWith: 'video/' } },
            { category: 'video' },
            { originalName: { endsWith: '.mp4' } },
            { originalName: { endsWith: '.mov' } },
            { originalName: { endsWith: '.webm' } },
            { originalName: { endsWith: '.mkv' } }
          ];
        } else if (view === 'audio') {
          where.OR = [
            { mimeType: { startsWith: 'audio/' } },
            { category: 'audio' },
            { originalName: { endsWith: '.mp3' } },
            { originalName: { endsWith: '.wav' } },
            { originalName: { endsWith: '.m4a' } },
            { originalName: { endsWith: '.flac' } },
            { originalName: { endsWith: '.aac' } }
          ];
        } else if (view === 'documents' || view === 'files') {
          where.NOT = [
            { mimeType: { startsWith: 'image/' } },
            { mimeType: { startsWith: 'video/' } },
            { mimeType: { startsWith: 'audio/' } }
          ];
        }
      }
    }

    if (albumId) {
      where.albumItems = {
        some: { albumId }
      };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { originalName: { contains: q } },
        { fileName: { contains: q } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.media.count({ where }),
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    const enriched = items.map(item => this.enrichMediaWithUrls(item, userId));

    return {
      items: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + items.length < total
      }
    };
  }

  /**
   * Get single media details
   */
  static async getMediaById(mediaId: string, userId: string) {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        albumItems: {
          include: {
            album: { select: { id: true, title: true } }
          }
        }
      }
    });

    if (!media) {
      const error: any = new Error('Media not found.');
      error.statusCode = 404;
      throw error;
    }

    if (!isOwnerOrFamily(media.ownerId, userId)) {
      const error: any = new Error('Forbidden. You do not have permission to access this file.');
      error.statusCode = 403;
      throw error;
    }

    return this.enrichMediaWithUrls(media, userId);
  }

  /**
   * Update media status (Favorite, Archive, Rename)
   */
  static async updateMedia(
    mediaId: string,
    userId: string,
    updates: { isFavorite?: boolean; isArchived?: boolean; originalName?: string; folderId?: string | null }
  ) {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || !isOwnerOrFamily(media.ownerId, userId)) {
      const error: any = new Error('Media not found or forbidden.');
      error.statusCode = !media ? 404 : 403;
      throw error;
    }

    const updated = await prisma.media.update({
      where: { id: mediaId },
      data: updates
    });

    return this.enrichMediaWithUrls(updated, userId);
  }

  /**
   * Move media to Trash (Soft Delete)
   */
  static async moveToTrash(mediaId: string, userId: string) {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || !isOwnerOrFamily(media.ownerId, userId)) {
      const error: any = new Error('Media not found or forbidden.');
      error.statusCode = !media ? 404 : 403;
      throw error;
    }

    const updated = await prisma.media.update({
      where: { id: mediaId },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    return this.enrichMediaWithUrls(updated, userId);
  }

  /**
   * Restore media from Trash
   */
  static async restoreFromTrash(mediaId: string, userId: string) {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || !isOwnerOrFamily(media.ownerId, userId)) {
      const error: any = new Error('Media not found or forbidden.');
      error.statusCode = !media ? 404 : 403;
      throw error;
    }

    const updated = await prisma.media.update({
      where: { id: mediaId },
      data: {
        isDeleted: false,
        deletedAt: null
      }
    });

    return this.enrichMediaWithUrls(updated, userId);
  }

  /**
   * Permanently delete media file
   */
  static async deletePermanently(mediaId: string, userId: string) {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || !isOwnerOrFamily(media.ownerId, userId)) {
      const error: any = new Error('Media not found or forbidden.');
      error.statusCode = !media ? 404 : 403;
      throw error;
    }

    // 1. Delete physical files
    await StorageService.deleteFile(media.storagePath);
    if (media.thumbnailPath) {
      await StorageService.deleteFile(media.thumbnailPath);
    }

    // 2. Remove DB record
    await prisma.media.delete({ where: { id: mediaId } });

    // 3. Free up storage quota
    await StorageQuotaService.updateUsage(userId, -Number(media.fileSize));

    return { success: true, message: 'Media permanently deleted.' };
  }

  /**
   * Empty trash for user
   */
  static async emptyTrash(userId: string) {
    const trashedMedia = await prisma.media.findMany({
      where: { ownerId: userId, isDeleted: true }
    });

    let freedBytes = 0;
    for (const item of trashedMedia) {
      await StorageService.deleteFile(item.storagePath);
      if (item.thumbnailPath) {
        await StorageService.deleteFile(item.thumbnailPath);
      }
      freedBytes += Number(item.fileSize);
    }

    await prisma.media.deleteMany({
      where: { ownerId: userId, isDeleted: true }
    });

    if (freedBytes > 0) {
      await StorageQuotaService.updateUsage(userId, -freedBytes);
    }

    return {
      success: true,
      message: `Trash emptied. ${trashedMedia.length} items permanently deleted.`,
      freedBytes
    };
  }

  /**
   * Automatically purge items in Trash older than 30 days
   */
  static async autoPurgeExpiredTrash() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const expiredItems = await prisma.media.findMany({
      where: {
        isDeleted: true,
        deletedAt: { lte: thirtyDaysAgo }
      }
    });

    if (expiredItems.length === 0) return 0;

    for (const item of expiredItems) {
      await StorageService.deleteFile(item.storagePath);
      if (item.thumbnailPath) {
        await StorageService.deleteFile(item.thumbnailPath);
      }
      await StorageQuotaService.updateUsage(item.ownerId, -Number(item.fileSize));
    }

    const { count } = await prisma.media.deleteMany({
      where: {
        isDeleted: true,
        deletedAt: { lte: thirtyDaysAgo }
      }
    });

    console.log(`[TRASH AUTO-PURGE] Cleaned up ${count} items older than 30 days.`);
    return count;
  }

  /**
   * Bulk action on multiple media items
   */
  static async handleBulkAction(
    userId: string,
    action: 'favorite' | 'unfavorite' | 'archive' | 'unarchive' | 'trash' | 'restore' | 'delete_permanent',
    mediaIds: string[]
  ) {
    const items = await prisma.media.findMany({
      where: {
        id: { in: mediaIds },
        ownerId: userId
      }
    });

    const validIds = items.map(i => i.id);
    if (validIds.length === 0) {
      return { count: 0, message: 'No accessible media found.' };
    }

    switch (action) {
      case 'favorite':
        await prisma.media.updateMany({
          where: { id: { in: validIds } },
          data: { isFavorite: true }
        });
        break;
      case 'unfavorite':
        await prisma.media.updateMany({
          where: { id: { in: validIds } },
          data: { isFavorite: false }
        });
        break;
      case 'archive':
        await prisma.media.updateMany({
          where: { id: { in: validIds } },
          data: { isArchived: true }
        });
        break;
      case 'unarchive':
        await prisma.media.updateMany({
          where: { id: { in: validIds } },
          data: { isArchived: false }
        });
        break;
      case 'trash':
        await prisma.media.updateMany({
          where: { id: { in: validIds } },
          data: { isDeleted: true, deletedAt: new Date() }
        });
        break;
      case 'restore':
        await prisma.media.updateMany({
          where: { id: { in: validIds } },
          data: { isDeleted: false, deletedAt: null }
        });
        break;
      case 'delete_permanent':
        for (const item of items) {
          await StorageService.deleteFile(item.storagePath);
          if (item.thumbnailPath) await StorageService.deleteFile(item.thumbnailPath);
          await StorageQuotaService.updateUsage(userId, -Number(item.fileSize));
        }
        await prisma.media.deleteMany({
          where: { id: { in: validIds } }
        });
        break;
    }

    return { count: validIds.length, message: `Successfully applied ${action} to ${validIds.length} items.` };
  }

  /**
   * Streams a ZIP archive containing multiple selected media files
   */
  static async streamZipDownload(userId: string, mediaIds: string[], res: Response) {
    const items = await prisma.media.findMany({
      where: {
        id: { in: mediaIds },
        ownerId: userId
      }
    });

    if (items.length === 0) {
      res.status(404).json({ success: false, message: 'No downloadable media found.' });
      return;
    }

    const archive = archiver('zip', { zlib: { level: 6 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="memopix_export_${Date.now()}.zip"`);

    archive.pipe(res);

    for (const item of items) {
      const fullPath = StorageService.getAbsolutePath(item.storagePath);
      if (fs.existsSync(fullPath)) {
        archive.file(fullPath, { name: item.originalName });
      }
    }

    await archive.finalize();
  }
}
