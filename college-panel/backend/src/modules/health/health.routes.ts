import { Router, Request, Response } from 'express';
import { sendSuccess, sendError } from '../../shared/utils/response';
import { checkDatabaseConnection } from '../../db/client';
import { env } from '../../config/env';

const router = Router();

// Overall composite health
router.get('/health', async (_req: Request, res: Response) => {
  const isDbConnected = await checkDatabaseConnection();

  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      data: {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        service: 'bexo-college-panel-backend',
        version: '1.0.0',
        database: 'disconnected',
      },
      error: {
        message: 'Database connection unavailable.',
      },
    });
  }

  return sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'bexo-college-panel-backend',
    version: '1.0.0',
    database: 'connected',
  });
});

// Liveness probe (server process is alive independently of database connectivity)
router.get('/health/live', (_req: Request, res: Response) => {
  return sendSuccess(res, {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Readiness probe (PostgreSQL connection is healthy and ready to serve requests)
router.get('/health/ready', async (_req: Request, res: Response) => {
  const isDbConnected = await checkDatabaseConnection();
  if (!isDbConnected) {
    return sendError(res, 503, 'Database readiness check failed: PostgreSQL connection unavailable.');
  }

  return sendSuccess(res, {
    status: 'ready',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});

export const healthRoutes = router;

