import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { StorageQuotaService } from '../services/storageQuotaService.js';

export class StorageController {
  static async getUsage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const stats = await StorageQuotaService.getUsageStats(req.user.id);
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  static async recalculate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await StorageQuotaService.recalculateUsage(req.user.id);
      const stats = await StorageQuotaService.getUsageStats(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Storage quota usage recalculated successfully.',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}
