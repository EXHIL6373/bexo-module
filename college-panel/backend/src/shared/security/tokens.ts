import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

export const JWT_ISSUER = 'bexo-institutional-gateway';
export const JWT_AUDIENCE = 'bexo-college-panel';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  collegeId: string | null;
  collegeName?: string;
  sessionVersion?: number;
  [key: string]: unknown;
}

export function signToken(payload: TokenPayload, expiresIn: string | number = env.JWT_EXPIRES_IN): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  }) as TokenPayload;
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

