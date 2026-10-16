import { repository } from '../../db/repository';
import { generateSecureToken, hashToken } from '../../shared/utils/tokens';
import { NotFoundError, ForbiddenError } from '../../shared/errors/AppError';
import { emailService } from '../../shared/email/emailService';
import { getInvitationEmailTemplate } from '../../shared/email/emailTemplates';
import { env } from '../../config/env';
import { ROLES } from '../../config/constants';

export class InvitationsService {
  async createInvitation(payload: any, actor: { userId: string; name: string; role: string; ip: string }) {
    if (payload.role === ROLES.SUPER_ADMIN && actor.role !== ROLES.SUPER_ADMIN) {
      throw new ForbiddenError('Only a super_admin can issue an invitation for the super_admin role.');
    }

    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const college = payload.collegeId ? await repository.getCollegeById(payload.collegeId) : null;
    const collegeName = college ? college.name : payload.collegeName || 'BEXO Corporate Administration';

    // Store ONLY tokenHash in persistent storage — rawToken is NEVER persisted
    const newInvite = {
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenHash,
      email: payload.email.trim().toLowerCase(),
      fullName: payload.fullName,
      phone: payload.phone,
      designation: payload.designation,
      collegeId: payload.collegeId || null,
      collegeName,
      role: payload.role,
      invitedBy: actor.name,
      invitedByRole: actor.role,
      invitedAt: new Date().toISOString(),
      expiresAt,
      status: 'INVITED',
    };

    const created = await repository.createInvitation(newInvite);

    const baseUrl = payload.role.startsWith('college_')
      ? env.COLLEGE_PORTAL_URL
      : env.FRONTEND_ORIGIN.split(',')[0];
    const activationUrl = `${baseUrl}/activate-account?token=${encodeURIComponent(rawToken)}`;

    const tmpl = getInvitationEmailTemplate(created.fullName, created.collegeName, created.role, activationUrl);
    await emailService.sendEmail({
      to: created.email,
      subject: tmpl.subject,
      html: tmpl.html,
      text: tmpl.text,
      toName: created.fullName,
    });

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'ISSUE_INVITATION',
      entity: 'Invitation',
      entityId: created.id,
      entityName: created.fullName,
      ip: actor.ip,
      result: 'Success',
      reason: `Dispatched cryptographic invitation to ${created.email} (${created.role})`,
    });

    return {
      ...created,
      token: env.NODE_ENV === 'development' || env.NODE_ENV === 'test' ? rawToken : undefined,
      rawToken: env.NODE_ENV === 'development' || env.NODE_ENV === 'test' ? rawToken : undefined,
    };
  }

  async resendInvitation(invitationId: string, actor: { userId: string; name: string; role: string; ip: string }) {
    const invite = await repository.getInvitationById(invitationId);
    if (!invite) throw new NotFoundError('Invitation not found.');

    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const updated = await repository.updateInvitation(invitationId, {
      tokenHash,
      expiresAt,
      status: 'INVITED',
    });

    const baseUrl = updated.role.startsWith('college_')
      ? env.COLLEGE_PORTAL_URL
      : env.FRONTEND_ORIGIN.split(',')[0];
    const activationUrl = `${baseUrl}/activate-account?token=${encodeURIComponent(rawToken)}`;

    const tmpl = getInvitationEmailTemplate(updated.fullName, updated.collegeName, updated.role, activationUrl);
    await emailService.sendEmail({
      to: updated.email,
      subject: tmpl.subject,
      html: tmpl.html,
      text: tmpl.text,
      toName: updated.fullName,
    });

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'RESEND_INVITATION',
      entity: 'Invitation',
      entityId: updated.id,
      entityName: updated.fullName,
      ip: actor.ip,
      result: 'Success',
      reason: `Resent cryptographic invitation to ${updated.email}`,
    });

    return {
      ...updated,
      rawToken: env.NODE_ENV === 'development' || env.NODE_ENV === 'test' ? rawToken : undefined,
    };
  }

  async revokeInvitation(invitationId: string, reason: string, actor: { userId: string; name: string; role: string; ip: string }) {
    const invite = await repository.getInvitationById(invitationId);
    if (!invite) throw new NotFoundError('Invitation not found.');

    const updated = await repository.updateInvitation(invitationId, {
      status: 'REVOKED',
      revokedAt: new Date().toISOString(),
      revokedReason: reason,
    });

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'REVOKE_INVITATION',
      entity: 'Invitation',
      entityId: invite.id,
      entityName: invite.fullName,
      ip: actor.ip,
      result: 'Success',
      reason,
      beforeState: { status: invite.status },
      afterState: { status: 'REVOKED' },
    });

    return updated;
  }
}

export const invitationsService = new InvitationsService();
