import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setRepository } from '../../src/db/repository';
import { MemoryRepository } from '../../src/db/repository/memoryRepository';
import { signToken } from '../../src/shared/utils/tokens';

import { createAuthenticatedSession } from '../helpers/authHelper';

describe('Integration — Corporate Staff & Invitations Engine', () => {
  let memRepo: MemoryRepository;
  let superAdminToken: string;

  beforeEach(async () => {
    memRepo = new MemoryRepository();
    setRepository(memRepo);

    superAdminToken = await createAuthenticatedSession(memRepo, {
      userId: 'usr-super-kavin',
      email: 'kavinbalaji@atbexo.com',
      role: 'super_admin',
      name: 'Kavinbalaji S K',
      collegeId: null,
      sessionVersion: 1,
    });
  });

  it('Lists corporate staff users with sensitive fields omitted', async () => {
    const res = await request(app)
      .get('/api/v1/users/staff')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].passwordHash).toBeUndefined();
  });

  it('Creates new corporate staff user and updates profile details', async () => {
    const createRes = await request(app)
      .post('/api/v1/users/staff')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Vimalanathan K.',
        email: 'vimal.ops@atbexo.com',
        role: 'ops',
        designation: 'Infrastructure Operator',
        department: 'Operations',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.id).toBeDefined();

    const staffId = createRes.body.data.id;

    // Update details
    const updateRes = await request(app)
      .patch(`/api/v1/users/staff/${staffId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ designation: 'Senior Operations Lead' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.designation).toBe('Senior Operations Lead');
  });

  it('Prevents self-deletion of the active administrator account', async () => {
    const res = await request(app)
      .delete('/api/v1/users/staff/usr-super-kavin')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Issues, resends, and revokes cryptographic invitations', async () => {
    // Issue invitation
    const inviteRes = await request(app)
      .post('/api/v1/invitations')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        email: 'dean.placement@partner.edu',
        fullName: 'Dr. Anand Kumar',
        role: 'college_admin',
        collegeId: 'clg-psg-01',
        designation: 'Dean of Placements',
      });

    expect(inviteRes.status).toBe(201);
    expect(inviteRes.body.success).toBe(true);
    expect(inviteRes.body.data.token).toBeDefined();

    const inviteId = inviteRes.body.data.id;

    // Resend invitation
    const resendRes = await request(app)
      .post(`/api/v1/invitations/${inviteId}/resend`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(resendRes.status).toBe(200);
    expect(resendRes.body.success).toBe(true);

    // Revoke invitation
    const revokeRes = await request(app)
      .post(`/api/v1/invitations/${inviteId}/revoke`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ reason: 'Position reassigned' });

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.success).toBe(true);
  });
});
