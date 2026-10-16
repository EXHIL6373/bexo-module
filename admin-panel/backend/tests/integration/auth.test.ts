import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setRepository } from '../../src/db/repository';
import { MemoryRepository } from '../../src/db/repository/memoryRepository';
import { hashPassword } from '../../src/shared/utils/passwords';
import { hashToken } from '../../src/shared/utils/tokens';

describe('Integration — Authentication & Session Lifecycle', () => {
  let memRepo: MemoryRepository;

  beforeEach(async () => {
    memRepo = new MemoryRepository();
    // Seed test password for kavinbalaji
    const passwordHash = await hashPassword('ValidPassword123!');
    const user = memRepo.staffUsers.find((u) => u.email === 'kavinbalaji@atbexo.com');
    if (user) {
      user.passwordHash = passwordHash;
    }
    setRepository(memRepo);
  });

  it('Authenticates valid corporate administrator and returns token with envelope', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kavinbalaji@atbexo.com', password: 'ValidPassword123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('kavinbalaji@atbexo.com');
    expect(res.body.data.user.role).toBe('super_admin');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('Rejects invalid password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kavinbalaji@atbexo.com', password: 'WrongPassword999!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid corporate credentials');
  });

  it('Rejects nonexistent user with 401 (enumeration resistance)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@atbexo.com', password: 'AnyPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid corporate credentials');
  });

  it('Multi-tenant perimeter guard: rejects college staff login with 403 and specific message', async () => {
    const passwordHash = await hashPassword('CollegeStaffPass123!');
    const collegeUser = memRepo.staffUsers.find((u) => u.email === 'venkatesh.r@psgtech.edu');
    if (collegeUser) {
      collegeUser.passwordHash = passwordHash;
    }

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'venkatesh.r@psgtech.edu', password: 'CollegeStaffPass123!' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Institutional Access Restricted: This portal is for central BEXO corporate administrators. College staff must access via the dedicated College Portal.');
  });

  it('Rejects inactive / suspended corporate accounts with 403', async () => {
    const passwordHash = await hashPassword('InactivePass123!');
    const inactiveUser = memRepo.staffUsers.find((u) => u.email === 'inactive@atbexo.com');
    if (inactiveUser) {
      inactiveUser.passwordHash = passwordHash;
    }

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'inactive@atbexo.com', password: 'InactivePass123!' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('suspended or inactive');
  });

  it('Provides profile via GET /auth/me for authenticated user', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kavinbalaji@atbexo.com', password: 'ValidPassword123!' });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.id).toBe('usr-super-kavin');
    expect(meRes.body.data.email).toBe('kavinbalaji@atbexo.com');
  });

  it('Invalidates session on POST /auth/logout', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kavinbalaji@atbexo.com', password: 'ValidPassword123!' });

    const token = loginRes.body.data.token;

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
  });

  it('Password reset: initiates reset link with generic response', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'kavinbalaji@atbexo.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();

    const resetToken = res.body.data.token;

    // Validate reset token
    const validateRes = await request(app)
      .get(`/api/v1/auth/reset-password/validate?token=${encodeURIComponent(resetToken)}`);

    expect(validateRes.status).toBe(200);
    expect(validateRes.body.data.valid).toBe(true);
    expect(validateRes.body.data.email).toBe('kavinbalaji@atbexo.com');

    // Complete password reset
    const completeRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, newPassword: 'NewValidPassword456!' });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.success).toBe(true);

    // Replay prevention: reusing the token must fail
    const replayRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, newPassword: 'AnotherPassword789!' });

    expect(replayRes.status).toBe(400);
    expect(replayRes.body.success).toBe(false);
  });

  it('Invitation activation: validates invite token and activates account with password', async () => {
    const rawInviteToken = 'secure_invitation_token_123';
    const invite = await memRepo.createInvitation({
      email: 'newcorpstaff@atbexo.com',
      fullName: 'New Staff Member',
      role: 'ops',
      designation: 'Operations Specialist',
      tokenHash: hashToken(rawInviteToken),
      status: 'INVITED',
    });

    // Validate invite
    const valRes = await request(app)
      .get(`/api/v1/auth/invitations/validate?token=${encodeURIComponent(rawInviteToken)}`);

    expect(valRes.status).toBe(200);
    expect(valRes.body.data.valid).toBe(true);

    // Activate account
    const actRes = await request(app)
      .post('/api/v1/auth/activate-account')
      .send({ token: rawInviteToken, password: 'ActivatedPassword123!' });

    expect(actRes.status).toBe(200);
    expect(actRes.body.success).toBe(true);
    expect(actRes.body.data.user.email).toBe('newcorpstaff@atbexo.com');

    // Replay prevention: cannot activate twice
    const replayActRes = await request(app)
      .post('/api/v1/auth/activate-account')
      .send({ token: rawInviteToken, password: 'ActivatedPassword123!' });

    expect(replayActRes.status).toBe(400);
  });
});
