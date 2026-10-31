import { Router } from 'express';
import { MediaController } from '../controllers/mediaController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();

// Public / Token-signed streaming endpoints (no login session required, secured by crypto HMAC token)
router.get('/stream/:token', MediaController.streamMedia);
router.get('/thumbnail-stream/:token', MediaController.streamThumbnail);

// Authenticated endpoints
router.get('/', authenticate, MediaController.list);
router.post('/upload', authenticate, uploadMiddleware.single('file'), MediaController.upload);
router.post('/bulk', authenticate, MediaController.bulkAction);
router.post('/bulk-download', authenticate, MediaController.bulkDownload);
router.get('/bulk-download', authenticate, MediaController.bulkDownload);
router.post('/empty-trash', authenticate, MediaController.emptyTrash);

router.get('/:id', authenticate, MediaController.getById);
router.get('/:id/download', authenticate, MediaController.download);
router.patch('/:id', authenticate, MediaController.update);
router.delete('/:id', authenticate, MediaController.trash);
router.post('/:id/restore', authenticate, MediaController.restore);
router.delete('/:id/permanent', authenticate, MediaController.deletePermanent);

export default router;
