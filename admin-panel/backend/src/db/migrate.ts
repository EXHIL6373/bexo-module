import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, closePool, checkDatabaseConnection, redactDatabaseUrl } from './client';
import { env } from '../config/env';
import { logger } from '../shared/utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsFolder = path.resolve(__dirname, 'migrations');

export async function runMigrations() {
  logger.info(
    { nodeEnv: env.NODE_ENV, target: redactDatabaseUrl(env.DATABASE_URL), migrationsFolder },
    'Starting PostgreSQL migration process via Drizzle...'
  );

  const isConnected = await checkDatabaseConnection(10000);
  if (!isConnected) {
    throw new Error(
      `Database connection check failed before running migrations against target: ${redactDatabaseUrl(env.DATABASE_URL)}`
    );
  }

  await migrate(db, { migrationsFolder });
  logger.info('Database migrations applied successfully.');
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runMigrations()
    .then(async () => {
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ err: err.message }, 'Migration script failed');
      await closePool();
      process.exit(1);
    });
}
