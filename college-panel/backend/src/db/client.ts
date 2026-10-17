import fs from 'node:fs';
import dns from 'node:dns';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '../config/env';
import * as schema from './schema';
import { logger } from '../shared/utils/logger';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore on runtimes without setDefaultResultOrder
}

const { Pool } = pg;

// Strip channel_binding parameter as node-pg causes a memory allocation loop with channel binding on Windows
// Upgrade sslmode=require to sslmode=verify-full to satisfy pg driver deprecation requirement and ensure strict verification
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
const shouldRejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

const isStrictProduction = env.NODE_ENV === 'production' || env.NODE_ENV === 'staging';

if (rootCertPath && fs.existsSync(rootCertPath)) {
  sslConfig = {
    rejectUnauthorized: shouldRejectUnauthorized,
    ca: fs.readFileSync(rootCertPath).toString(),
  };
} else if (isStrictProduction) {
  sslConfig = {
    rejectUnauthorized: true,
  };
} else if (isSslRequired) {
  sslConfig = {
    rejectUnauthorized: shouldRejectUnauthorized && !sanitizedUrl.includes('neon.tech'),
  };
}

export const pool = new Pool({
  connectionString: sanitizedUrl,
  ssl: sslConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
});


// Prevent unhandled error crashes when idle pool connections close or time out
pool.on('error', (err) => {
  logger.warn({ err: err.message }, 'Unexpected error on idle PostgreSQL client in pool');
});

export const db = drizzle(pool, { schema });

/**
 * Executes a real, bounded-time PostgreSQL probe (SELECT 1).
 * Guarantees release/destruction of connections on timeout or error to prevent leaks.
 */
export async function checkDatabaseConnection(timeoutMs = env.DB_CONNECTION_TIMEOUT_MS): Promise<boolean> {
  if (!env.USE_POSTGRES_STORE) {
    return true;
  }
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
        conn.release(true); // destroy late-arriving connection
        return;
      }
      client = conn;
      await client.query('SELECT 1');
    };

    await Promise.race([executeCheck(), timeoutPromise]);
    return true;
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'PostgreSQL connection check failed');
    return false;
  } finally {
    if (timer) clearTimeout(timer);
    const connToRelease: any = client;
    if (connToRelease) {
      try {
        connToRelease.release(isTimeoutExpired ? true : undefined);
      } catch {
        // safely swallow release errors to prevent masking
      }
    }
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}

