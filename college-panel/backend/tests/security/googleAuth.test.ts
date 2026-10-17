import { describe, it, expect, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { GoogleAuthService } from '../../src/modules/auth/googleAuth.service';
import { store } from '../../src/db/store';
import { ConflictError, UnauthorizedError, ValidationError, NotFoundError } from '../../src/shared/errors/AppError';
import { env } from '../../src/config/env';

function generateTestPhone(): string {
  return `+919${Math.floor(100000000 + Math.random() * 900000000)}`;
}

function generateUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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

describe('GoogleAuthService — Token Claims, Account Linking & Security (College Backend)', () => {
  let googleAuthService: GoogleAuthService;

  beforeEach(() => {
    googleAuthService = new GoogleAuthService();
  });

  describe('1. Google Token Verification & Claims Guard', () => {
    it('verifies a valid Google ID token with full claims', async () => {
      const email = 'kavin.balaji.college@gmail.com';
      const sub = `g-sub-kavin-${Date.now()}`;
      const token = createSignedMockGoogleToken({ sub, email });

      const profile = await googleAuthService.verifyGoogleIdToken(token);
      expect(profile.sub).toBe(sub);
      expect(profile.email).toBe(email);
      expect(profile.emailVerified).toBe(true);
      expect(profile.name).toBeDefined();
    });

    it('rejects Google accounts with unverified emails', async () => {
      const token = createSignedMockGoogleToken({ email_verified: false });
      await expect(googleAuthService.verifyGoogleIdToken(token)).rejects.toThrow(UnauthorizedError);
      await expect(googleAuthService.verifyGoogleIdToken(token)).rejects.toThrow(/email has not been verified/i);
    });

    it('rejects expired Google ID tokens', async () => {
      const token = createSignedMockGoogleToken({ exp: Math.floor(Date.now() / 1000) - 60 });
      await expect(googleAuthService.verifyGoogleIdToken(token)).rejects.toThrow(UnauthorizedError);
      await expect(googleAuthService.verifyGoogleIdToken(token)).rejects.toThrow(/expired/i);
    });

    it('rejects tokens from untrusted issuers', async () => {
      const token = createSignedMockGoogleToken({ iss: 'https://attacker.evil.com' });
      await expect(googleAuthService.verifyGoogleIdToken(token)).rejects.toThrow(UnauthorizedError);
      await expect(googleAuthService.verifyGoogleIdToken(token)).rejects.toThrow(/untrusted/i);
    });

    it('rejects malformed token strings', async () => {
      await expect(googleAuthService.verifyGoogleIdToken('invalid.token.string')).rejects.toThrow(UnauthorizedError);
      await expect(googleAuthService.verifyGoogleIdToken('')).rejects.toThrow(ValidationError);
    });
  });

  describe('2. Account Linking State Machine & Conflict Prevention', () => {
    it('successfully links a verified Google account to an existing phone identity', async () => {
      const phone = generateTestPhone();
      const id = generateUniqueId('usr-id');

      await store.createIdentity({
        id,
        phoneNumber: phone,
        phoneVerifiedAt: new Date(),
        primaryRole: 'normal_user',
        status: 'ACTIVE',
      });

      const email = `verified.link.${Date.now()}@gmail.com`;
      const token = createSignedMockGoogleToken({ email });
      const linkRes = await googleAuthService.linkGoogleAccount(phone, token);

      expect(linkRes.success).toBe(true);
      expect(linkRes.identity.googleEmail).toBe(email);
      expect(linkRes.identity.googleSub).toBeDefined();
    });

    it('is idempotent when re-linking the exact same Google account', async () => {
      const phone = generateTestPhone();
      const id = generateUniqueId('usr-id');
      const sub = `g-sub-idempotent-${Date.now()}`;
      const email = `idempotent.${Date.now()}@gmail.com`;
      const token = createSignedMockGoogleToken({ sub, email });

      await store.createIdentity({
        id,
        phoneNumber: phone,
        phoneVerifiedAt: new Date(),
        primaryRole: 'normal_user',
        status: 'ACTIVE',
      });

      // Link once
      await googleAuthService.linkGoogleAccount(phone, token);

      // Re-link exact same identity
      const secondRes = await googleAuthService.linkGoogleAccount(phone, token);
      expect(secondRes.success).toBe(true);
      expect(secondRes.message).toContain('already linked');
    });

    it('rejects linking when the Google account is already linked to a DIFFERENT phone number', async () => {
      const phoneA = generateTestPhone();
      const phoneB = generateTestPhone();
      const idA = generateUniqueId('usr-a');
      const idB = generateUniqueId('usr-b');
      const sharedSub = `g-sub-shared-${Date.now()}`;
      const token = createSignedMockGoogleToken({ sub: sharedSub, email: `shared.${Date.now()}@gmail.com` });

      // User A creates identity and links Google
      await store.createIdentity({
        id: idA,
        phoneNumber: phoneA,
        phoneVerifiedAt: new Date(),
        primaryRole: 'normal_user',
        status: 'ACTIVE',
      });
      await googleAuthService.linkGoogleAccount(phoneA, token);

      // User B creates identity and tries to link the SAME Google sub
      await store.createIdentity({
        id: idB,
        phoneNumber: phoneB,
        phoneVerifiedAt: new Date(),
        primaryRole: 'normal_user',
        status: 'ACTIVE',
      });

      await expect(googleAuthService.linkGoogleAccount(phoneB, token)).rejects.toThrow(ConflictError);
      await expect(googleAuthService.linkGoogleAccount(phoneB, token)).rejects.toThrow(
        /already linked to a different phone number/i
      );
    });

    it('rejects linking when the phone identity is already linked to a DIFFERENT Google account', async () => {
      const phone = generateTestPhone();
      const id = generateUniqueId('usr-phone');
      const token1 = createSignedMockGoogleToken({ sub: `g-sub-1-${Date.now()}`, email: `first.${Date.now()}@gmail.com` });
      const token2 = createSignedMockGoogleToken({ sub: `g-sub-2-${Date.now()}`, email: `second.${Date.now()}@gmail.com` });

      await store.createIdentity({
        id,
        phoneNumber: phone,
        phoneVerifiedAt: new Date(),
        primaryRole: 'normal_user',
        status: 'ACTIVE',
      });

      // Link first Google account
      await googleAuthService.linkGoogleAccount(phone, token1);

      // Attempting to link second Google account to same phone must be rejected
      await expect(googleAuthService.linkGoogleAccount(phone, token2)).rejects.toThrow(ConflictError);
      await expect(googleAuthService.linkGoogleAccount(phone, token2)).rejects.toThrow(
        /already linked to another Google account/i
      );
    });
  });

  describe('3. Direct Google Sign-In & Verification Handshake', () => {
    it('returns requiresPhoneVerification: true and preLinkToken when Google sub is not yet linked', async () => {
      const unlinkedToken = createSignedMockGoogleToken({ email: `newbie.${Date.now()}@gmail.com` });
      const res = await googleAuthService.authenticateWithGoogle(unlinkedToken);

      expect(res.success).toBe(true);
      expect(res.isLinked).toBe(false);
      expect(res.requiresPhoneVerification).toBe(true);
      expect(res.preLinkToken).toBeDefined();
    });

    it('successfully completes account setup using preLinkToken and phone verification', async () => {
      const unlinkedToken = createSignedMockGoogleToken({ email: `new.member.${Date.now()}@gmail.com` });
      const handshake = await googleAuthService.authenticateWithGoogle(unlinkedToken);
      expect(handshake.preLinkToken).toBeDefined();

      const phone = generateTestPhone();
      const completeRes = await googleAuthService.completeLinkWithPreLinkToken(
        handshake.preLinkToken!,
        phone
      );

      expect(completeRes.phoneNumber).toBe(phone);
      expect(completeRes.token).toBeDefined();
      expect(completeRes.user?.role).toBe('normal_user');

      // Subsequent sign-in with the same Google token must now be recognized as linked!
      const subsequentLogin = await googleAuthService.authenticateWithGoogle(unlinkedToken);
      expect(subsequentLogin.isLinked).toBe(true);
      expect(subsequentLogin.token).toBeDefined();
    });
  });
});
