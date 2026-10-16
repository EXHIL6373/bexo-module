import { checkDatabaseConnection, closePool, db } from '../db/client';
import { sql } from 'drizzle-orm';
import { logger } from '../shared/utils/logger';
import { env } from '../config/env';

export async function verifyDatabase() {
  logger.info({ nodeEnv: env.NODE_ENV }, 'Running database connectivity and integrity verification...');

  const isConnected = await checkDatabaseConnection(10000);
  if (!isConnected) {
    logger.error('FAIL: Database readiness check failed.');
    return false;
  }

  logger.info('PASS: Database connection established.');

  try {
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    logger.info({ tablesFound: tables.rows.map((r: any) => r.table_name) }, 'Database schema tables verified:');
    return true;
  } catch (err: any) {
    logger.error({ err: err.message }, 'FAIL: Error inspecting database tables');
    return false;
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  verifyDatabase()
    .then(async (success) => {
      await closePool();
      process.exit(success ? 0 : 1);
    })
    .catch(async (err) => {
      logger.error({ err: err.message }, 'Unhandled error in db verify');
      await closePool();
      process.exit(1);
    });
}
