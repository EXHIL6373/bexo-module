import { describe, it, expect } from 'vitest';
import { validateEnv } from '../../src/config/env';

describe('Security — Environment Configuration & Production Enforcement', () => {
  const baseValidProdEnv: NodeJS.ProcessEnv = {
    NODE_ENV: 'staging',
    PORT: '8080',
    DATABASE_URL: 'postgresql://bexo_user:SuperSecureProdPass2026!@ep-db.cloud.neon.tech/bexo_db?sslmode=require',
    USE_POSTGRES_STORE: 'true',
    JWT_SECRET: 'd8f2a91e5c3b47891234567890abcdef1234567890abcdef1234567890abcdef',
    SERVICE_AUTH_SECRET: 'e9a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
    EMAIL_PROVIDER: 'smtp',
    SMTP_HOST: 'smtp.mailgun.org',
    SMTP_PORT: '587',
    SMTP_USER: 'postmaster@atbexo.com',
    SMTP_PASSWORD: 'SuperSecureSmtpPassword123!',
  };

  it('Accepts a fully configured and valid staging/production environment', () => {
    const config = validateEnv(baseValidProdEnv);
    expect(config.NODE_ENV).toBe('staging');
    expect(config.USE_POSTGRES_STORE).toBe(true);
    expect(config.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it('Fails startup when JWT_SECRET is missing or empty in staging/production', () => {
    const invalidEnv = { ...baseValidProdEnv, JWT_SECRET: '' };
    expect(() => validateEnv(invalidEnv)).toThrow(/JWT_SECRET/i);
  });

  it('Fails startup when JWT_SECRET is a known placeholder in staging/production', () => {
    const placeholders = [
      'bexo-central-admin-super-secure-jwt-key-2026-staging-32-chars-minimum',
      'change-me-to-a-very-secure-random-32-character-secret',
      'secret-key-placeholder-for-tests-only-32-chars',
      'admin-password-placeholder-secret-32-chars',
    ];

    for (const ph of placeholders) {
      const invalidEnv = { ...baseValidProdEnv, JWT_SECRET: ph };
      expect(() => validateEnv(invalidEnv)).toThrow(/Insecure JWT_SECRET detected/i);
    }
  });

  it('Fails startup when SERVICE_AUTH_SECRET reuses the JWT_SECRET', () => {
    const invalidEnv = {
      ...baseValidProdEnv,
      SERVICE_AUTH_SECRET: baseValidProdEnv.JWT_SECRET,
    };
    expect(() => validateEnv(invalidEnv)).toThrow(/SERVICE_AUTH_SECRET must not reuse the user JWT_SECRET/i);
  });

  it('Fails startup when DB_SSL_REJECT_UNAUTHORIZED=false in staging/production', () => {
    const invalidEnv = {
      ...baseValidProdEnv,
      DB_SSL_REJECT_UNAUTHORIZED: 'false',
    };
    expect(() => validateEnv(invalidEnv)).toThrow(/Disabling TLS certificate verification.*is strictly prohibited/i);
  });

  it('Fails startup when USE_POSTGRES_STORE=false in staging/production', () => {
    const invalidEnv = {
      ...baseValidProdEnv,
      USE_POSTGRES_STORE: 'false',
    };
    expect(() => validateEnv(invalidEnv)).toThrow(/USE_POSTGRES_STORE must be enabled/i);
  });

  it('Fails startup when DATABASE_URL uses localhost dev defaults in staging/production', () => {
    const invalidEnv = {
      ...baseValidProdEnv,
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/bexo_admin_db',
    };
    expect(() => validateEnv(invalidEnv)).toThrow(/DATABASE_URL cannot use default localhost/i);
  });

  it('Fails startup when EMAIL_PROVIDER is console in production without override', () => {
    const invalidEnv = {
      ...baseValidProdEnv,
      NODE_ENV: 'production',
      EMAIL_PROVIDER: 'console',
      ALLOW_MOCK_EMAIL: 'false',
    };
    expect(() => validateEnv(invalidEnv)).toThrow(/EMAIL_PROVIDER='console' is not permitted in production/i);
  });
});
