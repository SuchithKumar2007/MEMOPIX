import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { MediaService } from '../services/mediaService.js';
import { StorageService } from '../services/storageService.js';
import { verifySignedMediaToken } from '../utils/token.js';
import { bulkActionSchema } from '../validators/mediaValidators.js';
import prisma from '../prisma.js';

export class MediaController {
  /**
   * Upload single or multiple media files
   */
  static async upload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, message: 'No file uploaded.' });
        return;
      }

      const forceDuplicate = req.body.forceDuplicate === 'true' || req.body.forceDuplicate === true;
      const result = await MediaService.uploadMedia(req.user.id, file, forceDuplicate);

      res.status(result.duplicateDetected ? 200 : 201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List media items for timeline, search, and sections
   */
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const view = req.query.view as any;
      const albumId = req.query.albumId ? String(req.query.albumId) : undefined;
      const folderId = req.query.folderId !== undefined ? (req.query.folderId === 'null' || req.query.folderId === '' ? null : String(req.query.folderId)) : undefined;
      const category = req.query.category ? String(req.query.category) : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;

      const result = await MediaService.listMedia(req.user.id, {
        view,
        albumId,
        folderId,
        category,
        search,
        page,
        limit
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single media
   */
  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const mediaId = String(req.params.id);
      const result = await MediaService.getMediaById(mediaId, req.user.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update media status
   */
  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const mediaId = String(req.params.id);
      const { isFavorite, isArchived, originalName, folderId } = req.body;
      const result = await MediaService.updateMedia(mediaId, req.user.id, {
        isFavorite,
        isArchived,
        originalName,
        folderId: folderId !== undefined ? (folderId === null || folderId === 'null' ? null : String(folderId)) : undefined
      });

      res.status(200).json({
        success: true,
        message: 'Media updated successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Move to trash
   */
  static async trash(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const mediaId = String(req.params.id);
      const result = await MediaService.moveToTrash(mediaId, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Media moved to Trash.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restore from trash
   */
  static async restore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const mediaId = String(req.params.id);
      const result = await MediaService.restoreFromTrash(mediaId, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Media restored successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Permanent delete
   */
  static async deletePermanent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const mediaId = String(req.params.id);
      const result = await MediaService.deletePermanently(mediaId, req.user.id);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Empty trash
   */
  static async emptyTrash(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await MediaService.emptyTrash(req.user.id);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk actions
   */
  static async bulkAction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const validated = bulkActionSchema.parse(req.body);
      const result = await MediaService.handleBulkAction(req.user.id, validated.action, validated.mediaIds);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk download ZIP
   */
  static async bulkDownload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const mediaIds = Array.isArray(req.body.mediaIds) 
        ? req.body.mediaIds 
        : (typeof req.query.ids === 'string' ? (req.query.ids as string).split(',') : []);

      if (mediaIds.length === 0) {
        res.status(400).json({ success: false, message: 'No media selected for download.' });
        return;
      }

      await MediaService.streamZipDownload(req.user.id, mediaIds, res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download single media file
   */
  static async download(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const mediaId = String(req.params.id);
      const media = await prisma.media.findUnique({ where: { id: mediaId } });
      if (!media || media.ownerId !== req.user.id) {
        res.status(403).json({ success: false, message: 'Forbidden. You do not have permission to download this file.' });
        return;
      }

      const fullPath = StorageService.getAbsolutePath(media.storagePath);
      if (!fs.existsSync(fullPath)) {
        res.status(404).json({ success: false, message: 'File not found on storage.' });
        return;
      }

      res.download(fullPath, media.originalName);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Stream media content via signed URL token
   */
  static async streamMedia(req: Request, res: Response) {
    try {
      const token = String(req.params.token);
      const verified = verifySignedMediaToken(token);

      if (!verified) {
        res.status(403).send('Forbidden: Invalid or expired signed media URL.');
        return;
      }

      const media = await prisma.media.findUnique({ where: { id: verified.mediaId } });
      if (!media || media.ownerId !== verified.userId) {
        res.status(403).send('Forbidden: Media access denied.');
        return;
      }

      const filePath = StorageService.getAbsolutePath(media.storagePath);
      if (!fs.existsSync(filePath)) {
        res.status(404).send('File not found.');
        return;
      }

      const stat = await fs.promises.stat(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      res.setHeader('Content-Type', media.mimeType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'private, max-age=86400');

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize) {
          res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
          return;
        }

        const chunkSize = end - start + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': media.mimeType
        });

        fileStream.pipe(res);
      } else {
        res.setHeader('Content-Length', fileSize);
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (err) {
      res.status(500).send('Error streaming media.');
    }
  }

  /**
   * Stream thumbnail via signed URL token
   */
  static async streamThumbnail(req: Request, res: Response) {
    try {
      const token = String(req.params.token);
      const verified = verifySignedMediaToken(token);

      if (!verified) {
        res.status(403).send('Forbidden: Invalid or expired signed thumbnail URL.');
        return;
      }

      const media = await prisma.media.findUnique({ where: { id: verified.mediaId } });
      if (!media || media.ownerId !== verified.userId) {
        res.status(403).send('Forbidden: Thumbnail access denied.');
        return;
      }

      const relativePath = media.thumbnailPath || media.storagePath;
      const filePath = StorageService.getAbsolutePath(relativePath);

      if (!fs.existsSync(filePath)) {
        res.status(404).send('Thumbnail not found.');
        return;
      }

      res.setHeader('Content-Type', media.thumbnailPath ? 'image/webp' : media.mimeType);
      res.setHeader('Cache-Control', 'private, max-age=86400');
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      res.status(500).send('Error streaming thumbnail.');
    }
  }
}
