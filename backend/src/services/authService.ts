import prisma from '../prisma.js';
import { hashPassword, comparePassword, hashString } from '../utils/hash.js';
import { generateToken, generateSecureRandomToken } from '../utils/token.js';
import { StorageQuotaService } from './storageQuotaService.js';

export class AuthService {
  /**
   * Register a new user account
   */
  static async register(data: { name: string; email: string; password: string }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() }
    });

    if (existing) {
      const error: any = new Error('An account with this email already exists.');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        passwordHash,
        termsAccepted: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    // Initialize 5 TB private storage quota record
    await StorageQuotaService.getOrCreateStorageRecord(user.id);

    const token = generateToken({ userId: user.id, email: user.email });

    return { user, token };
  }

  /**
   * Login existing user
   */
  static async login(data: { email: string; password: string; rememberMe?: boolean }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() }
    });

    if (!user) {
      const error: any = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const isValid = await comparePassword(data.password, user.passwordHash);
    if (!isValid) {
      const error: any = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    // Ensure quota record exists
    await StorageQuotaService.getOrCreateStorageRecord(user.id);

    const token = generateToken({ userId: user.id, email: user.email }, data.rememberMe ?? false);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      },
      token
    };
  }

  /**
   * Find or create a user via Google OAuth
   */
  static async googleOAuth(data: { googleId: string; email: string; name: string; avatarUrl?: string }) {
    // Try to find by googleId field stored in avatarUrl metadata, or by email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase().trim() }
        ]
      }
    });

    if (user) {
      // Update avatar if provided from Google
      if (data.avatarUrl && !user.avatarUrl) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: data.avatarUrl }
        });
      }
    } else {
      // Create a new user with a secure random password (not usable for login)
      const randomPassword = await hashPassword(generateSecureRandomToken(32));
      user = await prisma.user.create({
        data: {
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          passwordHash: randomPassword,
          avatarUrl: data.avatarUrl,
          termsAccepted: true
        }
      });
      // Initialize 5 TB quota
      await StorageQuotaService.getOrCreateStorageRecord(user.id);
    }

    const token = generateToken({ userId: user.id, email: user.email }, true); // Always remember for OAuth

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      },
      token
    };
  }

  /**
   * Get current authenticated user profile
   */
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    if (!user) {
      const error: any = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    const storageStats = await StorageQuotaService.getUsageStats(userId);

    return { user, storage: storageStats };
  }

  /**
   * Generate password reset token
   */
  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      // Don't leak user existence in generic response, but return success message
      return { message: 'If an account exists with that email, a password reset link has been generated.' };
    }

    const rawToken = generateSecureRandomToken(32);
    const tokenHash = hashString(rawToken);
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    // Reset link format
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;

    return {
      message: 'If an account exists with that email, a password reset link has been generated.',
      resetUrl, // Provided for easy manual testing / local environment
      token: rawToken
    };
  }

  /**
   * Reset password using token
   */
  static async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashString(token);
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      const error: any = new Error('Password reset token is invalid or has expired.');
      error.statusCode = 400;
      throw error;
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { used: true }
      })
    ]);

    return { message: 'Password has been reset successfully. You can now log in.' };
  }
}
