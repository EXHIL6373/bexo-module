import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setRepository } from '../../src/db/repository';
import { MemoryRepository } from '../../src/db/repository/memoryRepository';
import { signToken, hashToken, generateSecureToken } from '../../src/shared/utils/tokens';

describe('Security — Raw Token Removal & Atomic Token Consumption', () => {
  let memRepo: MemoryRepository;
  let adminToken: string;

  beforeEach(() => {
    memRepo = new MemoryRepository();
    setRepository(memRepo);

    adminToken = signToken({
      userId: 'usr-super-kavin',
      email: 'kavinbalaji@atbexo.com',
      role: 'super_admin',
      name: 'Kavinbalaji S K',
      collegeId: null,
      sessionVersion: 1,
    });
    memRepo.createSession({
      userId: 'usr-super-kavin',
      tokenHash: hashToken(adminToken),
      sessionVersion: 1,
      expiresAt: new Date(Date.now() + 86400000),
    });
  });

  it('Verifies NO raw token is persisted in storage during password reset request', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'kavinbalaji@atbexo.com' });

    expect(res.status).toBe(200);
    const rawToken = res.body.data.token;
    expect(rawToken).toBeDefined();

    // Inspect repository resetTokens directly
    const persisted = memRepo.resetTokens[memRepo.resetTokens.length - 1];
    expect(persisted).toBeDefined();
    expect(persisted.tokenHash).toBe(hashToken(rawToken));

    // Verify rawToken is strictly undefined / not stored
    expect(persisted.rawToken).toBeUndefined();
    expect(persisted.token).toBeUndefined();
  });

  it('Verifies NO raw token is persisted in storage during invitation creation', async () => {
    const res = await request(app)
      .post('/api/v1/invitations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'security.analyst@atbexo.com',
        fullName: 'Security Analyst',
        role: 'ops',
        designation: 'SecOps Tier 3',
      });

    expect(res.status).toBe(201);
    const rawToken = res.body.data.rawToken;
    expect(rawToken).toBeDefined();

    // Inspect repository invitations directly
    const persisted = memRepo.invitations[memRepo.invitations.length - 1];
    expect(persisted).toBeDefined();
    expect(persisted.tokenHash).toBe(hashToken(rawToken));

    // Verify rawToken is strictly undefined / not stored
    expect(persisted.rawToken).toBeUndefined();
    expect(persisted.token).toBeUndefined();
  });

  it('Atomically rejects concurrent consumption of the same password reset token', async () => {
    // 1. Generate reset token
    const rawToken = generateSecureToken(32);
    const tokenH = hashToken(rawToken);
    await memRepo.createPasswordResetToken({
      userId: 'usr-super-kavin',
      email: 'kavinbalaji@atbexo.com',
      tokenHash: tokenH,
      expiresAt: new Date(Date.now() + 3600000),
    });

    // 2. Fire two concurrent reset requests with the same token
    const req1 = request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, newPassword: 'FirstConcurrentPass123!' });

    const req2 = request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, newPassword: 'SecondConcurrentPass123!' });

    const [res1, res2] = await Promise.all([req1, req2]);

    // Exactly one must succeed (200) and one must be rejected (400)
    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 400]);

    const failedRes = res1.status === 400 ? res1 : res2;
    expect(failedRes.body.success).toBe(false);
    expect(failedRes.body.message).toMatch(/invalid|expired|used/i);
  });

  it('Atomically rejects concurrent consumption of the same invitation token', async () => {
    // 1. Create invitation
    const rawToken = generateSecureToken(32);
    const tokenH = hashToken(rawToken);
    await memRepo.createInvitation({
      email: 'concurrent.inv@atbexo.com',
      fullName: 'Concurrent User',
      role: 'ops',
      designation: 'Operations Lead',
      tokenHash: tokenH,
      status: 'INVITED',
      expiresAt: new Date(Date.now() + 86400000),
    });

    // 2. Fire two concurrent activation requests
    const req1 = request(app)
      .post('/api/v1/auth/activate-account')
      .send({ token: rawToken, password: 'FirstPassword123!' });

    const req2 = request(app)
      .post('/api/v1/auth/activate-account')
      .send({ token: rawToken, password: 'SecondPassword123!' });

    const [res1, res2] = await Promise.all([req1, req2]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 400]);

    const failedRes = res1.status === 400 ? res1 : res2;
    expect(failedRes.body.success).toBe(false);
    expect(failedRes.body.message).toMatch(/invalid|expired|consumed/i);
  });

  it('Rejects expired or already consumed reset tokens', async () => {
    // Expired token
    const rawToken = generateSecureToken(32);
    const tokenH = hashToken(rawToken);
    await memRepo.createPasswordResetToken({
      userId: 'usr-super-kavin',
      email: 'kavinbalaji@atbexo.com',
      tokenHash: tokenH,
      expiresAt: new Date(Date.now() - 3600000), // 1 hour in the past
    });

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, newPassword: 'ValidNewPassword123!' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
