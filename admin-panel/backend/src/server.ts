import { app } from './app';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { checkDatabaseConnection, closePool } from './db/client';
import { outboxProcessor } from './integrations/outboxProcessor';

async function bootstrap() {
  logger.info(
    { nodeEnv: env.NODE_ENV, port: env.PORT, apiPrefix: env.API_PREFIX },
    'Starting BEXO Corporate Admin Panel Backend...'
  );

  // If running with PostgreSQL store, execute bounded-time readiness check
  if (env.USE_POSTGRES_STORE) {
    const isDbConnected = await checkDatabaseConnection(env.DB_CONNECTION_TIMEOUT_MS);
    if (!isDbConnected) {
      logger.error('CRITICAL: Initial PostgreSQL connection check failed. Aborting startup.');
      process.exit(1);
    }
    logger.info('PostgreSQL connection check passed.');
  }

  const server = app.listen(env.PORT, () => {
    logger.info(
      `BEXO Corporate Admin Backend running on port ${env.PORT} (${env.NODE_ENV})`
    );
    logger.info(`Base API prefix: ${env.API_PREFIX}`);
    logger.info(`Liveness probe: http://localhost:${env.PORT}/health`);

    // Recover and process any unacknowledged lifecycle outbox events from previous runs
    outboxProcessor.processPending().catch((err) => {
      logger.warn({ err: err.message }, 'Initial lifecycle outbox recovery completed with warnings');
    });
  });

  // Graceful shutdown handling
  let isShuttingDown = false;

  async function shutdown(signal: string) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info({ signal }, 'Graceful shutdown initiated. Closing HTTP server...');

    server.close(async () => {
      logger.info('HTTP server closed. Releasing database connection pool...');
      try {
        if (env.USE_POSTGRES_STORE) {
          await closePool();
          logger.info('Database pool drained and closed.');
        }
        process.exit(0);
      } catch (err: any) {
        logger.error({ err: err.message }, 'Error closing database pool during shutdown');
        process.exit(1);
      }
    });

    // Forced termination timeout if connections don't drain within 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown: Timed out waiting for active connections to finish');
      process.exit(1);
    }, 10000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.fatal({ err: err.message, stack: err.stack }, 'Fatal bootstrap failure');
  process.exit(1);
});
