import { parsePhoneNumber, CountryCode } from 'libphonenumber-js';
import { ValidationError } from '../errors/AppError';

export interface PhoneNormalizationResult {
  isValid: boolean;
  e164: string;
  countryCode?: CountryCode;
  nationalNumber?: string;
  formattedInternational?: string;
  error?: string;
}

/**
 * Normalizes a raw phone number input into canonical E.164 representation.
 * Supports explicit country codes (e.g. +91, +1, +44) as well as default national fallback (default: 'IN').
 */
export function normalizePhoneNumber(
  rawPhone: string | null | undefined,
  defaultCountry: CountryCode = 'IN'
): PhoneNormalizationResult {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return {
      isValid: false,
      e164: '',
      error: 'Phone number is required and must be a non-empty string.',
    };
  }

  const trimmed = rawPhone.trim();
  if (trimmed.length === 0) {
    return {
      isValid: false,
      e164: '',
      error: 'Phone number cannot be empty or blank.',
    };
  }

  try {
    const phoneNumber = parsePhoneNumber(trimmed, defaultCountry);

    if (!phoneNumber || !phoneNumber.isValid()) {
      return {
        isValid: false,
        e164: '',
        error: `The phone number '${rawPhone}' is not a valid recognized phone number.`,
      };
    }

    const e164 = phoneNumber.format('E.164');
    return {
      isValid: true,
      e164,
      countryCode: phoneNumber.country,
      nationalNumber: phoneNumber.nationalNumber,
      formattedInternational: phoneNumber.formatInternational(),
    };
  } catch (err: any) {
    return {
      isValid: false,
      e164: '',
      error: err.message || `Unable to parse phone number '${rawPhone}'.`,
    };
  }
}

/**
 * Returns canonical E.164 string or throws a standardized ValidationError.
 */
export function canonicalizePhoneNumber(
  rawPhone: string | null | undefined,
  defaultCountry: CountryCode = 'IN'
): string {
  const result = normalizePhoneNumber(rawPhone, defaultCountry);
  if (!result.isValid || !result.e164) {
    throw new ValidationError(result.error || 'Invalid phone number format. Please provide a valid telephone number.');
  }
  return result.e164;
}

/**
 * Compares two raw or legacy phone strings for canonical E.164 equivalence.
 */
export function isPhoneEquivalent(
  phoneA: string | null | undefined,
  phoneB: string | null | undefined,
  defaultCountry: CountryCode = 'IN'
): boolean {
  if (!phoneA || !phoneB) return false;
  const resA = normalizePhoneNumber(phoneA, defaultCountry);
  const resB = normalizePhoneNumber(phoneB, defaultCountry);
  if (!resA.isValid || !resB.isValid) return false;
  return resA.e164 === resB.e164;
}

/**
 * Masks a phone number for secure logging and audit trails (e.g. +91 98400 11223 -> +91 ******1223)
 */
export function maskPhoneNumber(rawPhone: string | null | undefined): string {
  if (!rawPhone || typeof rawPhone !== 'string') return '[REDACTED_PHONE]';
  const norm = normalizePhoneNumber(rawPhone);
  const target = norm.isValid ? norm.e164 : rawPhone.replace(/\s+/g, '');
  if (target.length < 6) return '******';
  const prefix = target.slice(0, 3);
  const suffix = target.slice(-4);
  return `${prefix} ******${suffix}`;
}
