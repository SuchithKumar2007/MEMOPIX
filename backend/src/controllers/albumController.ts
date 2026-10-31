import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AlbumService } from '../services/albumService.js';
import {
  createAlbumSchema,
  updateAlbumSchema,
  addMediaToAlbumSchema
} from '../validators/mediaValidators.js';

export class AlbumController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await AlbumService.listAlbums(req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const validated = createAlbumSchema.parse(req.body);
      const result = await AlbumService.createAlbum(
        req.user.id,
        validated.title,
        validated.description,
        validated.mediaIds
      );

      res.status(201).json({ success: true, message: 'Album created.', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const albumId = String(req.params.id);
      const result = await AlbumService.getAlbumById(albumId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const albumId = String(req.params.id);
      const validated = updateAlbumSchema.parse(req.body);
      const result = await AlbumService.updateAlbum(albumId, req.user.id, validated);
      res.status(200).json({ success: true, message: 'Album updated.', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const albumId = String(req.params.id);
      const result = await AlbumService.deleteAlbum(albumId, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async addMedia(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const albumId = String(req.params.id);
      const validated = addMediaToAlbumSchema.parse(req.body);
      const result = await AlbumService.addMediaToAlbum(albumId, req.user.id, validated.mediaIds);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async removeMedia(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const albumId = String(req.params.id);
      const mediaId = String(req.params.mediaId);
      const result = await AlbumService.removeMediaFromAlbum(albumId, req.user.id, mediaId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
