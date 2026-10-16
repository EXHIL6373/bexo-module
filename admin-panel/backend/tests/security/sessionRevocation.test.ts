import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app';
import { setRepository } from '../../src/db/repository';
import { MemoryRepository } from '../../src/db/repository/memoryRepository';
import { hashToken } from '../../src/shared/utils/tokens';
import { env } from '../../src/config/env';

describe('Security — Comprehensive Session Revocation & Invalidation', () => {
  let memRepo: MemoryRepository;

  beforeEach(() => {
    memRepo = new MemoryRepository();
    setRepository(memRepo);
  });

  it('Rejects old bearer token with 401 after logout', async () => {
    // 1. Authenticate user
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kavinbalaji@atbexo.com', password: 'AdminPassword123!' });

    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.token;

    // 2. Verify token works before logout
    const preRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(preRes.status).toBe(200);

    // 3. Logout
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logoutRes.status).toBe(200);

    // 4. Old token MUST receive 401 after logout
    const postRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(postRes.status).toBe(401);
    expect(postRes.body.success).toBe(false);
    expect(postRes.body.message).toMatch(/revoked|invalidated|outdated/i);
  });

  it('Invalidates cookie-based session on logout and rejects subsequent requests', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kavinbalaji@atbexo.com', password: 'AdminPassword123!' });

    expect(loginRes.status).toBe(200);
    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const bexoCookie = cookies.find((c: string) => c.startsWith('bexo_token='));
    expect(bexoCookie).toBeDefined();

    // Verify access with cookie
    const preRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', bexoCookie);
    expect(preRes.status).toBe(200);

    // Logout with cookie
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', bexoCookie);
    expect(logoutRes.status).toBe(200);

    // Verify session revoked
    const postRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', bexoCookie);
    expect(postRes.status).toBe(401);
  });

  it('Rejects old bearer token with 401 after password reset', async () => {
    // 1. Authenticate user
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kavinbalaji@atbexo.com', password: 'AdminPassword123!' });
    const oldToken = loginRes.body.data.token;

    // 2. Request password reset
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'kavinbalaji@atbexo.com' });
    const resetToken = forgotRes.body.data.token;

    // 3. Complete password reset
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, newPassword: 'NewPassword999!' });
    expect(resetRes.status).toBe(200);

    // 4. Old bearer token MUST be rejected with 401
    const postRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${oldToken}`);

    expect(postRes.status).toBe(401);
    expect(postRes.body.success).toBe(false);
  });

  it('Rejects token with 403 when user account is deactivated or suspended', async () => {
    // 1. Authenticate ops user
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'suresh.ops@atbexo.com', password: 'AdminPassword123!' });
    const token = loginRes.body.data.token;

    // 2. Verify token works
    const preRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(preRes.status).toBe(200);

    // 3. Deactivate user account
    const user = await memRepo.getStaffByEmail('suresh.ops@atbexo.com');
    await memRepo.updateStaffUser(user.id, { isActive: false, accountStatus: 'SUSPENDED' });
    await memRepo.bumpSessionVersion(user.id);
    await memRepo.revokeAllUserSessions(user.id);

    // 4. Subsequent request with existing token MUST be rejected
    const postRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect([401, 403]).toContain(postRes.status);
    expect(postRes.body.success).toBe(false);
  });

  it('Rejects tokens signed with wrong issuer or audience with 401', async () => {
    const wrongIssuerToken = jwt.sign(
      {
        userId: 'usr-super-kavin',
        email: 'kavinbalaji@atbexo.com',
        role: 'super_admin',
        sessionVersion: 1,
      },
      env.JWT_SECRET,
      {
        algorithm: 'HS256',
        issuer: 'wrong-issuer-attacker',
        audience: 'bexo-admin-panel',
      }
    );

    // Create session in repo so it only fails on token verification
    await memRepo.createSession({
      userId: 'usr-super-kavin',
      tokenHash: hashToken(wrongIssuerToken),
      sessionVersion: 1,
      expiresAt: new Date(Date.now() + 3600000),
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${wrongIssuerToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
