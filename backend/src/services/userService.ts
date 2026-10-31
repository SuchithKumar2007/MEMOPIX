import prisma from '../prisma.js';
import { hashPassword, comparePassword } from '../utils/hash.js';

export class UserService {
  /**
   * Update profile details
   */
  static async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name?.trim(),
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    return updated;
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error: any = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      const error: any = new Error('Current password does not match.');
      error.statusCode = 400;
      throw error;
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    return { success: true, message: 'Password changed successfully.' };
  }
}
