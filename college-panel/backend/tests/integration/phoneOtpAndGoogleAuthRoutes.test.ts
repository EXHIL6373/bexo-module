import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app';
import { store } from '../../src/db/store';
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

describe('College Auth Endpoints — Phone OTP, Role Discovery & Google Integration', () => {
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
    });

    it('rejects incorrect OTP with HTTP 401 and reports remaining attempts', async () => {
      const phone = generateTestPhone();
      const reqRes = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phoneNumber: phone });

      const challengeId = reqRes.body.data.challengeId;

      const verifyRes = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ challengeId, otp: '000000' });

      expect(verifyRes.status).toBe(401);
      expect(verifyRes.body.success).toBe(false);
      expect(verifyRes.body.message).toContain('2 attempts remaining');
    });
  });

  describe('2. Multi-Role Discovery & Selection Endpoints', () => {
    it('returns preAuthToken and enforces select-role when phone has multiple personas', async () => {
      const phone = generateTestPhone();

      await store.createStaffUser({
        id: `usr-dual-staff-${Date.now()}`,
        name: 'Dual Role Staff',
        email: `dual.staff.${Date.now()}@psgtech.edu`,
        phone,
        role: 'college_admin',
        collegeId: 'clg-psg-01',
        designation: 'Campus Dean',
        department: 'Administration',
        isActive: true,
        accountStatus: 'ACTIVE',
      });

      await store.createStudent({
        id: `std-dual-${Date.now()}`,
        name: 'Dual Enrolled Student',
        email: `dual.student.${Date.now()}@psgtech.edu`,
        phone,
        collegeId: 'clg-psg-01',
        department: 'Computer Science and Engineering',
        batch: '2024-2028',
        rollNumber: `ROLL-${Date.now().toString().slice(-6)}`,
        registerNumber: `REG-${Date.now().toString().slice(-6)}`,
        status: 'Active',
        accessStatus: 'Active',
      });

      const reqRes = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phoneNumber: phone });

      const challengeId = reqRes.body.data.challengeId;
      const debugOtp = reqRes.body.data.debugOtp;

      const verifyRes = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ challengeId, otp: debugOtp });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.data.requiresRoleSelection).toBe(true);
      expect(verifyRes.body.data.preAuthToken).toBeDefined();
      expect(verifyRes.body.data.availableRoles.length).toBeGreaterThanOrEqual(2);

      const targetRole = verifyRes.body.data.availableRoles[0];

      const selectRes = await request(app)
        .post('/api/v1/auth/select-role')
        .send({
          preAuthToken: verifyRes.body.data.preAuthToken,
          selectedRoleId: targetRole.id,
        });

      expect(selectRes.status).toBe(200);
      expect(selectRes.body.success).toBe(true);
      expect(selectRes.body.data.token).toBeDefined();
      expect(selectRes.body.data.user.role).toBe(targetRole.role);
    });

    it('rejects forged role selection with HTTP 403', async () => {
      const phone = generateTestPhone();

      await store.createStaffUser({
        id: `usr-dual-staff-2-${Date.now()}`,
        name: 'Dual Role Staff 2',
        email: `dual.staff2.${Date.now()}@psgtech.edu`,
        phone,
        role: 'college_admin',
        collegeId: 'clg-psg-01',
        designation: 'Campus Dean',
        department: 'Administration',
        isActive: true,
        accountStatus: 'ACTIVE',
      });

      await store.createStudent({
        id: `std-dual-2-${Date.now()}`,
        name: 'Dual Enrolled Student 2',
        email: `dual.student2.${Date.now()}@psgtech.edu`,
        phone,
        collegeId: 'clg-psg-01',
        department: 'Computer Science and Engineering',
        batch: '2024-2028',
        rollNumber: `ROLL-${Date.now().toString().slice(-6)}`,
        registerNumber: `REG-${Date.now().toString().slice(-6)}`,
        status: 'Active',
        accessStatus: 'Active',
      });

      const reqRes = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phoneNumber: phone });

      const challengeId = reqRes.body.data.challengeId;
      const debugOtp = reqRes.body.data.debugOtp;

      const verifyRes = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ challengeId, otp: debugOtp });

      const preAuthToken = verifyRes.body.data.preAuthToken;

      const selectRes = await request(app)
        .post('/api/v1/auth/select-role')
        .send({ preAuthToken, selectedRoleId: 'role-admin-super-forged' });

      expect(selectRes.status).toBe(403);
      expect(selectRes.body.success).toBe(false);
    });
  });

  describe('3. Google Sign-In & Linking Endpoints', () => {
    it('returns requiresPhoneVerification: true when Google account is unlinked', async () => {
      const googleToken = createSignedMockGoogleToken({});
      const res = await request(app)
        .post('/api/v1/auth/google/verify')
        .send({ idToken: googleToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.requiresPhoneVerification).toBe(true);
      expect(res.body.data.preLinkToken).toBeDefined();
    });

    it('completes account linking with Google preLinkToken', async () => {
      const googleToken = createSignedMockGoogleToken({ email: 'complete.link.college@gmail.com' });
      const initRes = await request(app)
        .post('/api/v1/auth/google/verify')
        .send({ idToken: googleToken });

      const preLinkToken = initRes.body.data.preLinkToken;
      const phone = generateTestPhone();

      const completeRes = await request(app)
        .post('/api/v1/auth/google/complete-link')
        .send({ preLinkToken, phoneNumber: phone });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.success).toBe(true);
      expect(completeRes.body.data.token).toBeDefined();
      expect(completeRes.body.data.phoneNumber).toBe(phone);

      const secondVerifyRes = await request(app)
        .post('/api/v1/auth/google/verify')
        .send({ idToken: googleToken });

      expect(secondVerifyRes.status).toBe(200);
      expect(secondVerifyRes.body.data.isLinked).toBe(true);
      expect(secondVerifyRes.body.data.token).toBeDefined();
    });

    it('links Google account to verified phone via /api/v1/auth/link-account', async () => {
      const phone = generateTestPhone();
      await store.createIdentity({
        id: `usr-id-${Date.now()}`,
        phoneNumber: phone,
        phoneVerifiedAt: new Date(),
        primaryRole: 'normal_user',
        status: 'ACTIVE',
      });

      const googleToken = createSignedMockGoogleToken({ email: 'account.linked.college@gmail.com' });
      const res = await request(app)
        .post('/api/v1/auth/link-account')
        .send({ phoneNumber: phone, idToken: googleToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('4. Backward-Compatibility Non-Regression', () => {
    it('preserves existing college staff password login at /api/v1/auth/college-login', async () => {
      await store.updateCollege('clg-psg-01', { status: 'Active', dashboardAccess: true, suspensionReason: null });
      const res = await request(app)
        .post('/api/v1/auth/college-login')
        .send({ email: 'venkatesh.r@psgtech.edu', password: 'ValidPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });
  });
});
