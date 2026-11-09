import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const DEFAULT_JWT_SECRET = 'memopix_default_jwt_secret_change_in_production_2026';
const FALLBACK_ENV_SECRET = 'memopix_super_secret_jwt_key_5tb_production_2026_x89a7f3';

export const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || FALLBACK_ENV_SECRET;
};

const getAllVerificationSecrets = (): string[] => {
  const current = getJwtSecret();
  return Array.from(new Set([current, FALLBACK_ENV_SECRET, DEFAULT_JWT_SECRET]));
};

export interface TokenPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: TokenPayload, rememberMe: boolean = false): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: rememberMe ? '30d' : '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  for (const secret of getAllVerificationSecrets()) {
    try {
      return jwt.verify(token, secret) as TokenPayload;
    } catch {}
  }
  return null;
}

/**
 * Generates a cryptographically secure random token (e.g. for sharing or password resets)
 */
export function generateSecureRandomToken(byteLength: number = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Generates a signed URL token for private media streaming (defaults to 7 days = 604800s)
 */
export function generateSignedMediaToken(mediaId: string, userId: string, expiresInSeconds: number = 604800): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${mediaId}:${userId}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', getJwtSecret()).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${hmac}`;
}

/**
 * Validates signed media token across any valid application secret
 */
export function verifySignedMediaToken(token: string): { mediaId: string; userId: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, hmac] = parts;
    const payload = Buffer.from(payloadBase64, 'base64url').toString('utf8');

    let isValidHmac = false;
    for (const secret of getAllVerificationSecrets()) {
      const expectedHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      if (hmac.length === expectedHmac.length && crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
        isValidHmac = true;
        break;
      }
    }

    if (!isValidHmac) {
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
