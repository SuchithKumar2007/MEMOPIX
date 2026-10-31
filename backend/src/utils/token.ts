import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'memopix_default_jwt_secret_change_in_production_2026';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: TokenPayload, rememberMe: boolean = false): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: rememberMe ? '30d' : '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Generates a cryptographically secure random token (e.g. for sharing or password resets)
 */
export function generateSecureRandomToken(byteLength: number = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Generates a short-lived signed URL token for private media streaming
 */
export function generateSignedMediaToken(mediaId: string, userId: string, expiresInSeconds: number = 3600): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${mediaId}:${userId}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${hmac}`;
}

/**
 * Validates short-lived signed media token
 */
export function verifySignedMediaToken(token: string): { mediaId: string; userId: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, hmac] = parts;
    const payload = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const expectedHmac = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
      return null;
    }

    const [mediaId, userId, expiresAtStr] = payload.split(':');
    const expiresAt = parseInt(expiresAtStr, 10);

    if (Math.floor(Date.now() / 1000) > expiresAt) {
      return null; // Expired
    }

    return { mediaId, userId };
  } catch {
    return null;
  }
}
