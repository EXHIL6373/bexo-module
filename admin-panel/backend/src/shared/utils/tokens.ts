import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError } from '../errors/AppError';

export const JWT_ISSUER = 'bexo-corporate-admin';
export const JWT_AUDIENCE = 'bexo-admin-panel';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
  collegeId?: string | null;
  name?: string;
  sessionVersion?: number;
  [key: string]: unknown;
}

export function signToken(payload: AuthTokenPayload, expiresIn: string = env.JWT_EXPIRES_IN): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

export function verifyToken<T = AuthTokenPayload>(token: string): T {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as T;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Session token has expired. Please sign in again.');
    }
    throw new UnauthorizedError('Invalid or corrupted session token.');
  }
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
