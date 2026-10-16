import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setRepository } from '../../src/db/repository';
import { MemoryRepository } from '../../src/db/repository/memoryRepository';
import { signToken } from '../../src/shared/utils/tokens';

import { createAuthenticatedSession } from '../helpers/authHelper';

describe('Integration — System Health & Operations Telemetry', () => {
  let memRepo: MemoryRepository;
  let adminToken: string;

  beforeEach(async () => {
    memRepo = new MemoryRepository();
    setRepository(memRepo);

    adminToken = await createAuthenticatedSession(memRepo, {
      userId: 'usr-admin-1',
      email: 'ezhil@atbexo.com',
      role: 'super_admin',
      name: 'Ezhilarasan M.',
      collegeId: null,
      sessionVersion: 1,
    });
  });

  it('Responds to root liveness probe GET /health without exposing internal secrets', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pass');
    expect(res.body.service).toBe('bexo-admin-panel-backend');
    expect(res.body.password).toBeUndefined();
    expect(res.body.databaseUrl).toBeUndefined();
    expect(res.body.jwtSecret).toBeUndefined();
  });

  it('Requires authentication for administrative telemetry /api/v1/system/health', async () => {
    // Unauthenticated request fails
    const unauthRes = await request(app).get('/api/v1/system/health');
    expect(unauthRes.status).toBe(401);

    // Authenticated request succeeds
    const authRes = await request(app)
      .get('/api/v1/system/health')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(authRes.status).toBe(200);
    expect(authRes.body.success).toBe(true);
    expect(Array.isArray(authRes.body.data)).toBe(true);
    expect(authRes.body.data.length).toBeGreaterThan(0);
    expect(authRes.body.data[0].latencyMs).toBeDefined();
  });
});
