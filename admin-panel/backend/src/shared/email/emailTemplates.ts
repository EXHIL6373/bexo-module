export interface EmailTemplateResult {
  subject: string;
  html: string;
  text: string;
}

export function getInvitationEmailTemplate(
  fullName: string,
  collegeName: string,
  role: string,
  actionUrl: string
): EmailTemplateResult {
  const subject = `Welcome to BEXO — Complete Your Account Activation (${collegeName})`;
  const text = `Hello ${fullName},\n\nYou have been invited to join the BEXO platform as ${role} for ${collegeName}.\n\nActivate your account by clicking the link below:\n${actionUrl}\n\nThis invitation link will expire in 7 days.\n\nBEXO Central Administration`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background: #0a0e17; color: #f1f5f9; padding: 24px;">
        <div style="max-width: 600px; margin: auto; background: #162032; border: 1px solid #24344d; border-radius: 8px; padding: 32px;">
          <h2 style="color: #3b82f6; margin-top: 0;">Welcome to BEXO</h2>
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>You have been invited to join the BEXO Institutional Platform as <strong>${role}</strong> for <strong>${collegeName}</strong>.</p>
          <p style="margin: 28px 0;">
            <a href="${actionUrl}" style="background: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Activate Your Account
            </a>
          </p>
          <p style="color: #94a3b8; font-size: 13px;">This invitation token is single-use and will expire in 7 days.</p>
          <hr style="border: 0; border-top: 1px solid #24344d; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 12px;">BEXO Central Corporate Administration • Automated System Message</p>
        </div>
      </body>
    </html>
  `;
  return { subject, html, text };
}

export function getPasswordResetEmailTemplate(
  fullName: string,
  actionUrl: string
): EmailTemplateResult {
  const subject = 'BEXO Corporate Admin — Password Reset Request';
  const text = `Hello ${fullName},\n\nA password reset request was received for your corporate account.\n\nReset your password here:\n${actionUrl}\n\nThis link expires in 1 hour. If you did not request this, please contact central security immediately.\n\nBEXO Central Administration`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background: #0a0e17; color: #f1f5f9; padding: 24px;">
        <div style="max-width: 600px; margin: auto; background: #162032; border: 1px solid #24344d; border-radius: 8px; padding: 32px;">
          <h2 style="color: #3b82f6; margin-top: 0;">Password Reset Request</h2>
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>A request was received to reset your password for the BEXO Corporate Admin Control Panel.</p>
          <p style="margin: 28px 0;">
            <a href="${actionUrl}" style="background: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p style="color: #94a3b8; font-size: 13px;">This security link is valid for 1 hour. If you did not request this, ignore this email or alert your security lead.</p>
          <hr style="border: 0; border-top: 1px solid #24344d; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 12px;">BEXO Central Corporate Administration • Security Telemetry</p>
        </div>
      </body>
    </html>
  `;
  return { subject, html, text };
}
