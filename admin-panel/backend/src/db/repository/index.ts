import { env } from '../../config/env';
import { AdminRepository } from './types';
import { DrizzleRepository } from './drizzleRepository';
import { MemoryRepository } from './memoryRepository';
import { logger } from '../../shared/utils/logger';

let activeRepository: AdminRepository;

if (env.USE_POSTGRES_STORE) {
  logger.info('Initializing Drizzle PostgreSQL Repository as active database store');
  activeRepository = new DrizzleRepository();
} else {
  logger.info('Initializing In-Memory Repository as active database store (Development/Test Mode)');
  activeRepository = new MemoryRepository();
}

export function getRepository(): AdminRepository {
  return activeRepository;
}

export function setRepository(repo: AdminRepository): void {
  activeRepository = repo;
}

export const repository = new Proxy({} as AdminRepository, {
  get(_target, prop) {
    return (activeRepository as any)[prop];
  },
});

export * from './types';
