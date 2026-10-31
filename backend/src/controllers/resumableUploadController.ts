import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ResumableUploadService } from '../services/resumableUploadService.js';

export class ResumableUploadController {
  /**
   * POST /api/uploads/initiate
   */
  static async initiate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { fileName, fileSize, mimeType, fileHash, chunkSize, folderId, deviceInfo, forceDuplicate } = req.body;

      if (!fileName || !fileSize) {
        res.status(400).json({ success: false, message: 'Missing required fields: fileName and fileSize.' });
        return;
      }

      const result = await ResumableUploadService.initiateSession(req.user.id, {
        fileName: String(fileName),
        fileSize: Number(fileSize),
        mimeType: String(mimeType || 'application/octet-stream'),
        fileHash: fileHash ? String(fileHash) : undefined,
        chunkSize: chunkSize ? Number(chunkSize) : undefined,
        folderId: folderId ? String(folderId) : undefined,
        deviceInfo: deviceInfo ? String(deviceInfo) : undefined,
        forceDuplicate: forceDuplicate === true || forceDuplicate === 'true'
      });

      res.status(result.duplicateDetected ? 200 : 201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/uploads/:id/chunk
   * Upload single part/chunk
   */
  static async uploadChunk(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const sessionId = String(req.params.id);
      const partNumber = parseInt(req.body.partNumber || req.query.partNumber as string, 10);

      if (isNaN(partNumber) || partNumber < 1) {
        res.status(400).json({ success: false, message: 'Valid partNumber is required.' });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, message: 'Chunk file payload is missing.' });
        return;
      }

      const fileSource = file.path || file.buffer;
      const result = await ResumableUploadService.saveChunk(
        req.user.id,
        sessionId,
        partNumber,
        fileSource
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/uploads/:id/status
   */
  static async getStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const sessionId = String(req.params.id);
      const status = await ResumableUploadService.getSessionStatus(req.user.id, sessionId);

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/uploads/:id/complete
   */
  static async complete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const sessionId = String(req.params.id);
      const result = await ResumableUploadService.completeSession(req.user.id, sessionId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/uploads/:id/abort
   */
  static async abort(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const sessionId = String(req.params.id);
      const result = await ResumableUploadService.abortSession(req.user.id, sessionId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/uploads/pending
   */
  static async listPending(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const pending = await ResumableUploadService.listPendingSessions(req.user.id);

      res.status(200).json({
        success: true,
        data: pending
      });
    } catch (error) {
      next(error);
    }
  }
}
