import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app';
import { repository } from '../../src/db/repository';
import { env } from '../../src/config/env';

function generateTestPhone(): string {
  return `+919${Math.floor(100000000 + Math.random() * 900000000)}`;
}

function createSignedMockGoogleToken(payload: Partial<any>): string {
  const fullPayload = {
    iss: 'https://accounts.google.com',
    sub: `g-sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    email: `test.user.${Date.now()}.${Math.random().toString(36).slice(2, 5)}@gmail.com`,
    email_verified: true,
    name: 'Verified Google User',
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...payload,
  };
  return jwt.sign(fullPayload, env.JWT_SECRET, { algorithm: 'HS256' });
}

describe('Auth Endpoints — Phone OTP, Role Discovery & Google Integration (Admin API)', () => {
  describe('1. Phone OTP Request & Verification', () => {
    it('dispatches OTP for valid phone and masks phone in response', async () => {
      const phone = generateTestPhone();
      const res = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phoneNumber: phone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.challengeId).toBeDefined();
      expect(res.body.data.phoneNumber).toBe(phone);
      expect(res.body.data.maskedPhoneNumber).toContain('******');
    });

    it('rejects malformed phone numbers with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phoneNumber: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('verifies valid OTP, discovers normal_user persona, and issues session cookie & token', async () => {
      const phone = generateTestPhone();
      const reqRes = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phoneNumber: phone });

      const challengeId = reqRes.body.data.challengeId;
      const debugOtp = reqRes.body.data.debugOtp;
      expect(debugOtp).toBeDefined();

      const verifyRes = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ challengeId, otp: debugOtp });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.data.token).toBeDefined();
      expect(verifyRes.body.data.user.role).toBe('normal_user');
      expect(verifyRes.body.data.user.portal).toBe('user');
      expect(verifyRes.headers['set-cookie']).toBeDefined();
    });

    it('rejects incorrect OTP with HTTP 401 and reports remaining attempts', async () => {
      const phone = generateTestPhone();
      const reqRes = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phoneNumber: phone });

      const challengeId = reqRes.body.data.challengeId;

      const failRes = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ challengeId, otp: '000000' });

      expect(failRes.status).toBe(401);
      expect(failRes.body.success).toBe(false);
      expect(failRes.body.message).toContain('2 attempts remaining');
    });
  });

  describe('2. Multi-Role Discovery & Selection Endpoints', () => {
    it('returns preAuthToken and enforces select-role when phone has multiple personas', async () => {
      const sharedPhone = generateTestPhone();

      // Seed staff
      (repository as any).staffUsers.push({
        id: `usr-dual-staff-${Date.now()}`,
        name: 'Dr. Ramesh Dual',
        email: `ramesh.${Date.now()}@psgtech.edu`,
        phone: sharedPhone,
        role: 'college_admin',
        collegeId: 'clg-psg-01',
        collegeName: 'PSG College of Technology',
        isActive: true,
        accountStatus: 'ACTIVE',
      });

      // Seed student
      (repository as any).students.push({
        id: `stu-dual-${Date.now()}`,
        name: 'Ramesh Dual (Student)',
        email: `ramesh.stu.${Date.now()}@psgtech.edu`,
        phone: sharedPhone,
        rollNumber: `24EMBA${Math.floor(Math.random() * 900 + 100)}`,
        department: 'Management',
        collegeId: 'clg-psg-01',
        collegeName: 'PSG College of Technology',
        accessStatus: 'Active',
      });

      const reqRes = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phoneNumber: sharedPhone });

      const verifyRes = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ challengeId: reqRes.body.data.challengeId, otp: reqRes.body.data.debugOtp });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.requiresRoleSelection).toBe(true);
      expect(verifyRes.body.data.preAuthToken).toBeDefined();
      expect(verifyRes.body.data.availableRoles.length).toBe(2);

      const targetRole = verifyRes.body.data.availableRoles[0];

      // Select role
      const selectRes = await request(app)
        .post('/api/v1/auth/select-role')
        .send({
          preAuthToken: verifyRes.body.data.preAuthToken,
          selectedRoleId: targetRole.id,
        });

      expect(selectRes.status).toBe(200);
      expect(selectRes.body.data.token).toBeDefined();
      expect(selectRes.body.data.user.role).toBe(targetRole.role);
    });

    it('rejects forged role selection with HTTP 403', async () => {
      const sharedPhone = generateTestPhone();
      (repository as any).staffUsers.push({
        id: `usr-st-${Date.now()}`,
        name: 'Staff Single',
        email: `staff.${Date.now()}@psgtech.edu`,
        phone: sharedPhone,
        role: 'college_staff',
        collegeId: 'clg-psg-01',
        isActive: true,
      });
      (repository as any).students.push({
        id: `stu-st-${Date.now()}`,
        name: 'Student Single',
        email: `stu.${Date.now()}@psgtech.edu`,
        phone: sharedPhone,
        rollNumber: '21CS999',
        department: 'CS',
        collegeId: 'clg-psg-01',
        accessStatus: 'Active',
      });

      const reqRes = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phoneNumber: sharedPhone });

      const verifyRes = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ challengeId: reqRes.body.data.challengeId, otp: reqRes.body.data.debugOtp });

      const preAuthToken = verifyRes.body.data.preAuthToken;

      const forgedRes = await request(app)
        .post('/api/v1/auth/select-role')
        .send({ preAuthToken, selectedRoleId: 'role-admin-super-forged' });

      expect(forgedRes.status).toBe(403);
    });
  });

  describe('3. Google Sign-In & Linking Endpoints', () => {
    it('returns requiresPhoneVerification: true when Google account is unlinked', async () => {
      const googleToken = createSignedMockGoogleToken({ email: 'unlinked@gmail.com' });
      const res = await request(app)
        .post('/api/v1/auth/google/verify')
        .send({ idToken: googleToken });

      expect(res.status).toBe(200);
      expect(res.body.data.isLinked).toBe(false);
      expect(res.body.data.requiresPhoneVerification).toBe(true);
      expect(res.body.data.preLinkToken).toBeDefined();
    });

    it('completes account linking with Google preLinkToken', async () => {
      const googleToken = createSignedMockGoogleToken({ email: 'complete.link@gmail.com' });
      const initRes = await request(app)
        .post('/api/v1/auth/google/verify')
        .send({ idToken: googleToken });

      const preLinkToken = initRes.body.data.preLinkToken;
      const phone = generateTestPhone();

      const completeRes = await request(app)
        .post('/api/v1/auth/google/complete-link')
        .send({ preLinkToken, phoneNumber: phone });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.token).toBeDefined();
      expect(completeRes.body.data.phoneNumber).toBe(phone);

      // Now authenticateWithGoogle directly succeeds with isLinked: true!
      const directRes = await request(app)
        .post('/api/v1/auth/google/verify')
        .send({ idToken: googleToken });

      expect(directRes.status).toBe(200);
      expect(directRes.body.data.isLinked).toBe(true);
      expect(directRes.body.data.token).toBeDefined();
    });

    it('links Google account to verified phone via /api/v1/auth/link-account', async () => {
      const phone = generateTestPhone();
      await repository.createIdentity({
        id: `usr-id-${Date.now()}`,
        phoneNumber: phone,
        phoneVerifiedAt: new Date(),
        primaryRole: 'normal_user',
        status: 'ACTIVE',
      });

      const googleToken = createSignedMockGoogleToken({ email: 'account.linked@gmail.com' });
      const res = await request(app)
        .post('/api/v1/auth/link-account')
        .send({ phoneNumber: phone, idToken: googleToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('4. Backward-Compatibility Non-Regression', () => {
    it('preserves existing corporate password login at /api/v1/auth/login', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'kavinbalaji@atbexo.com', password: 'AdminPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });
  });
});
