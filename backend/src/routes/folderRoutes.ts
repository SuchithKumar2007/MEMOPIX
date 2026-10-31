import { Router } from 'express';
import { FolderController } from '../controllers/folderController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', FolderController.list);
router.post('/', FolderController.create);
router.get('/:id', FolderController.getById);
router.patch('/:id', FolderController.update);
router.delete('/:id', FolderController.delete);

export default router;
