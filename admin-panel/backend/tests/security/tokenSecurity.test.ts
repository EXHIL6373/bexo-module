import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app';
import { setRepository } from '../../src/db/repository';
import { MemoryRepository } from '../../src/db/repository/memoryRepository';
import { signToken } from '../../src/shared/utils/tokens';
import { env } from '../../src/config/env';

describe('Security — Token Security, Expiration & Cryptographic Integrity', () => {
  let memRepo: MemoryRepository;

  beforeEach(() => {
    memRepo = new MemoryRepository();
    setRepository(memRepo);
  });

  it('Rejects expired token with 401', async () => {
    // Generate token expired 1 hour ago
    const expiredToken = jwt.sign(
      {
        userId: 'usr-super-kavin',
        email: 'kavinbalaji@atbexo.com',
        role: 'super_admin',
        sessionVersion: 1,
        exp: Math.floor(Date.now() / 1000) - 3600,
      },
      env.JWT_SECRET
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('expired');
  });

  it('Rejects token signed with an invalid/forged secret with 401', async () => {
    const forgedToken = jwt.sign(
      {
        userId: 'usr-super-kavin',
        email: 'kavinbalaji@atbexo.com',
        role: 'super_admin',
      },
      'attacker-forged-secret-not-bexo-key'
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Rejects malformed Authorization header with 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'InvalidBearerFormatHere');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Rejects tampered payload inside token with 401', async () => {
    const validToken = signToken({
      userId: 'usr-ops-1',
      email: 'suresh.ops@atbexo.com',
      role: 'ops',
    });

    // Tamper with the middle payload segment
    const parts = validToken.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ userId: 'usr-ops-1', role: 'super_admin' })).toString('base64');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tamperedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
