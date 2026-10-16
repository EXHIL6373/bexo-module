import pg from 'pg';
import { env } from '../config/env';

async function migrate() {
  const cleanUrl = env.DATABASE_URL
    .replace(/([&?])channel_binding=[^&]+(&|$)/g, '$1')
    .replace(/\?&/, '?')
    .replace(/[?&]$/, '');

  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to PG successfully.');
    await client.query('ALTER TABLE colleges ADD COLUMN IF NOT EXISTS lifecycle_version integer DEFAULT 1 NOT NULL;');
    console.log('ALTER TABLE colleges ADD COLUMN IF NOT EXISTS lifecycle_version completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
