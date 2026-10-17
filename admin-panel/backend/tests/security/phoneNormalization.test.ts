import { describe, it, expect } from 'vitest';
import {
  normalizePhoneNumber,
  canonicalizePhoneNumber,
  isPhoneEquivalent,
  maskPhoneNumber,
} from '../../src/shared/utils/phoneNormalization';
import { ValidationError } from '../../src/shared/errors/AppError';

describe('Unit — Phone Number Normalization & Masking Utility (E.164)', () => {
  it('Normalizes standard Indian number with country code and whitespace', () => {
    const res = normalizePhoneNumber('+91 98400 11223');
    expect(res.isValid).toBe(true);
    expect(res.e164).toBe('+919840011223');
    expect(res.countryCode).toBe('IN');
    expect(res.nationalNumber).toBe('9840011223');
  });

  it('Normalizes national 10-digit number using default country IN', () => {
    const res = normalizePhoneNumber('9840011223', 'IN');
    expect(res.isValid).toBe(true);
    expect(res.e164).toBe('+919840011223');
  });

  it('Normalizes national number with leading trunk prefix 0', () => {
    const res = normalizePhoneNumber('09840011223', 'IN');
    expect(res.isValid).toBe(true);
    expect(res.e164).toBe('+919840011223');
  });

  it('Normalizes international US phone number without defaulting to IN', () => {
    const res = normalizePhoneNumber('+1 (202) 555-0143');
    expect(res.isValid).toBe(true);
    expect(res.e164).toBe('+12025550143');
    expect(res.countryCode).toBe('US');
  });

  it('Normalizes UK phone number properly', () => {
    const res = normalizePhoneNumber('+44 7911 123456');
    expect(res.isValid).toBe(true);
    expect(res.e164).toBe('+447911123456');
    expect(['GB', 'GG']).toContain(res.countryCode);
  });

  it('Rejects invalid or malformed phone numbers', () => {
    const emptyRes = normalizePhoneNumber('');
    expect(emptyRes.isValid).toBe(false);

    const nullRes = normalizePhoneNumber(null as any);
    expect(nullRes.isValid).toBe(false);

    const alphaRes = normalizePhoneNumber('abcdefghijk');
    expect(alphaRes.isValid).toBe(false);

    const tooShortRes = normalizePhoneNumber('12345');
    expect(tooShortRes.isValid).toBe(false);
  });

  it('canonicalizePhoneNumber returns E.164 string on valid input and throws ValidationError on invalid input', () => {
    const valid = canonicalizePhoneNumber('+91 94433 88120');
    expect(valid).toBe('+919443388120');

    expect(() => canonicalizePhoneNumber('invalid-number')).toThrow(ValidationError);
  });

  it('isPhoneEquivalent returns true for different formatting variants of the same number', () => {
    expect(isPhoneEquivalent('+91 98400 11223', '9840011223')).toBe(true);
    expect(isPhoneEquivalent('09840011223', '+919840011223')).toBe(true);
    expect(isPhoneEquivalent('+91 98400-11223', '+91 98400 11223')).toBe(true);
    expect(isPhoneEquivalent('+91 98400 11223', '+91 98400 99999')).toBe(false);
  });

  it('maskPhoneNumber redacts sensitive middle digits for logging', () => {
    const masked = maskPhoneNumber('+91 98400 11223');
    expect(masked).toContain('******');
    expect(masked).toBe('+91 ******1223');

    const emptyMasked = maskPhoneNumber('');
    expect(emptyMasked).toBe('[REDACTED_PHONE]');
  });
});
