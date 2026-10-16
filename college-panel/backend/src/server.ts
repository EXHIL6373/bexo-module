import { app } from './app';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { checkDatabaseConnection, closePool } from './db/client';
import { store } from './db/store';

async function startServer() {
  const isPersistentRequired = env.NODE_ENV === 'production' || env.NODE_ENV === 'staging' || env.USE_POSTGRES_STORE;
  const isDbConnected = await checkDatabaseConnection();

  if (isPersistentRequired) {
    if (!isDbConnected) {
      logger.error('❌ FATAL: Persistent storage required but PostgreSQL connection failed. Server startup aborted.');
      process.exit(1);
    }
    if (store.kind !== 'postgres') {
      logger.error('❌ FATAL: Persistent storage required but active repository is not PostgreSQL. Server startup aborted.');
      process.exit(1);
    }
    logger.info('📦 Storage Engine: [POSTGRESQL] (DrizzlePostgresRepository active and connected).');
  } else {
    logger.info(`📦 Storage Engine: [${store.kind.toUpperCase()}] (${store.kind === 'postgres' ? 'PostgreSQL active' : 'in-memory fixtures active'}).`);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`=======================================================`);
    logger.info(`🚀 BEXO College Admin Backend running on port ${env.PORT}`);
    logger.info(`🔗 Base URL: http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`📑 Swagger Docs: http://localhost:${env.PORT}/docs`);
    logger.info(`🏥 Health Check: http://localhost:${env.PORT}/health`);
    logger.info(`=======================================================`);
  });

  const gracefulShutdown = async () => {
    logger.info('Shutting down server gracefully...');
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await closePool();
        logger.info('Database pool drained successfully.');
      } catch (err) {
        logger.error({ err }, 'Error closing database pool');
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

startServer();
