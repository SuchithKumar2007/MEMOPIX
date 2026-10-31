import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ShareService } from '../services/shareService.js';
import { StorageService } from '../services/storageService.js';
import { createShareLinkSchema, updateShareLinkSchema } from '../validators/mediaValidators.js';
import prisma from '../prisma.js';

export class ShareController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const validated = createShareLinkSchema.parse(req.body);
      const result = await ShareService.createShareLink(req.user.id, validated);

      res.status(201).json({
        success: true,
        message: 'Share link generated.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUserLinks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await ShareService.listUserShareLinks(req.user.id);
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

      const linkId = String(req.params.id);
      const validated = updateShareLinkSchema.parse(req.body);
      const result = await ShareService.updateShareLink(linkId, req.user.id, validated);

      res.status(200).json({
        success: true,
        message: 'Share link updated.',
        data: result
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

      const linkId = String(req.params.id);
      const result = await ShareService.deleteShareLink(linkId, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getSharedByToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = String(req.params.token);
      const result = await ShareService.getSharedResource(token);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async downloadSharedItem(req: Request, res: Response, next: NextFunction) {
    try {
      const token = String(req.params.token);
      const link = await prisma.shareLink.findUnique({
        where: { tokenHash: token },
        include: { media: true }
      });

      if (!link || !link.isActive || (link.expiresAt && link.expiresAt < new Date())) {
        res.status(404).json({ success: false, message: 'Share link invalid or expired.' });
        return;
      }

      if (!link.allowDownload) {
        res.status(403).json({ success: false, message: 'Downloading has been disabled for this share link.' });
        return;
      }

      if (!link.media) {
        res.status(404).json({ success: false, message: 'Media not found.' });
        return;
      }

      const filePath = StorageService.getAbsolutePath(link.media.storagePath);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ success: false, message: 'File not found on storage.' });
        return;
      }

      res.download(filePath, link.media.originalName);
    } catch (error) {
      next(error);
    }
  }
}
