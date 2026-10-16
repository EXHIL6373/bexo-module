import fs from 'node:fs';
import path from 'node:path';
import { pool } from './client';
import { logger } from '../shared/utils/logger';

async function run() {
  logger.info('🚀 Connecting to Neon PostgreSQL...');
  const client = await pool.connect();
  try {
    const existingRes = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    const existingTables = existingRes.rows.map((r: any) => r.table_name);
    logger.info({ existingTables }, 'Current tables in Neon database');

    const sqlPath = path.resolve(process.cwd(), 'src/db/migrations/0000_flippant_firebird.sql');
    const rawSql = fs.readFileSync(sqlPath, 'utf8');

    // Convert CREATE TABLE to CREATE TABLE IF NOT EXISTS
    const safeSql = rawSql.replace(/CREATE TABLE /gi, 'CREATE TABLE IF NOT EXISTS ');

    const statements = safeSql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    logger.info(`Applying ${statements.length} migration statements safely...`);
    for (const stmt of statements) {
      try {
        await client.query(stmt);
      } catch (stmtErr: any) {
        // Ignore relation or index already exists
        if (stmtErr.code === '42P07' || stmtErr.code === '42710') {
          // Already exists, skip
        } else {
          logger.warn({ msg: stmtErr.message, code: stmtErr.code }, 'Statement warning');
        }
      }
    }

    const finalRes = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    const allTables = finalRes.rows.map((r: any) => r.table_name);
    logger.info({ allTables }, '🎉 Migration complete! All active tables in Neon database:');
  } catch (err) {
    logger.error({ err }, '❌ Migration process failed.');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
