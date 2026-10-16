import express, { Request, Response } from 'express';
import { env } from './config/env';
import { securityHeaders, corsMiddleware } from './middlewares/securityHeaders';
import { requestLogger } from './middlewares/requestLogger';
import { apiLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler';
import { apiRouter } from './routes';
import { systemController } from './modules/system/system.controller';
import { sendError } from './shared/utils/response';

const app = express();

// Reverse proxy trust (ALB, Nginx, Cloudflare)
app.set('trust proxy', env.TRUST_PROXY);

// Security Headers & CORS
app.use(securityHeaders);
app.use(corsMiddleware);

// Rate Limiter
app.use(apiLimiter);

// Body Parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Telemetry & Request Logging
app.use(requestLogger);

// Root lightweight liveness probe for Cloud / Kubernetes health checks
app.get('/health', systemController.getLiveness);

// Mount main API router
app.use(env.API_PREFIX, apiRouter);

// 404 Not Found fallback handler
app.use((req: Request, res: Response) => {
  return sendError(
    res,
    `Route '${req.method} ${req.originalUrl}' not found on BEXO Corporate Admin API.`,
    404
  );
});

// Centralized Error Handler
app.use(errorHandler);

export { app };
