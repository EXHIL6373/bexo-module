import { z } from 'zod';

try {
  process.loadEnvFile();
} catch {
  // .env file absent or already loaded
}

const INSECURE_DEFAULT_SECRETS = [
  'bexo_enterprise_jwt_secret_token_secure_key_2026_minimum_32_chars!',
  'your_jwt_secret_token_secure_key_minimum_32_chars!',
  'secret',
  'changeme',
  'jwt_secret',
  '1234567890123456',
];

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8000),
  API_PREFIX: z.string().default('/api/v1'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  ALLOW_LOCALHOST_CORS: z
    .preprocess((val) => {
      if (typeof val === 'string') return ['true', '1'].includes(val.toLowerCase());
      return Boolean(val);
    }, z.boolean())
    .default(false),
  TRUST_PROXY: z.coerce.number().default(1),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/bexo_college_db'),
  JWT_SECRET: z.string().min(16).default('bexo_enterprise_jwt_secret_token_secure_key_2026_minimum_32_chars!'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  EMAIL_PROVIDER: z.enum(['smtp', 'mock', 'console']).default('mock'),
  EMAIL_FROM: z.string().default('"BEXO Institutional Gateway" <no-reply@atbexo.com>'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  RATE_LIMIT_MAX: z.coerce.number().default(1000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  LOG_LEVEL: z.string().default('info'),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().default(10000),
  DB_SSL: z
    .preprocess((val) => {
      if (typeof val === 'string') return ['true', '1'].includes(val.toLowerCase());
      return Boolean(val);
    }, z.boolean())
    .default(false),
  USE_POSTGRES_STORE: z
    .preprocess((val) => {
      if (typeof val === 'string') return ['true', '1'].includes(val.toLowerCase());
      return Boolean(val);
    }, z.boolean())
    .default(false),
}).superRefine((data, ctx) => {
  const isHardenedEnv = data.NODE_ENV === 'production' || data.NODE_ENV === 'staging';

  if (isHardenedEnv) {
    if (data.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: `JWT_SECRET must be at least 32 characters long in ${data.NODE_ENV}.`,
      });
    }
    if (INSECURE_DEFAULT_SECRETS.includes(data.JWT_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: `Insecure default JWT_SECRET is strictly forbidden in ${data.NODE_ENV}. Provide a cryptographically random secret.`,
      });
    }
    if (data.DATABASE_URL.includes('localhost:5432/bexo_college_db')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['DATABASE_URL'],
        message: `Default localhost DATABASE_URL cannot be used in ${data.NODE_ENV}. Provide a dedicated PostgreSQL connection string.`,
      });
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid backend environment configuration:', parsed.error.format());
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    process.exit(1);
  }
}

export const env = parsed.success ? parsed.data : envSchema.parse({});


