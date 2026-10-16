import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setRepository } from '../../src/db/repository';
import { MemoryRepository } from '../../src/db/repository/memoryRepository';
import { signToken } from '../../src/shared/utils/tokens';

import { createAuthenticatedSession } from '../helpers/authHelper';

describe('Integration — Student Oversight', () => {
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

  it('Lists students across colleges with query filtering', async () => {
    const res = await request(app)
      .get('/api/v1/students?collegeId=clg-psg-01')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('Retrieves single student by ID', async () => {
    const res = await request(app)
      .get('/api/v1/students/stu-psg-001')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rollNumber).toBe('21CS001');
    expect(res.body.data.name).toBe('Aravind Swaminathan');
  });

  it('Adds new student and enforces unique rollNumber per college', async () => {
    const payload = {
      name: 'Pooja Mohan',
      rollNumber: '21CS055',
      collegeId: 'clg-psg-01',
      collegeName: 'PSG College of Technology',
      department: 'Computer Science',
      email: '21cs055@psgtech.edu',
    };

    const res = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rollNumber).toBe('21CS055');

    // Duplicate registration attempt
    const dupRes = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.success).toBe(false);
  });

  it('Revokes and reactivates student platform access', async () => {
    // Revoke
    const revokeRes = await request(app)
      .post('/api/v1/students/stu-psg-001/revoke')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Disciplinary suspension from academic council' });

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.success).toBe(true);
    expect(revokeRes.body.data.accessStatus).toBe('Revoked');

    // Reactivate
    const reactRes = await request(app)
      .post('/api/v1/students/stu-psg-001/reactivate')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(reactRes.status).toBe(200);
    expect(reactRes.body.success).toBe(true);
    expect(reactRes.body.data.accessStatus).toBe('Active');
  });
});
