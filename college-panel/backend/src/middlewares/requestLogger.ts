import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { logger } from '../shared/utils/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
    }, `${req.method} ${req.originalUrl || req.url} ${res.statusCode} in ${duration}ms`);
  });

  next();
}
