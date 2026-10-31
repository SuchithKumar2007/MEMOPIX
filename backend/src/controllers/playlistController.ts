import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { PlaylistService } from '../services/playlistService.js';

export class PlaylistController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const playlists = await PlaylistService.listPlaylists(req.user.id);
      res.status(200).json({ success: true, data: playlists });
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

      const { title, description, mediaIds } = req.body;
      if (!title || !title.trim()) {
        res.status(400).json({ success: false, message: 'Playlist title is required.' });
        return;
      }

      const playlist = await PlaylistService.createPlaylist(req.user.id, title, description, mediaIds);
      res.status(201).json({ success: true, data: playlist });
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

      const playlist = await PlaylistService.getPlaylistById(req.user.id, String(req.params.id));
      res.status(200).json({ success: true, data: playlist });
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

      const updated = await PlaylistService.updatePlaylist(req.user.id, String(req.params.id), req.body);
      res.status(200).json({ success: true, data: updated });
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

      const result = await PlaylistService.deletePlaylist(req.user.id, String(req.params.id));
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async addTracks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { mediaIds } = req.body;
      if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
        res.status(400).json({ success: false, message: 'Array of mediaIds is required.' });
        return;
      }

      const playlist = await PlaylistService.addTracks(req.user.id, String(req.params.id), mediaIds);
      res.status(200).json({ success: true, data: playlist });
    } catch (error) {
      next(error);
    }
  }

  static async removeTrack(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await PlaylistService.removeTrack(req.user.id, String(req.params.id), String(req.params.mediaId));
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
