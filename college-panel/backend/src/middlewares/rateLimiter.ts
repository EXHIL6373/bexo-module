import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { sendError } from '../shared/utils/response.js';

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: true,
  handler: (_req, res) => {
    sendError(res, 429, 'Too many requests from this IP address. Please try again later.');
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50, // 50 attempts per 15 min
  standardHeaders: 'draft-7',
  legacyHeaders: true,
  handler: (_req, res) => {
    sendError(res, 429, 'Too many authentication attempts. Please try again after 15 minutes.');
  },
});
