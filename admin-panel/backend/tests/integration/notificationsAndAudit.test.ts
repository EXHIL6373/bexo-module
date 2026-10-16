import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setRepository } from '../../src/db/repository';
import { MemoryRepository } from '../../src/db/repository/memoryRepository';
import { signToken } from '../../src/shared/utils/tokens';

import { createAuthenticatedSession } from '../helpers/authHelper';

describe('Integration — Notifications Center & Audit Ledger', () => {
  let memRepo: MemoryRepository;
  let adminToken: string;

  beforeEach(async () => {
    memRepo = new MemoryRepository();
    setRepository(memRepo);

    adminToken = await createAuthenticatedSession(memRepo, {
      userId: 'usr-admin-corp',
      email: 'rajesh.admin@atbexo.com',
      role: 'admin',
      name: 'Rajesh Ramasamy',
      collegeId: null,
      sessionVersion: 1,
    });
  });

  it('Reads, marks read, and dismisses notifications', async () => {
    const listRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThan(0);

    const notifId = listRes.body.data[0].id;

    // Mark single as read
    const readRes = await request(app)
      .post(`/api/v1/notifications/${notifId}/read`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(readRes.status).toBe(200);
    expect(readRes.body.success).toBe(true);

    // Mark all as read
    const readAllRes = await request(app)
      .post('/api/v1/notifications/mark-all-read')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(readAllRes.status).toBe(200);
    expect(readAllRes.body.success).toBe(true);

    // Dismiss notification
    const dismissRes = await request(app)
      .delete(`/api/v1/notifications/${notifId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(dismissRes.status).toBe(200);
    expect(dismissRes.body.success).toBe(true);
  });

  it('Queries immutable audit ledger and records actions with server actor attribution', async () => {
    const listRes = await request(app)
      .get('/api/v1/audit/logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    // Record audit entry
    const recordRes = await request(app)
      .post('/api/v1/audit/logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'MANUAL_COMPLIANCE_CHECK',
        entity: 'College',
        entityId: 'clg-psg-01',
        entityName: 'PSG College of Technology',
        reason: 'Periodic security check',
      });

    expect(recordRes.status).toBe(201);
    expect(recordRes.body.success).toBe(true);
    expect(recordRes.body.data.actorStaffId).toBe('usr-admin-corp');
    expect(recordRes.body.data.actorRole).toBe('admin');
  });
});
