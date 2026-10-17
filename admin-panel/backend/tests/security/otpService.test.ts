import { describe, it, expect, beforeEach } from 'vitest';
import { OtpService } from '../../src/modules/auth/otp.service';
import { repository } from '../../src/db/repository';
import {
  TooManyRequestsError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../../src/shared/errors/AppError';

describe('OtpService — Security, Cryptographic Integrity & Rate Limiting (Admin Backend)', () => {
  let otpService: OtpService;

  beforeEach(() => {
    otpService = new OtpService('test-crypto-pepper-key-2026-very-secure');
    otpService.resetRateLimit();
  });

  describe('1. Cryptographic Generation & Hashing', () => {
    it('generates a 6-digit numeric OTP code', () => {
      const code = otpService.generateOtp();
      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
    });

    it('produces deterministic HMAC-SHA256 for identical inputs', () => {
      const phone = '+919876543210';
      const code = '123456';
      const hash1 = otpService.hashOtp(phone, code);
      const hash2 = otpService.hashOtp(phone, code);
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256 hex length
    });

    it('produces distinct hashes if phone number differs (context binding)', () => {
      const code = '123456';
      const hash1 = otpService.hashOtp('+919876543210', code);
      const hash2 = otpService.hashOtp('+919876543211', code);
      expect(hash1).not.toBe(hash2);
    });

    it('verifies constant-time hash equality correctly', () => {
      const phone = '+919876543210';
      const code = '654321';
      const expectedHash = otpService.hashOtp(phone, code);

      expect(otpService.verifyOtpHash(phone, code, expectedHash)).toBe(true);
      expect(otpService.verifyOtpHash(phone, '111111', expectedHash)).toBe(false);
      expect(otpService.verifyOtpHash('+919999999999', code, expectedHash)).toBe(false);
    });
  });

  describe('2. Phone Normalization & Validation', () => {
    it('rejects invalid or malformed phone numbers with ValidationError', async () => {
      await expect(otpService.requestOtp('invalid-phone')).rejects.toThrow(ValidationError);
      await expect(otpService.requestOtp('12345')).rejects.toThrow(ValidationError);
      await expect(otpService.requestOtp('')).rejects.toThrow(ValidationError);
    });

    it('normalizes domestic 10-digit Indian numbers to E.164 and masks properly', async () => {
      const res = await otpService.requestOtp('9876543210');
      expect(res.phoneNumber).toBe('+919876543210');
      expect(res.maskedPhoneNumber).toBe('+91 ******3210');
      expect(res.challengeId).toBeDefined();
      expect(res.expiresInSeconds).toBe(300);
    });

    it('normalizes international numbers correctly', async () => {
      const res = await otpService.requestOtp('+1 202 555 0123');
      expect(res.phoneNumber).toBe('+12025550123');
      expect(res.maskedPhoneNumber).toBe('+12 ******0123');
    });
  });

  describe('3. Sliding Window Rate Limiting', () => {
    it('enforces 60-second cooldown between consecutive requests', async () => {
      const phone = '+919876543210';
      await otpService.requestOtp(phone);

      // Immediate second request must trigger TooManyRequestsError
      await expect(otpService.requestOtp(phone)).rejects.toThrow(TooManyRequestsError);
    });

    it('enforces maximum 3 requests within 10-minute sliding window', async () => {
      const phone = '+919876543210';

      // Request 1
      await otpService.requestOtp(phone, 'login', { bypassRateLimit: false });

      // Request 2 (bypassing cooldown check to simulate waiting 61 seconds)
      const entry = (otpService as any).rateLimits.get(phone);
      entry.lastRequestAt = Date.now() - 65 * 1000;
      await otpService.requestOtp(phone, 'login', { bypassRateLimit: false });

      // Request 3
      entry.lastRequestAt = Date.now() - 65 * 1000;
      await otpService.requestOtp(phone, 'login', { bypassRateLimit: false });

      // Request 4 within the 10-minute window must be blocked
      entry.lastRequestAt = Date.now() - 65 * 1000;
      await expect(otpService.requestOtp(phone, 'login', { bypassRateLimit: false })).rejects.toThrow(
        TooManyRequestsError
      );
    });
  });

  describe('4. Challenge Verification, Replay Prevention & Attempt Lockout', () => {
    it('verifies valid OTP successfully and marks challenge as consumed', async () => {
      const phone = '+919876543210';
      const req = await otpService.requestOtp(phone);
      const code = req.debugOtp!;

      const verifyRes = await otpService.verifyOtp(req.challengeId, code);
      expect(verifyRes.success).toBe(true);
      expect(verifyRes.verified).toBe(true);
      expect(verifyRes.phoneNumber).toBe(phone);

      // Assert database record is consumed
      const challengeInDb = await repository.getOtpChallengeById(req.challengeId);
      expect(challengeInDb?.isConsumed).toBe(true);
    });

    it('rejects replay of an already-consumed challenge with UnauthorizedError', async () => {
      const phone = '+919876543210';
      const req = await otpService.requestOtp(phone);
      const code = req.debugOtp!;

      // First verification succeeds
      await otpService.verifyOtp(req.challengeId, code);

      // Replay attempt must fail
      await expect(otpService.verifyOtp(req.challengeId, code)).rejects.toThrow(UnauthorizedError);
      await expect(otpService.verifyOtp(req.challengeId, code)).rejects.toThrow(
        /already been used/i
      );
    });

    it('increments attempt counter on invalid OTP code and returns remaining count', async () => {
      const phone = '+919876543210';
      const req = await otpService.requestOtp(phone);

      // Wrong code attempt 1
      await expect(otpService.verifyOtp(req.challengeId, '000000')).rejects.toThrow(
        /2 attempts remaining/i
      );

      // Wrong code attempt 2
      await expect(otpService.verifyOtp(req.challengeId, '000000')).rejects.toThrow(
        /1 attempt remaining/i
      );

      // Wrong code attempt 3 locks out the challenge
      await expect(otpService.verifyOtp(req.challengeId, '000000')).rejects.toThrow(ForbiddenError);
    });

    it('rejects expired OTP challenges', async () => {
      const phone = '+919876543210';
      const req = await otpService.requestOtp(phone);
      const code = req.debugOtp!;

      // Manually simulate expiration in database
      const item = (repository as any).otpChallenges.find((c: any) => c.id === req.challengeId);
      if (item) {
        item.expiresAt = new Date(Date.now() - 1000).toISOString();
      }

      await expect(otpService.verifyOtp(req.challengeId, code)).rejects.toThrow(UnauthorizedError);
      await expect(otpService.verifyOtp(req.challengeId, code)).rejects.toThrow(/expired/i);
    });

    it('validates OTP submission format (rejects non-6-digit codes)', async () => {
      await expect(otpService.verifyOtp('otp-fake-id', '123')).rejects.toThrow(ValidationError);
      await expect(otpService.verifyOtp('otp-fake-id', 'abcdef')).rejects.toThrow(ValidationError);
      await expect(otpService.verifyOtp('', '123456')).rejects.toThrow(ValidationError);
    });
  });
});
