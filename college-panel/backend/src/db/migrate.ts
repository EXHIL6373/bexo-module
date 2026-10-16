import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client';
import { logger } from '../shared/utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  logger.info('🚀 Starting database migration runner...');

  let migrationsFolder = path.resolve(__dirname, 'migrations');
  if (!fs.existsSync(migrationsFolder)) {
    migrationsFolder = path.resolve(process.cwd(), 'src/db/migrations');
  }

  if (!fs.existsSync(migrationsFolder)) {
    logger.error(`❌ Migration folder not found at: ${migrationsFolder}`);
    process.exit(1);
  }

  // Identify target database and host without exposing credentials
  const rawDbUrl = process.env.DATABASE_URL || '';
  try {
    const parsed = new URL(rawDbUrl);
    const dbName = parsed.pathname.replace(/^\//, '');
    const dbHost = parsed.hostname;
    const dbPort = parsed.port || '5432';
    const dbUser = parsed.username;
    logger.info(`🎯 Target Database Identity: [Database: '${dbName}', Host: '${dbHost}:${dbPort}', User: '${dbUser}']`);

    // Guard: Prevent running staging migration against suspected production database
    if (process.env.NODE_ENV === 'staging' && /prod(uction)?/i.test(dbName) && !/staging/i.test(dbName)) {
      logger.error(`❌ ABORTED: Staging environment detected but target database '${dbName}' matches production pattern.`);
      process.exit(1);
    }
  } catch {
    logger.info('🎯 Target Database Identity: [Configured via DATABASE_URL]');
  }

  logger.info(`📁 Using migrations directory: ${migrationsFolder}`);

  try {
    await migrate(db, { migrationsFolder });
    logger.info('✅ Database migrations applied and synchronized successfully.');
  } catch (error) {
    logger.error({ error }, '❌ Database migration failed.');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
