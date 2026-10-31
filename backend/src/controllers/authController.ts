import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/authValidators.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await AuthService.register({
        name: validated.name,
        email: validated.email,
        password: validated.password
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await AuthService.login({
        email: validated.email,
        password: validated.password,
        rememberMe: req.body.rememberMe === true
      });

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await AuthService.getCurrentUser(req.user.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = forgotPasswordSchema.parse(req.body);
      const result = await AuthService.forgotPassword(validated.email);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = resetPasswordSchema.parse(req.body);
      const result = await AuthService.resetPassword(validated.token, validated.password);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response) {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  }

  /**
   * Mock Google sign-in for seamless development/testing when OAuth credentials aren't yet configured
   */
  static async mockGoogleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const email = req.body.email || req.query.email || 'user@gmail.com';
      const name = req.body.name || req.query.name || 'Google User';
      const avatarUrl = req.body.avatarUrl || req.query.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop';

      const result = await AuthService.googleOAuth({
        googleId: `google_${Date.now()}`,
        email: String(email).toLowerCase().trim(),
        name: String(name).trim(),
        avatarUrl: String(avatarUrl)
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/google/callback?token=${result.token}&name=${encodeURIComponent(result.user.name)}&email=${encodeURIComponent(result.user.email)}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Google OAuth callback — exchange Google profile for MEMOPIX JWT
   */
  static async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = (req as any).googleProfile;
      if (!profile) {
        res.status(400).json({ success: false, message: 'Google authentication failed.' });
        return;
      }

      const result = await AuthService.googleOAuth({
        googleId: profile.id,
        email: profile.emails?.[0]?.value || '',
        name: profile.displayName || 'Google User',
        avatarUrl: profile.photos?.[0]?.value
      });

      // Redirect to frontend with token in query param (frontend reads & stores it)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/google/callback?token=${result.token}&name=${encodeURIComponent(result.user.name)}&email=${encodeURIComponent(result.user.email)}`);
    } catch (error) {
      next(error);
    }
  }
}
