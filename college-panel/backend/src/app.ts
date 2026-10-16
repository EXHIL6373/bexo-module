import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { apiRouter, collegeRouter, corporateRoutes, authRoutes } from './routes/index';
import { requestLogger } from './middlewares/requestLogger';
import { globalRateLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler';
import { NotFoundError } from './shared/errors/AppError';
import { openApiSpec } from './docs/openapi';
import { checkDatabaseConnection } from './db/client';
import { sendSuccess } from './shared/utils/response';

export function createApp() {
  const app = express();

  // Trust reverse proxy (AWS ALB, Nginx, Cloudflare, Render, Railway)
  app.set('trust proxy', env.TRUST_PROXY);

  // Security Middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Permit Swagger UI rendering
    })
  );

  // Cross-Origin Resource Sharing
  const configuredOrigins = env.FRONTEND_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
  const devOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'http://localhost:3000',
  ];

  const isHardened = env.NODE_ENV === 'production' || env.NODE_ENV === 'staging';

  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!requestOrigin) return callback(null, true);

        // Check explicitly configured origins first
        if (configuredOrigins.includes(requestOrigin)) {
          return callback(null, true);
        }

        // In development/test, allow localhost ports
        if (!isHardened || env.ALLOW_LOCALHOST_CORS) {
          if (
            /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin) ||
            devOrigins.includes(requestOrigin)
          ) {
            return callback(null, true);
          }
        }

        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      optionsSuccessStatus: 200,
    })
  );

  // Rate Limiting
  app.use(globalRateLimiter);

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request Logging with correlation ID
  app.use(requestLogger);

  // Swagger Documentation
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use(`${env.API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // Root Health Endpoint
  app.get('/health', async (_req, res) => {
    const isDbConnected = await checkDatabaseConnection();
    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        data: {
          status: 'degraded',
          timestamp: new Date().toISOString(),
          uptimeSeconds: Math.floor(process.uptime()),
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
      database: env.USE_POSTGRES_STORE ? 'connected' : 'in-memory',
    });
  });

  // Main API Router (/api/v1)
  app.use(env.API_PREFIX, apiRouter);

  // HTML Spec v2.4.0 Dual-Compatibility Route Aliases
  app.use('/api/college/auth', authRoutes);
  app.use('/api/college', collegeRouter);
  app.use('/api/admin', corporateRoutes);
  app.use('/api', apiRouter);

  // 404 Handler for undefined routes
  app.use((_req, _res, next) => {
    next(new NotFoundError('The requested endpoint was not found on this server.'));
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}

export const app = createApp();
