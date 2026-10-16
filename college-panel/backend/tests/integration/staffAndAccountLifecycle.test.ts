import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Integration — Staff Management & Full Account Lifecycle', () => {
  let adminToken: string;
  let inviteToken: string;
  let newStaffEmail = `staff-${Date.now()}@psgtech.edu`;
  let resetToken: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/college-login')
      .send({ email: 'venkatesh.r@psgtech.edu', password: 'ValidPassword123!' });
    adminToken = loginRes.body.data.token;
  });

  it('Admin invites a new coordinator', async () => {
    const res = await request(app)
      .post('/api/v1/college/staff/invite')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Prof. Suresh Mani',
        email: newStaffEmail,
        role: 'college_coordinator',
        department: 'Mechatronics',
        designation: 'Assistant Professor',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.tokenHash).toBeUndefined();
    expect(res.body.data.status).toBe('INVITED');
    const invitationId = res.body.data.id;
    const initialInviteToken = res.body.data.token;

    // Resend invitation: must issue new token and invalidate initial token
    const resendRes = await request(app)
      .post(`/api/v1/college/staff/invitations/${invitationId}/resend`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resendRes.status).toBe(200);
    expect(resendRes.body.success).toBe(true);
    expect(resendRes.body.data.token).toBeDefined();
    expect(resendRes.body.data.tokenHash).toBeUndefined();
    const newInviteToken = resendRes.body.data.token;
    expect(newInviteToken).not.toBe(initialInviteToken);

    // 1. Initial token must now be invalid
    const oldValidateRes = await request(app)
      .get(`/api/v1/auth/invitations/validate?token=${initialInviteToken}`);
    expect(oldValidateRes.status).toBe(200);
    expect(oldValidateRes.body.data.valid).toBe(false);

    // 2. Activation using the invalidated initial token must be rejected with 400
    const oldActivateRes = await request(app)
      .post('/api/v1/auth/activate-account')
      .send({
        token: initialInviteToken,
        password: 'AttemptInvalidOldToken123!',
      });
    expect(oldActivateRes.status).toBe(400);
    expect(oldActivateRes.body.success).toBe(false);

    // Set inviteToken to the newly issued token for the subsequent tests
    inviteToken = newInviteToken;
  });

  it('Validates newly issued invitation token before activation', async () => {
    const res = await request(app)
      .get(`/api/v1/auth/invitations/validate?token=${inviteToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.invitation.email).toBe(newStaffEmail);
  });

  it('Activates account with single-use invitation token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/activate-account')
      .send({
        token: inviteToken,
        password: 'NewSecurePassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(newStaffEmail);
    expect(res.body.data.user.role).toBe('college_coordinator');
  });

  it('Re-using the same invitation token fails', async () => {
    const res = await request(app)
      .post('/api/v1/auth/activate-account')
      .send({
        token: inviteToken,
        password: 'AnotherPassword123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Newly activated user logs in with new credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/college-login')
      .send({
        email: newStaffEmail,
        password: 'NewSecurePassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('Requests password reset for institutional user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: newStaffEmail });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    resetToken = res.body.data.token;
  });

  it('Validates password reset token', async () => {
    const res = await request(app)
      .get(`/api/v1/auth/reset-password/validate?token=${resetToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(true);
  });

  it('Completes password reset with new password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: resetToken,
        newPassword: 'BrandNewPassword999!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Logs in successfully with newly reset password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/college-login')
      .send({
        email: newStaffEmail,
        password: 'BrandNewPassword999!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
