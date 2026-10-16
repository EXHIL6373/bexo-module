import fs from 'node:fs';
import dns from 'node:dns';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '../config/env';
import * as schema from './schema';
import { logger } from '../shared/utils/logger';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore on runtimes without setDefaultResultOrder
}

const { Pool } = pg;

export function redactDatabaseUrl(url: string): string {
  try {
    return url.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
  } catch {
    return '[REDACTED_DATABASE_URL]';
  }
}

function sanitizeDatabaseUrl(url: string): string {
  return url
    .replace(/([&?])channel_binding=[^&]+(&|$)/g, '$1')
    .replace(/([&?])sslmode=require(&|$)/g, '$1sslmode=verify-full$2')
    .replace(/\?&/, '?')
    .replace(/[?&]$/, '');
}

const sanitizedUrl = sanitizeDatabaseUrl(env.DATABASE_URL);

const isSslRequired =
  env.DB_SSL ||
  sanitizedUrl.includes('neon.tech') ||
  sanitizedUrl.includes('sslmode=require') ||
  sanitizedUrl.includes('sslmode=verify-full') ||
  env.NODE_ENV === 'production' ||
  env.NODE_ENV === 'staging';

let sslConfig: pg.ConnectionConfig['ssl'] = undefined;

const rootCertPath = process.env.PGSSLROOTCERT || process.env.CA_CERT_PATH;

// In production or staging, rejectUnauthorized MUST be true unconditionally
const isStrictProduction = env.NODE_ENV === 'production' || env.NODE_ENV === 'staging';
const rejectUnauthorized = isStrictProduction ? true : env.DB_SSL_REJECT_UNAUTHORIZED !== false;

if (rootCertPath && fs.existsSync(rootCertPath)) {
  sslConfig = {
    rejectUnauthorized,
    ca: fs.readFileSync(rootCertPath).toString(),
  };
} else if (isStrictProduction) {
  sslConfig = {
    rejectUnauthorized: true,
  };
} else if (isSslRequired) {
  sslConfig = {
    rejectUnauthorized,
  };
}

export const pool = new Pool({
  connectionString: sanitizedUrl,
  ssl: sslConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
});

pool.on('error', (err) => {
  logger.warn({ err: err.message }, 'Unexpected error on idle PostgreSQL client in pool');
});

export const db = drizzle(pool, { schema });

export async function checkDatabaseConnection(timeoutMs = env.DB_CONNECTION_TIMEOUT_MS): Promise<boolean> {
  let client: pg.PoolClient | null = null;
  let timer: NodeJS.Timeout | null = null;
  let isTimeoutExpired = false;

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        isTimeoutExpired = true;
        reject(new Error(`PostgreSQL readiness probe timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    const executeCheck = async () => {
      const conn = await pool.connect();
      if (isTimeoutExpired) {
        conn.release(true);
        return;
      }
      client = conn;
      await client.query('SELECT 1');
    };

    await Promise.race([executeCheck(), timeoutPromise]);
    return true;
  } catch (err) {
    const safeMsg = (err as Error).message ? (err as Error).message.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@') : 'Connection failed';
    logger.warn({ err: safeMsg, target: redactDatabaseUrl(env.DATABASE_URL) }, 'PostgreSQL connection check failed');
    return false;
  } finally {
    if (timer) clearTimeout(timer);
    const connToRelease: any = client;
    if (connToRelease) {
      try {
        connToRelease.release(isTimeoutExpired ? true : undefined);
      } catch {
        // safely swallow release errors
      }
    }
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
