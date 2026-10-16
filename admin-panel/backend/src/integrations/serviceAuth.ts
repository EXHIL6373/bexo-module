import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ServiceToServiceTokenPayload } from './types';

export function generateServiceToken(
  audience: 'bexo-college-panel' | 'bexo-mobile-backend',
  scope: string[] = ['read', 'write']
): string {
  const payload: ServiceToServiceTokenPayload = {
    iss: 'bexo-admin-panel',
    aud: audience,
    sub: 'admin-service-identity',
    scope,
    role: 'corporate_sync',
    exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes validity
  };

  return jwt.sign(payload, env.SERVICE_AUTH_SECRET, { algorithm: 'HS256' });
}

export function verifyServiceToken(
  token: string,
  expectedAudience: 'bexo-college-panel' | 'bexo-mobile-backend'
): ServiceToServiceTokenPayload {
  return jwt.verify(token, env.SERVICE_AUTH_SECRET, {
    algorithms: ['HS256'],
    issuer: 'bexo-admin-panel',
    audience: expectedAudience,
  }) as ServiceToServiceTokenPayload;
}
