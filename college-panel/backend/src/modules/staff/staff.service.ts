import crypto from 'node:crypto';
import { store } from '../../db/store';
import { ForbiddenError, NotFoundError, ValidationError, ConflictError } from '../../shared/errors/AppError';
import { emailService } from '../../shared/email/emailService';
import { getInvitationEmailTemplate } from '../../shared/email/templates';
import { comparePassword, hashPassword } from '../../shared/security/passwords';
import { generateSecureToken, hashToken } from '../../shared/security/tokens';

const ALLOWED_INSTITUTIONAL_ROLES = ['college_admin', 'college_coordinator', 'college_staff'];

export class StaffService {
  async getStaff(collegeId: string) {
    const list = await store.getStaffByCollege(collegeId);
    return list.map((s: any) => {
      const copy = { ...s };
      delete copy.passwordHash;
      return copy;
    });
  }

  async inviteStaff(collegeId: string, input: any, actor: any) {
    // Role Escalation Prevention (Section 9 & Test 3.2)
    if (!ALLOWED_INSTITUTIONAL_ROLES.includes(input.role)) {
      throw new ForbiddenError(
        `Role Escalation Blocked: College administrators are strictly restricted from granting corporate or unapproved roles ('${input.role}'). Allowed roles: ${ALLOWED_INSTITUTIONAL_ROLES.join(', ')}.`
      );
    }

    const college = await store.getCollegeById(collegeId);
    if (!college) throw new NotFoundError('College not found.');

    const cleanEmail = input.email.trim().toLowerCase();
    const existingUser = await store.getStaffByEmail(cleanEmail);
    if (existingUser && existingUser.collegeId === collegeId) {
      throw new ConflictError('A staff member with this email already exists in this institution.');
    }

    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const invitationId = `inv-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;

    const invitation = {
      id: invitationId,
      token: tokenHash, // Store only hash in persistent records
      tokenHash,
      email: cleanEmail,
      fullName: input.name,
      phone: input.mobile,
      designation: input.designation || 'Staff',
      collegeId,
      collegeName: college.name,
      role: input.role,
      invitedBy: actor.name || actor.email,
      invitedByRole: actor.role,
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours
      status: 'INVITED',
    };

    await store.createInvitation(invitation);

    // Dispatch invitation email with rawToken
    const emailTemplate = getInvitationEmailTemplate(input.name, college.name, input.role, rawToken);
    await emailService.sendEmail({
      to: cleanEmail,
      toName: input.name,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    // Record audit event with sensitive token redacted
    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId,
      actorStaffId: actor.userId,
      actorName: actor.name || actor.email,
      actorRole: actor.role,
      action: 'INVITE_COLLEGE_STAFF',
      entity: 'StaffInvitation',
      entityId: invitationId,
      entityName: input.name,
      ip: '127.0.0.1',
      result: 'Success',
      afterState: {
        id: invitationId,
        email: cleanEmail,
        fullName: input.name,
        role: input.role,
        collegeId,
        status: 'INVITED',
      },
    });

    const responseInvite: any = { ...invitation };
    delete responseInvite.tokenHash;
    if (process.env.NODE_ENV !== 'production') {
      responseInvite.token = rawToken;
    } else {
      delete responseInvite.token;
    }
    return responseInvite;
  }

  async resendInvite(collegeId: string, invitationId: string, actor: any) {
    const invite = await store.getInvitationById(invitationId);
    if (!invite || invite.collegeId !== collegeId) {
      throw new NotFoundError('Invitation record not found.');
    }

    if (invite.status !== 'INVITED') {
      throw new ValidationError(`Cannot resend invitation with status '${invite.status}'.`);
    }

    // Generate fresh cryptographically secure raw token and compute SHA-256 hash
    const newRawToken = generateSecureToken(32);
    const newTokenHash = hashToken(newRawToken);
    const newExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    // Invalidate previous token by updating stored hash in persistent records
    const updated = await store.updateInvitation(invitationId, {
      token: newTokenHash,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
    });

    // Transmit raw token exclusively through email dispatch
    const emailTemplate = getInvitationEmailTemplate(invite.fullName, invite.collegeName, invite.role, newRawToken);
    await emailService.sendEmail({
      to: invite.email,
      toName: invite.fullName,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId,
      actorStaffId: actor.userId,
      actorName: actor.name || actor.email,
      actorRole: actor.role,
      action: 'RESEND_STAFF_INVITATION',
      entity: 'StaffInvitation',
      entityId: invitationId,
      entityName: invite.fullName,
      ip: '127.0.0.1',
      result: 'Success',
      afterState: {
        id: invitationId,
        email: invite.email,
        status: 'INVITED',
        resentAt: new Date().toISOString(),
      },
    });

    // Never expose token hashes in API responses; expose rawToken only in non-production test harness
    const responseInvite: any = { ...updated };
    delete responseInvite.tokenHash;
    if (process.env.NODE_ENV !== 'production') {
      responseInvite.token = newRawToken;
    } else {
      delete responseInvite.token;
    }

    return responseInvite;
  }

  async revokeInvite(collegeId: string, invitationId: string, reason: string | undefined, actor: any) {
    const invite = await store.getInvitationById(invitationId);
    if (!invite || invite.collegeId !== collegeId) {
      throw new NotFoundError('Invitation record not found.');
    }

    await store.updateInvitation(invitationId, {
      status: 'REVOKED',
      revokedAt: new Date().toISOString(),
      revokedReason: reason || 'Revoked by college administrator',
    });

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId,
      actorStaffId: actor.userId,
      actorName: actor.name || actor.email,
      actorRole: actor.role,
      action: 'REVOKE_STAFF_INVITATION',
      entity: 'StaffInvitation',
      entityId: invitationId,
      entityName: invite.fullName,
      ip: '127.0.0.1',
      result: 'Success',
      reason,
    });
  }

  async updateStaffRole(collegeId: string, staffId: string, newRole: string, actor: any) {
    // Role Escalation Prevention (Section 9 & Test 3.3)
    if (!ALLOWED_INSTITUTIONAL_ROLES.includes(newRole)) {
      throw new ForbiddenError(
        `Role Escalation Blocked: Attempting to assign unauthorized or corporate administrative role ('${newRole}') is strictly prohibited.`
      );
    }

    const user = await store.getStaffById(staffId);
    if (!user || user.collegeId !== collegeId) {
      throw new NotFoundError('Staff record not found.');
    }

    const nextSessionVersion = (user.sessionVersion ?? 1) + 1;
    const updated = await store.updateStaff(staffId, {
      role: newRole,
      sessionVersion: nextSessionVersion,
    });

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId,
      actorStaffId: actor.userId,
      actorName: actor.name || actor.email,
      actorRole: actor.role,
      action: 'UPDATE_STAFF_ROLE',
      entity: 'StaffUser',
      entityId: staffId,
      entityName: user.name,
      ip: '127.0.0.1',
      result: 'Success',
      beforeState: { role: user.role },
      afterState: { role: newRole },
    });

    const safe = { ...updated };
    delete safe.passwordHash;
    return safe;
  }

  async suspendStaff(collegeId: string, staffId: string, reason: string | undefined, actor: any) {
    const user = await store.getStaffById(staffId);
    if (!user || user.collegeId !== collegeId) {
      throw new NotFoundError('Staff record not found.');
    }

    const nextSessionVersion = (user.sessionVersion ?? 1) + 1;
    const updated = await store.updateStaff(staffId, {
      isActive: false,
      accountStatus: 'SUSPENDED',
      sessionVersion: nextSessionVersion,
    });

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId,
      actorStaffId: actor.userId,
      actorName: actor.name || actor.email,
      actorRole: actor.role,
      action: 'SUSPEND_STAFF',
      entity: 'StaffUser',
      entityId: staffId,
      entityName: user.name,
      ip: '127.0.0.1',
      result: 'Success',
      reason,
    });

    const safe = { ...updated };
    delete safe.passwordHash;
    return safe;
  }

  async activateStaff(collegeId: string, staffId: string, actor: any) {
    const user = await store.getStaffById(staffId);
    if (!user || user.collegeId !== collegeId) {
      throw new NotFoundError('Staff record not found.');
    }

    const nextSessionVersion = (user.sessionVersion ?? 1) + 1;
    const updated = await store.updateStaff(staffId, {
      isActive: true,
      accountStatus: 'ACTIVE',
      sessionVersion: nextSessionVersion,
    });

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId,
      actorStaffId: actor.userId,
      actorName: actor.name || actor.email,
      actorRole: actor.role,
      action: 'ACTIVATE_STAFF',
      entity: 'StaffUser',
      entityId: staffId,
      entityName: user.name,
      ip: '127.0.0.1',
      result: 'Success',
    });

    const safe = { ...updated };
    delete safe.passwordHash;
    return safe;
  }

  async updateProfile(userId: string, updates: any) {
    const user = await store.getStaffById(userId);
    if (!user) throw new NotFoundError('User not found.');

    const allowed = {
      name: updates.name || user.name,
      phone: updates.phone !== undefined ? updates.phone : user.phone,
      designation: updates.designation || user.designation,
      department: updates.department || user.department,
    };

    const updated = await store.updateStaff(userId, allowed);
    const safe = { ...updated };
    delete safe.passwordHash;
    return safe;
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await store.getStaffById(userId);
    if (!user) throw new NotFoundError('User not found.');

    if (!user.passwordHash) {
      throw new ValidationError('Account does not have a valid password set.');
    }

    const match = await comparePassword(currentPass, user.passwordHash);
    if (!match) {
      throw new ValidationError('Current password provided is incorrect.');
    }

    const newHash = await hashPassword(newPass);
    const nextSessionVersion = (user.sessionVersion ?? 1) + 1;
    await store.updateStaff(userId, {
      passwordHash: newHash,
      sessionVersion: nextSessionVersion,
    });
  }
}

export const staffService = new StaffService();
