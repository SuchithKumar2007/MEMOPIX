import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import { ResumableUploadController } from '../controllers/resumableUploadController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const chunkUpload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB per chunk max (standard chunk size is 5MB)
  }
});

router.use(authenticate);

router.post('/initiate', ResumableUploadController.initiate);
router.post('/:id/chunk', chunkUpload.single('chunk'), ResumableUploadController.uploadChunk);
router.post('/:id/part', chunkUpload.single('file'), ResumableUploadController.uploadChunk);
router.post('/:id/part-url', ResumableUploadController.getStatus); // AWS/S3 compatible mock/direct URL
router.get('/:id/status', ResumableUploadController.getStatus);
router.post('/:id/complete', ResumableUploadController.complete);
router.post('/:id/abort', ResumableUploadController.abort);
router.get('/pending', ResumableUploadController.listPending);

export default router;
