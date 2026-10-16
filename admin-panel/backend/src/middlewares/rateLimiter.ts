import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { sendError } from '../shared/utils/response';

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return sendError(
      res,
      'Too many requests from this IP address, please try again shortly.',
      429
    );
  },
});

export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return sendError(
      res,
      'Too many authentication attempts. Please wait before retrying.',
      429
    );
  },
});
