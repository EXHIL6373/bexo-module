import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { db } from '../../src/db/client';
import * as schema from '../../src/db/schema';
import { inArray, eq } from 'drizzle-orm';

describe('Integration — Student Roster & Onboarding Lifecycle', () => {
  let authToken: string;
  const testRollNumbers = ['21CS777', '21CS888', '21CS889'];

  const cleanup = async () => {
    try {
      const testEmails = ['gowtham777@psgtech.ac.in', 'different777@psgtech.ac.in', 'karthik888@psgtech.ac.in', 'karthik888b@psgtech.ac.in', 'already@psgtech.ac.in', 'nandhini889@psgtech.ac.in'];
      await db.delete(schema.students).where(inArray(schema.students.rollNumber, testRollNumbers)).catch(() => {});
      await db.delete(schema.students).where(inArray(schema.students.email, testEmails)).catch(() => {});
      await db.update(schema.colleges).set({ quotaAllocated: 6000, quotaUsed: 4425, status: 'ACTIVE' }).where(eq(schema.colleges.id, 'clg-psg-01'));
    } catch (err) {
      console.error('Student cleanup warning:', err);
    }
  };

  beforeAll(async () => {
    await cleanup();
    const loginRes = await request(app)
      .post('/api/v1/auth/college-login')
      .send({ email: 'venkatesh.r@psgtech.edu', password: 'ValidPassword123!' });
    authToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await cleanup();
  });

  it('Enrolls a new student successfully', async () => {
    const res = await request(app)
      .post('/api/v1/college/students')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Gowtham Raj',
        rollNumber: '21CS777',
        email: 'gowtham777@psgtech.ac.in',
        department: 'Computer Science',
        course: 'B.E. Computer Science',
        batch: '2021-2025',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rollNumber).toBe('21CS777');
    expect(res.body.data.collegeId).toBe('clg-psg-01');
  }, 45000);

  it('Rejects duplicate roll number enrollment with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/college/students')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Duplicate Student',
        rollNumber: '21CS777', // Same roll number
        email: 'different777@psgtech.ac.in',
        department: 'Computer Science',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('Updates an existing student profile', async () => {
    // Get student
    const listRes = await request(app)
      .get('/api/v1/college/students?search=21CS777')
      .set('Authorization', `Bearer ${authToken}`);

    const stu = listRes.body.data[0];

    const res = await request(app)
      .patch(`/api/v1/college/students/${stu.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ phone: '+91 99887 76655' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phone).toBe('+91 99887 76655');
  });

  it('Revokes student service access', async () => {
    const listRes = await request(app)
      .get('/api/v1/college/students?search=21CS777')
      .set('Authorization', `Bearer ${authToken}`);

    const stu = listRes.body.data[0];

    const res = await request(app)
      .post(`/api/v1/college/students/${stu.id}/revoke`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'Disciplinary suspension' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessStatus).toBe('Revoked');
  });

  it('Reactivates student service access', async () => {
    const listRes = await request(app)
      .get('/api/v1/college/students?search=21CS777')
      .set('Authorization', `Bearer ${authToken}`);

    const stu = listRes.body.data[0];

    const res = await request(app)
      .post(`/api/v1/college/students/${stu.id}/reactivate`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessStatus).toBe('Active');
  });

  it('Performs bulk roster import with duplicate detection', async () => {
    const res = await request(app)
      .post('/api/v1/college/students/bulk-import')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        students: [
          {
            name: 'Karthik Raja',
            rollNumber: '21CS888',
            email: 'karthik888@psgtech.ac.in',
            department: 'Computer Science',
          },
          {
            name: 'Karthik Raja Duplicate',
            rollNumber: '21CS888', // Duplicate in batch!
            email: 'karthik888b@psgtech.ac.in',
            department: 'Computer Science',
          },
          {
            name: 'Already Exists',
            rollNumber: '21CS777', // Already in DB!
            email: 'already@psgtech.ac.in',
            department: 'Computer Science',
          },
          {
            name: 'Nandhini S',
            rollNumber: '21CS889',
            email: 'nandhini889@psgtech.ac.in',
            department: 'Computer Science',
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.importedCount).toBe(2); // 21CS888 and 21CS889
    expect(res.body.data.skippedCount).toBe(2); // The 2 duplicates
    expect(res.body.data.errors.length).toBe(2);
  }, 45000);
});
