import crypto from 'node:crypto';
import { repository } from '../../db/repository';
import { normalizePhoneNumber, maskPhoneNumber } from '../../shared/utils/phoneNormalization';
import {
  TooManyRequestsError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';

interface RateLimitEntry {
  timestamps: number[];
  lastRequestAt: number;
}

export class OtpService {
  private readonly pepper: string;
  private readonly rateLimits = new Map<string, RateLimitEntry>();
  private readonly COOLDOWN_MS = 60 * 1000; // 60 seconds between OTP requests
  private readonly WINDOW_MS = 10 * 60 * 1000; // 10 minutes sliding window
  private readonly MAX_REQUESTS_PER_WINDOW = 3; // Max 3 requests per 10 minutes
  private readonly CHALLENGE_LIFESPAN_MS = 5 * 60 * 1000; // 5 minutes validity
  private readonly MAX_ATTEMPTS = 3;

  constructor(pepper?: string) {
    this.pepper = pepper || process.env.OTP_PEPPER || 'bexo-auth-otp-secure-pepper-2026-production';
  }

  /**
   * Generates a cryptographically random 6-digit numeric OTP.
   */
  public generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Computes an HMAC-SHA256 hash of the OTP bound to the normalized E.164 phone number.
   */
  public hashOtp(phoneNumber: string, otp: string): string {
    return crypto
      .createHmac('sha256', this.pepper)
      .update(`${phoneNumber}:${otp}`)
      .digest('hex');
  }

  /**
   * Performs constant-time comparison to protect against timing attacks.
   */
  public verifyOtpHash(phoneNumber: string, submittedOtp: string, expectedHash: string): boolean {
    const candidateHash = this.hashOtp(phoneNumber, submittedOtp);
    const bufA = Buffer.from(candidateHash, 'hex');
    const bufB = Buffer.from(expectedHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Enforces sliding-window rate limiting per canonical phone number.
   */
  public checkRateLimit(canonicalPhone: string): void {
    const now = Date.now();
    const entry = this.rateLimits.get(canonicalPhone);

    if (!entry) return;

    // 1. Check cooldown interval
    const timeSinceLast = now - entry.lastRequestAt;
    if (timeSinceLast < this.COOLDOWN_MS) {
      const waitSeconds = Math.ceil((this.COOLDOWN_MS - timeSinceLast) / 1000);
      throw new TooManyRequestsError(
        `Please wait ${waitSeconds} second${waitSeconds === 1 ? '' : 's'} before requesting another OTP code.`
      );
    }

    // 2. Check sliding window quota
    const windowStart = now - this.WINDOW_MS;
    const activeTimestamps = entry.timestamps.filter((ts) => ts > windowStart);
    entry.timestamps = activeTimestamps;

    if (activeTimestamps.length >= this.MAX_REQUESTS_PER_WINDOW) {
      const oldest = activeTimestamps[0];
      const waitSeconds = Math.ceil((oldest + this.WINDOW_MS - now) / 1000);
      throw new TooManyRequestsError(
        `Too many OTP requests for this phone number. Please wait ${Math.ceil(waitSeconds / 60)} minute(s) before requesting again.`
      );
    }
  }

  /**
   * Records a successful OTP issuance for rate limiting.
   */
  private recordRateLimit(canonicalPhone: string): void {
    const now = Date.now();
    const entry = this.rateLimits.get(canonicalPhone) || { timestamps: [], lastRequestAt: 0 };
    entry.lastRequestAt = now;
    entry.timestamps.push(now);
    this.rateLimits.set(canonicalPhone, entry);
  }

  /**
   * Resets rate limits (useful for testing or manual override).
   */
  public resetRateLimit(canonicalPhone?: string): void {
    if (canonicalPhone) {
      this.rateLimits.delete(canonicalPhone);
    } else {
      this.rateLimits.clear();
    }
  }

  /**
   * Requests an OTP for a given domestic or international phone number.
   */
  public async requestOtp(rawPhone: string, purpose = 'login', options: { bypassRateLimit?: boolean } = {}) {
    const cleanPhone = (rawPhone || '').trim();
    if (!cleanPhone) {
      throw new ValidationError('Phone number is required.');
    }

    const norm = normalizePhoneNumber(cleanPhone);
    if (!norm.isValid) {
      throw new ValidationError(
        'Invalid phone number format. Please provide a valid domestic or international phone number with country code.'
      );
    }

    if (!options.bypassRateLimit) {
      this.checkRateLimit(norm.e164);
    }

    const otp = this.generateOtp();
    const otpHash = this.hashOtp(norm.e164, otp);
    const expiresAt = new Date(Date.now() + this.CHALLENGE_LIFESPAN_MS);
    const challengeId = `otp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const challenge = await repository.createOtpChallenge({
      id: challengeId,
      phoneNumber: norm.e164,
      otpHash,
      purpose,
      attempts: 0,
      maxAttempts: this.MAX_ATTEMPTS,
      expiresAt,
      isConsumed: false,
      createdAt: new Date(),
    });

    this.recordRateLimit(norm.e164);

    const maskedPhone = maskPhoneNumber(norm.e164);
    logger.info(
      { challengeId: challenge.id, phoneNumber: maskedPhone, purpose },
      `[OTP DISPATCH] 6-digit verification code generated for ${maskedPhone}`
    );

    return {
      success: true,
      challengeId: challenge.id,
      phoneNumber: norm.e164,
      maskedPhoneNumber: maskedPhone,
      expiresInSeconds: Math.floor(this.CHALLENGE_LIFESPAN_MS / 1000),
      ...(process.env.NODE_ENV === 'test' ? { debugOtp: otp } : {}),
    };
  }

  /**
   * Verifies an OTP challenge against user submission.
   */
  public async verifyOtp(challengeId: string, submittedOtp: string) {
    if (!challengeId || typeof challengeId !== 'string') {
      throw new ValidationError('Challenge ID is required.');
    }

    const cleanOtp = (submittedOtp || '').trim();
    if (!cleanOtp) {
      throw new ValidationError('OTP code is required.');
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      throw new ValidationError('OTP code must be exactly 6 digits.');
    }

    const challenge = await repository.getOtpChallengeById(challengeId);
    if (!challenge) {
      throw new NotFoundError('OTP challenge not found or expired.');
    }

    if (challenge.isConsumed) {
      throw new UnauthorizedError('This OTP code has already been used. Please request a new code.');
    }

    const now = Date.now();
    const expiresAtMs = new Date(challenge.expiresAt).getTime();
    if (now > expiresAtMs) {
      throw new UnauthorizedError('OTP code has expired. Please request a new code.');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      throw new ForbiddenError(
        'Maximum verification attempts exceeded for this OTP. Please request a new code.'
      );
    }

    const isValid = this.verifyOtpHash(challenge.phoneNumber, cleanOtp, challenge.otpHash);

    if (!isValid) {
      const newAttempts = await repository.incrementOtpAttempts(challenge.id);
      const remainingAttempts = Math.max(0, challenge.maxAttempts - newAttempts);

      if (remainingAttempts <= 0) {
        throw new ForbiddenError(
          'Invalid OTP code. Maximum attempts reached. This challenge is now locked. Please request a new code.'
        );
      }

      throw new UnauthorizedError(
        `Invalid OTP code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
      );
    }

    // Mark as consumed immediately
    await repository.consumeOtpChallenge(challenge.id);

    logger.info(
      { challengeId: challenge.id, phoneNumber: maskPhoneNumber(challenge.phoneNumber) },
      `[OTP VERIFIED] Phone number ${maskPhoneNumber(challenge.phoneNumber)} successfully verified`
    );

    return {
      success: true,
      verified: true,
      phoneNumber: challenge.phoneNumber,
      purpose: challenge.purpose,
    };
  }
}

export const otpService = new OtpService();
