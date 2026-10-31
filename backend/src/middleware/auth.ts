import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token.js';
import prisma from '../prisma.js';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      [key: string]: any;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: Express.User;
}

/**
 * Authentication Middleware
 * Enforces valid session token and loads user profile
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
      return;
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User account not found.'
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Media Ownership Verification Helper
 */
export async function verifyMediaOwnership(mediaId: string, userId: string) {
  const media = await prisma.media.findUnique({
    where: { id: mediaId }
  });

  if (!media) {
    return { status: 404, message: 'Media not found', media: null };
  }

  if (media.ownerId !== userId) {
    return { status: 403, message: 'Forbidden. You do not own this media.', media: null };
  }

  return { status: 200, message: 'OK', media };
}

/**
 * Album Ownership Verification Helper
 */
export async function verifyAlbumOwnership(albumId: string, userId: string) {
  const album = await prisma.album.findUnique({
    where: { id: albumId }
  });

  if (!album) {
    return { status: 404, message: 'Album not found', album: null };
  }

  if (album.ownerId !== userId) {
    return { status: 403, message: 'Forbidden. You do not own this album.', album: null };
  }

  return { status: 200, message: 'OK', album };
}
