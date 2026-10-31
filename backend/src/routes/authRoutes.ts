import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { isGoogleOAuthConfigured } from '../config/googleStrategy.js';

const router = Router();

// Standard Auth
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/me', authenticate, AuthController.me);

// Google OAuth 2.0
// Step 1: Redirect user to Google consent screen (or interactive Google Account selector if credentials are not yet set)
router.get('/google', (req: Request, res: Response, next: NextFunction) => {
  if (isGoogleOAuthConfigured()) {
    return passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
  }

  // Pure Inline CSS - zero external CDN dependency, 100% pixel-perfect
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sign in with Google - MEMOPIX</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { background-color: #F8FAFC; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; color: #1E293B; }
        .card { background: #FFFFFF; width: 100%; max-width: 440px; border-radius: 24px; border: 1px solid #E2E8F0; box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.08); padding: 32px; text-align: center; }
        .google-icon { width: 44px; height: 44px; margin: 0 auto 16px auto; display: block; }
        h1 { font-size: 22px; font-weight: 700; color: #0F172A; margin-bottom: 6px; }
        p.subtitle { font-size: 13px; color: #64748B; margin-bottom: 24px; }
        .account-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; text-align: left; }
        .account-btn { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 1px solid #E2E8F0; border-radius: 16px; text-decoration: none; color: inherit; transition: all 0.2s ease; background: #FFFFFF; }
        .account-btn:hover { border-color: #3B82F6; background: #EFF6FF; }
        .account-info { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #DBEAFE; }
        .name { font-size: 14px; font-weight: 600; color: #0F172A; }
        .email { font-size: 12px; color: #64748B; }
        .badge { font-size: 11px; font-weight: 700; background: #DBEAFE; color: #1D4ED8; padding: 4px 10px; border-radius: 999px; }
        .divider { border-top: 1px solid #F1F5F9; margin: 20px 0; }
        .form-group { display: flex; flex-direction: column; gap: 8px; text-align: left; }
        label { font-size: 12px; font-weight: 600; color: #475569; }
        input { width: 100%; padding: 10px 14px; border: 1px solid #CBD5E1; border-radius: 12px; font-size: 13px; outline: none; transition: border-color 0.2s; }
        input:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
        .submit-btn { width: 100%; padding: 12px; background: #2563EB; color: white; border: none; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-top: 8px; }
        .submit-btn:hover { background: #1D4ED8; }
        .footer-note { font-size: 11px; color: #94A3B8; margin-top: 20px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <svg class="google-icon" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <h1>Sign in with Google</h1>
        <p class="subtitle">Choose an account to continue to <strong>MEMOPIX 5 TB Cloud</strong></p>

        <div class="account-list">
          <a href="/api/auth/google/mock?name=Suchith&email=suchith@gmail.com&avatarUrl=https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" class="account-btn">
            <div class="account-info">
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" class="avatar" alt="Avatar" />
              <div>
                <div class="name">Suchith</div>
                <div class="email">suchith@gmail.com</div>
              </div>
            </div>
            <span class="badge">5 TB</span>
          </a>

          <a href="/api/auth/google/mock?name=Alex+Morgan&email=alex.morgan@gmail.com&avatarUrl=https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" class="account-btn">
            <div class="account-info">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" class="avatar" alt="Avatar" />
              <div>
                <div class="name">Alex Morgan</div>
                <div class="email">alex.morgan@gmail.com</div>
              </div>
            </div>
            <span class="badge">5 TB</span>
          </a>
        </div>

        <div class="divider"></div>

        <form action="/api/auth/google/mock" method="GET" class="form-group">
          <label>Or enter any Google account:</label>
          <input type="text" name="name" placeholder="Full Name (e.g. Suchith)" required />
          <input type="email" name="email" placeholder="Google Email (e.g. user@gmail.com)" required />
          <button type="submit" class="submit-btn">Continue to MEMOPIX</button>
        </form>

        <p class="footer-note">
          5 TB Private Cloud Storage automatically provisioned upon sign in.
        </p>
      </div>
    </body>
    </html>
  `);
});

// Mock handler for instant test Google sign-in
router.get('/google/mock', AuthController.mockGoogleLogin);

// Step 2: Handle real Google callback
router.get('/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    if (!isGoogleOAuthConfigured()) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`);
    }
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_failed` },
      (err: any, user: any) => {
        if (err || !user) {
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_failed`);
        }
        (req as any).googleProfile = user;
        next();
      }
    )(req, res, next);
  },
  AuthController.googleCallback
);

export default router;
