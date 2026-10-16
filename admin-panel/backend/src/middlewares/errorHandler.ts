import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { sendError } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';
import { env } from '../config/env';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // Handle AppError and known subclasses
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(
        { err: err.message, stack: err.stack, path: req.path, requestId: req.id },
        'Operational server error'
      );
    }
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    return sendError(res, 'Malformed JSON payload provided.', 400);
  }

  // Handle unhandled errors
  logger.error(
    { err: err.message || err, stack: err.stack, path: req.path, requestId: req.id },
    'Unhandled internal server exception'
  );

  const safeMessage =
    env.NODE_ENV === 'production' || env.NODE_ENV === 'staging'
      ? 'An unexpected internal server error occurred.'
      : err.message || 'Internal server error.';

  return sendError(res, safeMessage, 500);
}
