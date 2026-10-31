import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { FolderService } from '../services/folderService.js';

export class FolderController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const parentId = req.query.parentId === undefined ? undefined : (req.query.parentId === 'null' || req.query.parentId === '' ? null : String(req.query.parentId));
      const folders = await FolderService.listFolders(req.user.id, parentId);

      res.status(200).json({
        success: true,
        data: folders
      });
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

      const { name, parentId, color } = req.body;
      if (!name || !name.trim()) {
        res.status(400).json({ success: false, message: 'Folder name is required.' });
        return;
      }

      const folder = await FolderService.createFolder(req.user.id, name, parentId, color);

      res.status(201).json({
        success: true,
        data: folder
      });
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

      const folderId = String(req.params.id);
      const folder = await FolderService.getFolderById(req.user.id, folderId);

      res.status(200).json({
        success: true,
        data: folder
      });
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

      const folderId = String(req.params.id);
      const { name, color, parentId } = req.body;
      const updated = await FolderService.updateFolder(req.user.id, folderId, { name, color, parentId });

      res.status(200).json({
        success: true,
        data: updated
      });
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

      const folderId = String(req.params.id);
      const result = await FolderService.deleteFolder(req.user.id, folderId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
