import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError.js';
import { sendError } from '../shared/utils/response.js';
import { logger } from '../shared/utils/logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = (req.headers['x-request-id'] as string) || undefined;

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path, method: req.method }, err.message);
    } else {
      logger.warn({ statusCode: err.statusCode, path: req.path, method: req.method, errors: err.errors }, err.message);
    }
    return sendError(res, err.statusCode, err.message, err.errors, requestId);
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid authentication token.', undefined, requestId);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Authentication token has expired. Please sign in again.', undefined, requestId);
  }

  if ('type' in err && (err as any).type === 'entity.parse.failed') {
    return sendError(res, 400, 'Malformed JSON payload in request body.', undefined, requestId);
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled server error');

  const isHardened = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
  const message = isHardened
    ? 'An unexpected internal server error occurred.'
    : err.message || 'Internal server error';

  return sendError(res, 500, message, undefined, requestId);
}
