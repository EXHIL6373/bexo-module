import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import * as dbClient from '../../src/db/client';

describe('Integration — Operational Requests, Notifications, Tasks & Reports', () => {
  let collegeToken: string;
  let corporateToken: string;
  let requestId: string;

  beforeAll(async () => {
    // Authenticate College Admin
    const collegeLogin = await request(app)
      .post('/api/v1/auth/college-login')
      .send({ email: 'venkatesh.r@psgtech.edu', password: 'ValidPassword123!' });
    collegeToken = collegeLogin.body.data.token;

    // Issue Corporate Admin token (for testing corporate review flow)
    const { signToken } = await import('../../src/shared/security/tokens');
    corporateToken = signToken({
      userId: 'usr-super-kavin',
      email: 'kavinbalaji@atbexo.com',
      role: 'super_admin',
      collegeId: null,
    });
  });

  it('Submits operational quota increase request from college', async () => {
    const res = await request(app)
      .post('/api/v1/college/requests')
      .set('Authorization', `Bearer ${collegeToken}`)
      .send({
        type: 'Quota Increase',
        requester: 'Prof. R. Venkatesh',
        requesterEmail: 'venkatesh.r@psgtech.edu',
        requesterRole: 'college_admin',
        details: {
          title: 'Extra 500 Seats for AI Cohort',
          description: 'Expanding seats for new department',
          currentValue: 5000,
          requestedValue: 5500,
        },
        priority: 'High',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Pending');
    requestId = res.body.data.id;
  });

  it('Corporate administrator approves the request and updates institutional quota', async () => {
    const res = await request(app)
      .post(`/api/v1/corporate/requests/${requestId}/review`)
      .set('Authorization', `Bearer ${corporateToken}`)
      .send({
        status: 'Approved',
        decisionReason: 'Verified commercial approval for 500 seat expansion.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Approved');

    // Verify college profile now reflects new quota
    const profileRes = await request(app)
      .get('/api/v1/college/profile')
      .set('Authorization', `Bearer ${collegeToken}`);

    expect(profileRes.body.data.quotaAllocated).toBe(5500);
  });

  it('Fetches notifications, marks single as read, and marks all read', async () => {
    const notifsRes = await request(app)
      .get('/api/v1/college/notifications')
      .set('Authorization', `Bearer ${collegeToken}`);

    expect(notifsRes.status).toBe(200);
    expect(notifsRes.body.success).toBe(true);
    expect(notifsRes.body.data.length).toBeGreaterThan(0);

    const firstId = notifsRes.body.data[0].id;
    const markRes = await request(app)
      .patch(`/api/v1/college/notifications/${firstId}/read`)
      .set('Authorization', `Bearer ${collegeToken}`);

    expect(markRes.status).toBe(200);

    const markAllRes = await request(app)
      .post('/api/v1/college/notifications/read-all')
      .set('Authorization', `Bearer ${collegeToken}`);

    expect(markAllRes.status).toBe(200);
  });

  it('Fetches tasks and toggles task status', async () => {
    const tasksRes = await request(app)
      .get('/api/v1/college/tasks')
      .set('Authorization', `Bearer ${collegeToken}`);

    expect(tasksRes.status).toBe(200);
    expect(tasksRes.body.success).toBe(true);

    if (tasksRes.body.data.length > 0) {
      const taskId = tasksRes.body.data[0].id;
      const toggleRes = await request(app)
        .patch(`/api/v1/college/tasks/${taskId}/toggle`)
        .set('Authorization', `Bearer ${collegeToken}`);

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.success).toBe(true);
    }
  });

  it('Exports institutional reports in CSV format', async () => {
    const res = await request(app)
      .get('/api/v1/college/reports/export?type=students')
      .set('Authorization', `Bearer ${collegeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.csvContent).toContain('RollNumber');
    expect(res.body.data.downloadUrl).toBeDefined();
  });

  it('Checks health endpoint at /health when database is healthy', async () => {
    const checkSpy = vi.spyOn(dbClient, 'checkDatabaseConnection').mockResolvedValueOnce(true);
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.database).toBe('connected');
    checkSpy.mockRestore();
  });

  it('Returns 503 degraded status at /health when database is unavailable', async () => {
    const checkSpy = vi.spyOn(dbClient, 'checkDatabaseConnection').mockResolvedValueOnce(false);
    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.data.status).toBe('degraded');
    expect(res.body.data.database).toBe('disconnected');
    checkSpy.mockRestore();
  });
});
