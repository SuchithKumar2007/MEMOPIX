import { Router } from 'express';
import { PlaylistController } from '../controllers/playlistController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.get('/', PlaylistController.list);
router.post('/', PlaylistController.create);
router.get('/:id', PlaylistController.getById);
router.patch('/:id', PlaylistController.update);
router.delete('/:id', PlaylistController.delete);
router.post('/:id/tracks', PlaylistController.addTracks);
router.put('/:id/reorder', PlaylistController.reorder);
router.post('/:id/cover', uploadMiddleware.single('file'), PlaylistController.uploadCover);
router.delete('/:id/tracks/:mediaId', PlaylistController.removeTrack);

export default router;
