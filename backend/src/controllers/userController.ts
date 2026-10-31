import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UserService } from '../services/userService.js';
import { updateProfileSchema, changePasswordSchema } from '../validators/authValidators.js';

export class UserController {
  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const validated = updateProfileSchema.parse(req.body);
      const result = await UserService.updateProfile(req.user.id, validated);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const validated = changePasswordSchema.parse(req.body);
      const result = await UserService.changePassword(
        req.user.id,
        validated.currentPassword,
        validated.newPassword
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
