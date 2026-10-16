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
    console.log('Connected to admin Neon DB successfully.');

    await client.query('ALTER TABLE colleges ADD COLUMN IF NOT EXISTS lifecycle_version integer DEFAULT 1 NOT NULL;');
    await client.query("ALTER TABLE colleges ADD COLUMN IF NOT EXISTS sync_status varchar(32) DEFAULT 'SYNCED' NOT NULL;");

    await client.query(`
      CREATE TABLE IF NOT EXISTS lifecycle_outbox (
        id varchar(128) PRIMARY KEY,
        college_id varchar(128) NOT NULL,
        event_type varchar(64) NOT NULL,
        version integer NOT NULL,
        payload jsonb NOT NULL,
        status varchar(32) DEFAULT 'PENDING' NOT NULL,
        attempts integer DEFAULT 0 NOT NULL,
        max_attempts integer DEFAULT 5 NOT NULL,
        last_error text,
        next_attempt_at timestamp DEFAULT NOW() NOT NULL,
        processed_at timestamp,
        created_at timestamp DEFAULT NOW() NOT NULL,
        updated_at timestamp DEFAULT NOW() NOT NULL
      );
    `);
    await client.query('CREATE INDEX IF NOT EXISTS outbox_status_idx ON lifecycle_outbox (status);');
    await client.query('CREATE INDEX IF NOT EXISTS outbox_college_idx ON lifecycle_outbox (college_id);');

    console.log('Admin DB migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
