import { env } from '../../config/env';

export function getInvitationEmailTemplate(name: string, collegeName: string, role: string, token: string) {
  const url = `${env.FRONTEND_ORIGIN}/activate-account?token=${token}`;
  return {
    subject: `Official Onboarding Invitation: ${collegeName} on BEXO Enterprise Portal`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a;">Welcome to BEXO College Portal</h2>
        <p>Dear ${name},</p>
        <p>You have been officially invited to join <strong>${collegeName}</strong> as an authorized <strong>${role.replace('_', ' ').toUpperCase()}</strong>.</p>
        <p>Please complete your account activation and configure your password by clicking below:</p>
        <div style="margin: 24px 0;">
          <a href="${url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Activate Account
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">This invitation token expires in 72 hours and is single-use.</p>
        <p style="color: #94a3b8; font-size: 11px;">If you did not anticipate this invitation, please ignore this email.</p>
      </div>
    `,
  };
}

export function getPasswordResetEmailTemplate(email: string, token: string) {
  const url = `${env.FRONTEND_ORIGIN}/reset-password?token=${token}`;
  return {
    subject: 'BEXO College Portal: Password Reset Request',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your institutional account (<strong>${email}</strong>).</p>
        <div style="margin: 24px 0;">
          <a href="${url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">This reset link expires in 1 hour. If you did not request this, please disregard.</p>
      </div>
    `,
  };
}
