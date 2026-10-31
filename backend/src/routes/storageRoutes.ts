import { Router } from 'express';
import { StorageController } from '../controllers/storageController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/usage', StorageController.getUsage);
router.post('/recalculate', StorageController.recalculate);

export default router;
