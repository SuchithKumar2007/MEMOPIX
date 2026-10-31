import { Router } from 'express';
import { MediaController } from '../controllers/mediaController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.get('/', MediaController.list);
router.post('/upload', uploadMiddleware.single('file'), MediaController.upload);
router.post('/bulk', MediaController.bulkAction);
router.post('/bulk-download', MediaController.bulkDownload);
router.get('/bulk-download', MediaController.bulkDownload);
router.post('/empty-trash', MediaController.emptyTrash);

router.get('/:id', MediaController.getById);
router.get('/:id/download', MediaController.download);
router.patch('/:id', MediaController.update);
router.delete('/:id', MediaController.trash);
router.post('/:id/restore', MediaController.restore);
router.delete('/:id/permanent', MediaController.deletePermanent);

export default router;
