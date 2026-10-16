import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createApp } from '../../src/app';
import { errorHandler } from '../../src/middlewares/errorHandler';

describe('Security — Staging and Production Hardening Audit Suite', () => {
  describe('CORS Origin Restriction & Multi-Origin Parsing', () => {
    it('Allows explicitly configured origins from FRONTEND_ORIGIN', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('Rejects untrusted external origin', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/health')
        .set('Origin', 'https://malicious-attacker.com');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Internal Server Error Sanitization', () => {
    it('Masks unhandled internal server error details in hardened environments', async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'staging';
        const app = express();
        app.get('/test-internal-error', () => {
          throw new Error('Sensitive PostgreSQL database column details failed at 0xdeadbeef');
        });
        app.use(errorHandler);

        const res = await request(app).get('/test-internal-error');
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('An unexpected internal server error occurred.');
        expect(res.body.message).not.toContain('Sensitive PostgreSQL database');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('Masks unhandled internal server error in production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        const app = express();
        app.get('/test-internal-error', () => {
          throw new Error('Database connection string leaked: postgres://user:pass@host/db');
        });
        app.use(errorHandler);

        const res = await request(app).get('/test-internal-error');
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('An unexpected internal server error occurred.');
        expect(res.body.message).not.toContain('postgres://');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('Rate Limiting on Authentication Endpoints', () => {
    it('Applies rate limit headers on auth endpoints', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/v1/auth/college-login')
        .send({ email: 'probe@college.edu', password: 'AnyPassword123!' });

      const hasRateLimitHeader =
        res.headers.hasOwnProperty('ratelimit') ||
        res.headers.hasOwnProperty('ratelimit-policy') ||
        res.headers.hasOwnProperty('x-ratelimit-limit');

      expect(hasRateLimitHeader).toBe(true);
    });
  });

  describe('Reverse Proxy Header Trust', () => {
    it('Includes X-Request-Id header in responses for distributed tracing', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/health')
        .set('X-Request-Id', 'req-staging-trace-12345');

      expect(res.headers['x-request-id']).toBe('req-staging-trace-12345');
    });
  });
});
