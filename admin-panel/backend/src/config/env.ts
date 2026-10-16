import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!(key in process.env)) {
            process.env[key] = val;
          }
        }
      }
    } catch {
      // Ignore file reading errors
    }
  }
}
loadEnvFile();

const KNOWN_PLACEHOLDERS = [
  'bexo-central-admin-super-secure-jwt-key-2026-staging-32-chars-minimum',
  'bexo-service-to-service-secret-key-2026-staging-32-chars',
  'change-me',
  'your-secret',
  'secret',
  'password',
  'admin',
  'placeholder',
  'default-secret',
  'test-secret',
];

const safeBoolean = (defaultVal = false) =>
  z.preprocess((val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    if (typeof val === 'string') {
      const lower = val.trim().toLowerCase();
      if (lower === 'true' || lower === '1') return true;
      if (lower === 'false' || lower === '0' || lower === '') return false;
    }
    return val;
  }, z.boolean()).default(defaultVal);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8080),
  API_PREFIX: z.string().default('/api/v1'),
  TRUST_PROXY: z.coerce.number().default(1),

  // Database
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgres@localhost:5432/bexo_admin_db?sslmode=disable'),
  DB_SSL: safeBoolean(false),
  DB_SSL_REJECT_UNAUTHORIZED: safeBoolean(true),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().default(10000),
  USE_POSTGRES_STORE: safeBoolean(false),

  // Authentication & User JWT
  JWT_SECRET: z
    .string()
    .min(16, 'JWT secret should be at least 16 characters for development')
    .default('bexo-central-admin-super-secure-jwt-key-2026-staging-32-chars-minimum'),
  JWT_EXPIRES_IN: z.string().default('24h'),

  // Service-to-Service Integration Auth
  SERVICE_AUTH_SECRET: z
    .string()
    .min(16, 'Service auth secret should be at least 16 characters for development')
    .default('bexo-service-to-service-secret-key-2026-staging-32-chars'),

  // CORS & External URLs
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173'),
  COLLEGE_PORTAL_URL: z.string().default('http://localhost:5174'), // Frontend browser redirect URL
  COLLEGE_PANEL_API_URL: z.string().default('http://localhost:5000'), // Backend service-to-service API
  MOBILE_APP_API_URL: z.string().default('http://localhost:3001'), // Backend service-to-service API
  ALLOW_LOCALHOST_CORS: safeBoolean(true),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Email
  EMAIL_PROVIDER: z.enum(['smtp', 'mock', 'console']).default('console'),
  EMAIL_FROM: z.string().default('"BEXO Corporate Administration" <no-reply@atbexo.com>'),
  ALLOW_MOCK_EMAIL: safeBoolean(false),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
});

export function validateEnv(rawEnv: NodeJS.ProcessEnv = process.env) {
  const parsed = envSchema.safeParse(rawEnv);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((i) => `Field '${i.path.join('.')}': ${i.message}`)
      .join('; ');
    throw new Error(`Environment configuration error: ${errorDetails}`);
  }

  const config = parsed.data;

  // Stricter validations for staging and production
  if (config.NODE_ENV === 'production' || config.NODE_ENV === 'staging') {
    // 1. JWT_SECRET verification
    const rawJwtSecret = rawEnv.JWT_SECRET;
    if (!rawJwtSecret || rawJwtSecret.trim().length === 0) {
      throw new Error(
        `JWT_SECRET must be explicitly configured in ${config.NODE_ENV} environment. Defaults are rejected.`
      );
    }
    if (config.JWT_SECRET.length < 32) {
      throw new Error(`JWT_SECRET must be at least 32 characters in ${config.NODE_ENV} environment.`);
    }
    const lowerJwt = config.JWT_SECRET.toLowerCase();
    for (const ph of KNOWN_PLACEHOLDERS) {
      if (lowerJwt.includes(ph.toLowerCase())) {
        throw new Error(
          `Insecure JWT_SECRET detected: Secret matches or contains known placeholder '${ph}'. Please provide a cryptographically generated 32+ character random key.`
        );
      }
    }

    // 2. SERVICE_AUTH_SECRET verification
    const rawServiceSecret = rawEnv.SERVICE_AUTH_SECRET;
    if (!rawServiceSecret || rawServiceSecret.trim().length === 0) {
      throw new Error(
        `SERVICE_AUTH_SECRET must be explicitly configured in ${config.NODE_ENV} environment. Defaults are rejected.`
      );
    }
    if (config.SERVICE_AUTH_SECRET.length < 32) {
      throw new Error(`SERVICE_AUTH_SECRET must be at least 32 characters in ${config.NODE_ENV} environment.`);
    }
    if (config.SERVICE_AUTH_SECRET === config.JWT_SECRET) {
      throw new Error(
        'SERVICE_AUTH_SECRET must not reuse the user JWT_SECRET. Use separate credentials for service authentication.'
      );
    }

    // 3. PostgreSQL store requirement
    if (!config.USE_POSTGRES_STORE) {
      throw new Error(`USE_POSTGRES_STORE must be enabled (true) in ${config.NODE_ENV} environment.`);
    }

    // 4. Insecure default DATABASE_URL rejection
    if (
      config.DATABASE_URL.includes('localhost:5432/bexo_admin_db') ||
      config.DATABASE_URL.includes('postgres:postgres@localhost')
    ) {
      throw new Error(
        `DATABASE_URL cannot use default localhost development credentials in ${config.NODE_ENV} environment.`
      );
    }

    // 5. TLS verification cannot be disabled in production/staging
    if (rawEnv.DB_SSL_REJECT_UNAUTHORIZED === 'false' || config.DB_SSL_REJECT_UNAUTHORIZED === false) {
      throw new Error(
        `Disabling TLS certificate verification (DB_SSL_REJECT_UNAUTHORIZED=false) is strictly prohibited in ${config.NODE_ENV} environment.`
      );
    }

    // 6. Email delivery simulation prevention in production
    if (config.NODE_ENV === 'production' && config.EMAIL_PROVIDER !== 'smtp' && !config.ALLOW_MOCK_EMAIL) {
      throw new Error(
        `EMAIL_PROVIDER='${config.EMAIL_PROVIDER}' is not permitted in production without ALLOW_MOCK_EMAIL=true. A valid SMTP mailer must be configured.`
      );
    }
  }

  return config;
}

export const env = validateEnv(process.env);
export type EnvConfig = typeof env;
