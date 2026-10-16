import { EmailTemplateType, OutboxEmail } from '../types';

export interface EmailRenderOptions {
  toEmail: string;
  recipientName: string;
  collegeName?: string;
  roleName?: string;
  actionUrl?: string;
  expiresInDays?: number;
  invitedByName?: string;
  reason?: string;
}

export function generateEmailContent(
  templateType: EmailTemplateType,
  opts: EmailRenderOptions
): { subject: string; actionLabel: string; previewSnippet: string; html: string } {
  const currentYear = new Date().getFullYear();
  const college = opts.collegeName || 'Academic Institution';
  const name = opts.recipientName || 'Valued Partner';
  const role = opts.roleName || 'College Administrator';
  const inviter = opts.invitedByName || 'BEXO Platform Administration';
  const actionUrl = opts.actionUrl || '#/login';

  const baseHeader = `
    <div style="background: linear-gradient(135deg, #0B152B 0%, #1E3A8A 100%); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
      <div style="display: inline-flex; align-items: center; gap: 8px;">
        <span style="background: #3B82F6; color: white; font-weight: 900; font-size: 18px; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.05em;">BEXO</span>
        <span style="color: #E2E8F0; font-size: 15px; font-weight: 600; letter-spacing: -0.01em;">ENTERPRISE INSTITUTIONAL CONTROL</span>
      </div>
      <p style="color: #93C5FD; font-size: 12px; margin: 8px 0 0; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Zero-Trust Multi-Tenant Campus Gateway</p>
    </div>
  `;

  const baseFooter = `
    <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px; color: #64748B;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #334155;">Confidential & Protected Institutional Transmission</p>
      <p style="margin: 0 0 10px; line-height: 1.5;">This communication is cryptographically generated for ${name} (${opts.toEmail}) on behalf of ${college}. If you did not expect this communication, report to security@atbexo.com.</p>
      <div style="font-size: 11px; color: #94A3B8;">
        &copy; ${currentYear} BEXO Technologies Inc. All rights reserved. &bull; Enterprise SOC2 Type II Certified
      </div>
    </div>
  `;

  switch (templateType) {
    case 'college_admin_invite': {
      const subject = `Welcome to BEXO — Activate Your College Admin Account for ${college}`;
      const actionLabel = 'Activate Admin Account';
      const previewSnippet = `You have been authorized by ${inviter} to manage ${college} on the BEXO platform.`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          ${baseHeader}
          <div style="padding: 36px 32px; color: #1E293B; line-height: 1.6;">
            <div style="display: inline-block; background: #EFF6FF; color: #1D4ED8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; margin-bottom: 16px;">
              Executive Authorization Granted
            </div>
            <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 16px;">Institutional Admin Access Ready</h2>
            <p style="font-size: 14.5px; margin: 0 0 16px;">Dear <strong>${name}</strong>,</p>
            <p style="font-size: 14px; margin: 0 0 20px; color: #475569;">
              <strong>${inviter}</strong> has provisioned your institutional administrative account on BEXO as <strong>${role}</strong> for <strong>${college}</strong>.
            </p>
            <div style="background: #F1F5F9; border-left: 4px solid #2563EB; padding: 14px 16px; border-radius: 4px; margin-bottom: 24px; font-size: 13px;">
              <div style="margin-bottom: 4px;"><strong>Target College:</strong> ${college}</div>
              <div style="margin-bottom: 4px;"><strong>Administrative Role:</strong> ${role}</div>
              <div style="margin-bottom: 4px;"><strong>Official Email:</strong> ${opts.toEmail}</div>
              <div><strong>Token Validity:</strong> 7 Days (Single-Use Activation)</div>
            </div>
            <p style="font-size: 13.5px; color: #475569; margin: 0 0 24px;">
              To configure institutional credentials and enter your college command center, click the secure activation link below:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" style="background: #2563EB; color: white; font-weight: 700; font-size: 14.5px; text-decoration: none; padding: 13px 28px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
                ${actionLabel} &rarr;
              </a>
            </div>
            <p style="font-size: 12px; color: #64748B; margin: 24px 0 0; text-align: center;">
              Or copy link: <a href="${actionUrl}" style="color: #2563EB; word-break: break-all;">${actionUrl}</a>
            </p>
          </div>
          ${baseFooter}
        </div>
      `;
      return { subject, actionLabel, previewSnippet, html };
    }

    case 'staff_invite': {
      const subject = `Institutional Invitation: Join ${college} on BEXO`;
      const actionLabel = 'Complete Account Setup';
      const previewSnippet = `You have been added to the institutional operations team for ${college}.`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px;">
          ${baseHeader}
          <div style="padding: 36px 32px; color: #1E293B; line-height: 1.6;">
            <h2 style="font-size: 20px; font-weight: 800; color: #0F172A; margin: 0 0 16px;">Staff Membership Invitation</h2>
            <p style="font-size: 14px; margin: 0 0 14px;">Hello <strong>${name}</strong>,</p>
            <p style="font-size: 14px; color: #475569; margin: 0 0 20px;">
              The administrative leadership at <strong>${college}</strong> has authorized your access to the institutional portal with the role of <strong>${role}</strong>.
            </p>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 13px;">
              <div><strong>Institution:</strong> ${college}</div>
              <div style="margin-top: 4px;"><strong>Department Role:</strong> ${role}</div>
            </div>
            <div style="text-align: center; margin: 26px 0;">
              <a href="${actionUrl}" style="background: #0F172A; color: white; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 26px; border-radius: 6px; display: inline-block;">
                ${actionLabel} &rarr;
              </a>
            </div>
          </div>
          ${baseFooter}
        </div>
      `;
      return { subject, actionLabel, previewSnippet, html };
    }

    case 'invite_reminder': {
      const subject = `Reminder: Activate Your Pending BEXO Access for ${college}`;
      const actionLabel = 'Activate Now (Expiring Soon)';
      const previewSnippet = `Your single-use institutional onboarding token for ${college} expires in 48 hours.`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px;">
          ${baseHeader}
          <div style="padding: 36px 32px; color: #1E293B;">
            <span style="background: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px;">Action Required</span>
            <h2 style="font-size: 20px; font-weight: 800; margin: 16px 0;">Invitation Token Expiring Soon</h2>
            <p style="font-size: 14px; color: #475569;">Dear ${name}, your invitation to join ${college} as ${role} has not yet been accepted. Please activate your access to prevent token expiration.</p>
            <div style="text-align: center; margin: 26px 0;">
              <a href="${actionUrl}" style="background: #D97706; color: white; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block;">${actionLabel}</a>
            </div>
          </div>
          ${baseFooter}
        </div>
      `;
      return { subject, actionLabel, previewSnippet, html };
    }

    case 'invite_expired': {
      const subject = `Notice: BEXO Invitation Expired for ${college}`;
      const actionLabel = 'Request Re-Invitation';
      const previewSnippet = `The security token for your administrative account has expired.`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px;">
          ${baseHeader}
          <div style="padding: 36px 32px; color: #1E293B;">
            <h2 style="font-size: 20px; font-weight: 800; color: #991B1B;">Invitation Token Expired</h2>
            <p style="font-size: 14px; color: #475569;">The onboarding token for ${name} at ${college} has exceeded its validity window. Please reach out to your college administrator or BEXO support for a fresh security token.</p>
          </div>
          ${baseFooter}
        </div>
      `;
      return { subject, actionLabel, previewSnippet, html };
    }

    case 'password_reset': {
      const subject = `BEXO Security: Password Reset Request for ${name}`;
      const actionLabel = 'Set New Secure Password';
      const previewSnippet = `A password reset was requested for your BEXO institutional account.`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px;">
          ${baseHeader}
          <div style="padding: 36px 32px; color: #1E293B;">
            <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 16px;">Password Reset Request</h2>
            <p style="font-size: 14px; color: #475569;">We received a request to reset credentials for <strong>${opts.toEmail}</strong>. If you made this request, click below within 60 minutes:</p>
            <div style="text-align: center; margin: 26px 0;">
              <a href="${actionUrl}" style="background: #2563EB; color: white; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 26px; border-radius: 6px; display: inline-block;">${actionLabel}</a>
            </div>
            <p style="font-size: 12px; color: #64748B;">If you did not request this, you may safely disregard this message. Your password remains unchanged.</p>
          </div>
          ${baseFooter}
        </div>
      `;
      return { subject, actionLabel, previewSnippet, html };
    }

    case 'account_activated': {
      const subject = `Confirmation: Your BEXO Account is Live & Active (${college})`;
      const actionLabel = 'Launch College Dashboard';
      const previewSnippet = `Your account credentials have been established. Welcome to the BEXO ecosystem.`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px;">
          ${baseHeader}
          <div style="padding: 36px 32px; color: #1E293B;">
            <div style="background: #ECFDF5; color: #065F46; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; display: inline-block; margin-bottom: 12px;">Account Live</div>
            <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 16px;">Credentials Verified Successfully</h2>
            <p style="font-size: 14px; color: #475569;">Welcome ${name}! Your account has been activated with institutional privileges for <strong>${college}</strong>.</p>
            <div style="text-align: center; margin: 26px 0;">
              <a href="${actionUrl}" style="background: #059669; color: white; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 26px; border-radius: 6px; display: inline-block;">${actionLabel}</a>
            </div>
          </div>
          ${baseFooter}
        </div>
      `;
      return { subject, actionLabel, previewSnippet, html };
    }

    case 'college_suspended': {
      const subject = `Urgent Governance Notice: ${college} Operations Temporarily Suspended`;
      const actionLabel = 'Review Compliance Status';
      const previewSnippet = `Administrative notice regarding institutional status modification for ${college}.`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px;">
          ${baseHeader}
          <div style="padding: 36px 32px; color: #1E293B;">
            <div style="background: #FEE2E2; color: #991B1B; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; display: inline-block; margin-bottom: 12px;">Operational Hold</div>
            <h2 style="font-size: 20px; font-weight: 800; color: #991B1B; margin: 0 0 16px;">Institutional Status: Suspended</h2>
            <p style="font-size: 14px; color: #475569;">Please be advised that operational capabilities for <strong>${college}</strong> have been temporarily placed on administrative hold.</p>
            <div style="background: #FEF2F2; border: 1px solid #FCA5A5; padding: 14px; border-radius: 6px; font-size: 13px; color: #7F1D1D; margin: 16px 0;">
              <strong>Stated Reason:</strong> ${opts.reason || 'Administrative governance review / commercial compliance hold.'}
            </div>
            <p style="font-size: 13px; color: #64748B;">Student historical data, resumes, and portfolio records remain fully preserved and protected under strict institutional isolation.</p>
          </div>
          ${baseFooter}
        </div>
      `;
      return { subject, actionLabel, previewSnippet, html };
    }

    case 'college_reactivated': {
      const subject = `Compliance Restored: ${college} Full Access Reinstated on BEXO`;
      const actionLabel = 'Resume College Operations';
      const previewSnippet = `Good news: institutional operational eligibility has been fully restored.`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px;">
          ${baseHeader}
          <div style="padding: 36px 32px; color: #1E293B;">
            <div style="background: #ECFDF5; color: #065F46; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; display: inline-block; margin-bottom: 12px;">Access Restored</div>
            <h2 style="font-size: 20px; font-weight: 800; color: #065F46; margin: 0 0 16px;">Institutional Operational Eligibility Restored</h2>
            <p style="font-size: 14px; color: #475569;">All platform services, student entitlement provisioning, and dashboard permissions for <strong>${college}</strong> have been reinstated.</p>
            <div style="text-align: center; margin: 26px 0;">
              <a href="${actionUrl}" style="background: #059669; color: white; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 26px; border-radius: 6px; display: inline-block;">${actionLabel}</a>
            </div>
          </div>
          ${baseFooter}
        </div>
      `;
      return { subject, actionLabel, previewSnippet, html };
    }
  }
}
