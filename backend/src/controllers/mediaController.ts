import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
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
        if (media.fileData && media.fileData.length > 0) {
          try {
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, media.fileData);
          } catch {}
        } else {
          res.status(404).json({ success: false, message: 'File not found on storage.' });
          return;
        }
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
      // Direct CORS headers for cross-origin audio/video streaming & range requests
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization, Content-Type, Origin, Accept');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Type');

      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }

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
        if (media.fileData && media.fileData.length > 0) {
          try {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, media.fileData);
          } catch {}
        } else {
          res.status(404).send('File not found.');
          return;
        }
      }

      const stat = await fs.promises.stat(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      // Determine accurate MIME type to prevent browser playback decode failure
      let mimeType = media.mimeType || '';
      const lowerName = (media.originalName || media.fileName || '').toLowerCase();
      if (!mimeType || mimeType === 'application/octet-stream') {
        if (lowerName.endsWith('.mp3')) mimeType = 'audio/mpeg';
        else if (lowerName.endsWith('.wav')) mimeType = 'audio/wav';
        else if (lowerName.endsWith('.m4a')) mimeType = 'audio/mp4';
        else if (lowerName.endsWith('.aac')) mimeType = 'audio/aac';
        else if (lowerName.endsWith('.ogg')) mimeType = 'audio/ogg';
        else if (lowerName.endsWith('.flac')) mimeType = 'audio/flac';
        else if (lowerName.endsWith('.webm') || lowerName.endsWith('.weba')) mimeType = 'audio/webm';
        else if (lowerName.endsWith('.mp4')) mimeType = 'video/mp4';
        else if (lowerName.endsWith('.mov')) mimeType = 'video/quicktime';
        else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (lowerName.endsWith('.png')) mimeType = 'image/png';
        else if (lowerName.endsWith('.webp')) mimeType = 'image/webp';
        else mimeType = 'audio/mpeg';
      }

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'private, max-age=86400');

      if (req.method === 'HEAD') {
        res.setHeader('Content-Length', fileSize);
        res.status(200).end();
        return;
      }

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (isNaN(start) || start >= fileSize || (parts[1] && end >= fileSize) || start > end) {
          res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
          return;
        }

        const chunkSize = end - start + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimeType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range, Authorization, Content-Type, Origin, Accept',
          'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length, Content-Type'
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
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization, Content-Type, Origin, Accept');

      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }

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

      const lowerName = (media.originalName || media.fileName || '').toLowerCase();
      const isVideo = media.category === 'video' || (media.mimeType && media.mimeType.startsWith('video/')) || lowerName.endsWith('.mp4') || lowerName.endsWith('.mov') || lowerName.endsWith('.webm');
      const isAudio = media.category === 'audio' || (media.mimeType && media.mimeType.startsWith('audio/')) || lowerName.endsWith('.mp3') || lowerName.endsWith('.wav') || lowerName.endsWith('.m4a');
      const isDoc = media.category === 'document' || lowerName.endsWith('.pdf') || lowerName.endsWith('.docx') || lowerName.endsWith('.txt');

      const relativePath = media.thumbnailPath || media.storagePath;
      const filePath = StorageService.getAbsolutePath(relativePath);

      if (!fs.existsSync(filePath) && media.fileData && media.fileData.length > 0) {
        try {
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
          fs.writeFileSync(filePath, media.fileData);
        } catch {}
      }

      // If file doesn't exist on disk, or if video/audio/doc has no sharp image thumbnail:
      if (!fs.existsSync(filePath) || (!media.thumbnailPath && (isVideo || isAudio || isDoc))) {
        const category = isVideo ? 'video' : isAudio ? 'audio' : isDoc ? 'document' : 'photo';
        const svg = generateFallbackThumbnailSvg(media.originalName, category);
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(svg);
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

export function generateFallbackThumbnailSvg(title: string, category: string): string {
  const safeTitle = (title || 'Media File').replace(/[<>&'"]/g, '');
  const isVideo = category === 'video';
  const isAudio = category === 'audio';
  const isDoc = category === 'document';
  
  const bg1 = isVideo ? '#1E1B4B' : isAudio ? '#2E1065' : isDoc ? '#0F172A' : '#111827';
  const bg2 = isVideo ? '#0F172A' : isAudio ? '#17052E' : isDoc ? '#090D16' : '#030712';
  const accent = isVideo ? '#818CF8' : isAudio ? '#C084FC' : isDoc ? '#38BDF8' : '#A855F7';
  const categoryLabel = (isVideo ? 'VIDEO' : isAudio ? 'AUDIO' : isDoc ? 'DOCUMENT' : 'MEDIA');

  let iconSvg = '';
  if (isVideo) {
    iconSvg = `<polygon points="232,192 264,210 232,228" fill="${accent}"/>`;
  } else if (isAudio) {
    iconSvg = `<path d="M226,192 L226,226 A14,14 0 1,1 212,212 M226,198 L254,190 L254,222 A14,14 0 1,1 240,208" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>`;
  } else {
    iconSvg = `<path d="M220,185 L250,185 L260,195 L260,235 L220,235 Z" fill="none" stroke="${accent}" stroke-width="3"/><polyline points="250,185 250,195 260,195" fill="none" stroke="${accent}" stroke-width="2"/>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}" />
      <stop offset="100%" stop-color="${bg2}" />
    </linearGradient>
  </defs>
  <rect width="480" height="480" rx="28" fill="url(#grad)" />
  <circle cx="240" cy="210" r="54" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-width="2" stroke-opacity="0.3" />
  ${iconSvg}
  <text x="240" y="300" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600" fill="#F8FAFC" text-anchor="middle">${safeTitle.slice(0, 26)}</text>
  <text x="240" y="328" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="${accent}" text-anchor="middle" letter-spacing="2">${categoryLabel}</text>
</svg>`;
}
