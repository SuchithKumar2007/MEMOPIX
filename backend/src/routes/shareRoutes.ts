import { Router } from 'express';
import { ShareController } from '../controllers/shareController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public share access routes
router.get('/public/:token', ShareController.getSharedByToken);
router.get('/public/:token/download', ShareController.downloadSharedItem);

// Authenticated user share link management
router.post('/', authenticate, ShareController.create);
router.get('/my-links', authenticate, ShareController.listUserLinks);
router.patch('/:id', authenticate, ShareController.update);
router.delete('/:id', authenticate, ShareController.delete);

export default router;
