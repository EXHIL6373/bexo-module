import { repository } from '../../db/repository';
import { checkDatabaseConnection } from '../../db/client';
import { env } from '../../config/env';

export class SystemService {
  async getSystemHealthMetrics() {
    return await repository.getSystemHealth();
  }

  async getLivenessStatus() {
    let dbStatus = 'healthy';
    if (env.USE_POSTGRES_STORE) {
      const isDbOk = await checkDatabaseConnection(3000);
      dbStatus = isDbOk ? 'healthy' : 'unreachable';
    }

    return {
      status: dbStatus === 'healthy' ? 'pass' : 'degraded',
      service: 'bexo-admin-panel-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      checks: {
        database: dbStatus,
      },
    };
  }
}

export const systemService = new SystemService();
