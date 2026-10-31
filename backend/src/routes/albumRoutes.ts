import { Router } from 'express';
import { AlbumController } from '../controllers/albumController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', AlbumController.list);
router.post('/', AlbumController.create);
router.get('/:id', AlbumController.getById);
router.patch('/:id', AlbumController.update);
router.delete('/:id', AlbumController.delete);
router.post('/:id/media', AlbumController.addMedia);
router.delete('/:id/media/:mediaId', AlbumController.removeMedia);

export default router;
