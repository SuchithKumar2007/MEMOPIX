import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { generateSignedMediaToken } from '../utils/token.js';

const STORAGE_ROOT = path.resolve(process.cwd(), process.env.LOCAL_STORAGE_PATH || './storage_data');
const MEDIA_DIR = path.join(STORAGE_ROOT, 'media');
const THUMB_DIR = path.join(STORAGE_ROOT, 'thumbnails');

// Ensure base directories exist
if (!fs.existsSync(STORAGE_ROOT)) fs.mkdirSync(STORAGE_ROOT, { recursive: true });
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR, { recursive: true });

export interface ProcessedMediaResult {
  storagePath: string;
  thumbnailPath: string | null;
  width: number | null;
  height: number | null;
  fileSize: number;
}

export class StorageService {
  /**
   * Saves uploaded file (from Buffer or disk temp path) to private owner directory and generates thumbnail if image
   */
  static async saveMediaFile(
    ownerId: string,
    fileSource: Buffer | string,
    fileName: string,
    mimeType: string
  ): Promise<ProcessedMediaResult> {
    const userMediaDir = path.join(MEDIA_DIR, ownerId);
    const userThumbDir = path.join(THUMB_DIR, ownerId);

    if (!fs.existsSync(userMediaDir)) fs.mkdirSync(userMediaDir, { recursive: true });
    if (!fs.existsSync(userThumbDir)) fs.mkdirSync(userThumbDir, { recursive: true });

    const safeUniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const targetFilePath = path.join(userMediaDir, safeUniqueName);

    let fileSize = 0;

    if (typeof fileSource === 'string') {
      // Streamed directly from disk: move or copy to private media directory
      try {
        await fs.promises.rename(fileSource, targetFilePath);
      } catch {
        await fs.promises.copyFile(fileSource, targetFilePath);
        await fs.promises.unlink(fileSource).catch(() => {});
      }
      const stat = await fs.promises.stat(targetFilePath);
      fileSize = stat.size;
    } else {
      // Buffer in memory
      await fs.promises.writeFile(targetFilePath, fileSource);
      fileSize = fileSource.length;
    }

    let width: number | null = null;
    let height: number | null = null;
    let thumbnailPath: string | null = null;

    // Process image thumbnails
    if (mimeType.startsWith('image/')) {
      try {
        const imageInput = typeof fileSource === 'string' ? targetFilePath : fileSource;
        const metadata = await sharp(imageInput).metadata();
        width = metadata.width || null;
        height = metadata.height || null;

        const thumbName = `thumb_${path.parse(safeUniqueName).name}.webp`;
        const thumbFilePath = path.join(userThumbDir, thumbName);

        await sharp(imageInput)
          .resize(480, 480, { fit: 'cover', position: 'center' })
          .webp({ quality: 80 })
          .toFile(thumbFilePath);

        thumbnailPath = path.relative(STORAGE_ROOT, thumbFilePath).replace(/\\/g, '/');
      } catch (err) {
        console.warn('Thumbnail generation warning:', err);
      }
    }

    const storageRelativePath = path.relative(STORAGE_ROOT, targetFilePath).replace(/\\/g, '/');

    return {
      storagePath: storageRelativePath,
      thumbnailPath,
      width,
      height,
      fileSize
    };
  }

  /**
   * Generates a short-lived signed URL for private access
   */
  static getSignedMediaUrl(mediaId: string, userId: string, expiresInSeconds: number = 3600): string {
    const token = generateSignedMediaToken(mediaId, userId, expiresInSeconds);
    return `/api/media/stream/${token}`;
  }

  /**
   * Generates a short-lived signed thumbnail URL
   */
  static getSignedThumbnailUrl(mediaId: string, userId: string, expiresInSeconds: number = 3600): string {
    const token = generateSignedMediaToken(mediaId, userId, expiresInSeconds);
    return `/api/media/thumbnail-stream/${token}`;
  }

  /**
   * Resolves physical file path from relative storage path
   */
  static getAbsolutePath(relativePath: string): string {
    return path.join(STORAGE_ROOT, relativePath);
  }

  /**
   * Deletes physical files when permanent deletion occurs
   */
  static async deleteFile(relativePath: string): Promise<void> {
    try {
      const fullPath = this.getAbsolutePath(relativePath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (err) {
      console.warn('Error deleting physical file:', err);
    }
  }
}
