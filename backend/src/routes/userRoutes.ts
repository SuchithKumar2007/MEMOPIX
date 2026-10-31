import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.patch('/profile', UserController.updateProfile);
router.post('/change-password', UserController.changePassword);

export default router;
