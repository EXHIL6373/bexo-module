import { repository } from '../../db/repository';
import { comparePassword, hashPassword } from '../../shared/utils/passwords';
import {
  signToken,
  generateSecureToken,
  hashToken,
  AuthTokenPayload,
} from '../../shared/utils/tokens';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../shared/errors/AppError';
import { emailService } from '../../shared/email/emailService';
import {
  getPasswordResetEmailTemplate,
} from '../../shared/email/emailTemplates';
import { env } from '../../config/env';

export class AuthService {
  async login(email: string, password?: string, ip = '127.0.0.1') {
    const user = await repository.getStaffByEmail(email);

    if (!user) {
      throw new UnauthorizedError('Invalid corporate credentials.');
    }

    // MULTI-TENANT GUARD RULE
    if (user.collegeId || (user.role && user.role.startsWith('college_'))) {
      throw new ForbiddenError(
        'Institutional Access Restricted: This portal is for central BEXO corporate administrators. College staff must access via the dedicated College Portal.'
      );
    }

    if (!user.isActive || user.accountStatus === 'SUSPENDED' || user.accountStatus === 'REVOKED') {
      throw new ForbiddenError('Your corporate account is suspended or inactive. Please contact system admin.');
    }

    if (!password) {
      throw new UnauthorizedError('Password is required.');
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid corporate credentials.');
    }

    await repository.updateLastLogin(user.id);

    const currentSessionVersion = user.sessionVersion || 1;
    const tokenPayload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      collegeId: null,
      sessionVersion: currentSessionVersion,
    };

    const token = signToken(tokenPayload);
    const tokenH = hashToken(token);

    await repository.createSession({
      userId: user.id,
      tokenHash: tokenH,
      sessionVersion: currentSessionVersion,
      ip,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const { passwordHash: _, ...safeUser } = user;
    return { token, user: safeUser };
  }

  async logout(userId?: string, token?: string) {
    if (token) {
      const tokenH = hashToken(token);
      await repository.revokeSession(tokenH);
    }
    if (userId) {
      await repository.bumpSessionVersion(userId);
      await repository.revokeAllUserSessions(userId);
    }
    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await repository.getStaffById(userId);
    if (!user) {
      throw new NotFoundError('Corporate staff profile not found.');
    }
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async requestPasswordReset(email: string) {
    const user = await repository.getStaffByEmail(email);

    // Resistance to account enumeration: always return confirmation
    if (!user || user.collegeId || user.role.startsWith('college_') || !user.isActive) {
      return { success: true, message: 'If this corporate email is registered, reset instructions have been sent.' };
    }

    const rawToken = generateSecureToken(32);
    const tokenH = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Note: NEVER persist rawToken to database; only tokenHash is stored
    await repository.createPasswordResetToken({
      userId: user.id,
      email: user.email,
      tokenHash: tokenH,
      expiresAt,
    });

    const resetUrl = `${env.FRONTEND_ORIGIN.split(',')[0]}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const tmpl = getPasswordResetEmailTemplate(user.name, resetUrl);

    await emailService.sendEmail({
      to: user.email,
      subject: tmpl.subject,
      html: tmpl.html,
      text: tmpl.text,
      toName: user.name,
    });

    return {
      success: true,
      token: env.NODE_ENV === 'development' || env.NODE_ENV === 'test' ? rawToken : undefined,
      message: 'If this corporate email is registered, reset instructions have been sent.',
    };
  }

  async validateResetToken(token: string) {
    const tokenH = hashToken(token);
    const record = await repository.getResetTokenByHash(tokenH);

    if (!record) {
      return { valid: false, error: 'Password reset token not found or invalid.' };
    }

    if (record.isUsed) {
      return { valid: false, error: 'Password reset token has already been used.' };
    }

    const expiresAt = new Date(record.expiresAt);
    if (isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      return { valid: false, error: 'Password reset token has expired.' };
    }

    return { valid: true, email: record.email };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenH = hashToken(token);
    const newHash = await hashPassword(newPassword);

    // Atomically consumes reset token, updates password, increments sessionVersion, and revokes sessions
    const result = await repository.consumeResetTokenAndSetPassword(tokenH, newHash);
    return { success: true, email: result.email };
  }

  async validateInviteToken(token: string) {
    const tokenH = hashToken(token);
    const invite = await repository.getInvitationByTokenHash(tokenH);

    if (!invite) {
      return { valid: false, error: 'Invitation token not found or invalid.' };
    }

    if (invite.status === 'EXPIRED' || new Date(invite.expiresAt).getTime() < Date.now()) {
      return { valid: false, error: 'Invitation link has expired. Request a new invitation.' };
    }

    if (invite.status === 'REVOKED') {
      return { valid: false, error: 'This invitation has been revoked by administration.' };
    }

    if (invite.status === 'ACTIVE') {
      return { valid: false, error: 'This invitation has already been used to activate an account.' };
    }

    return { valid: true, invitation: invite };
  }

  async activateAccount(token: string, password: string) {
    const tokenH = hashToken(token);
    const newHash = await hashPassword(password);

    // Atomically consumes invitation token and creates/activates staff user in a single transaction
    const result = await repository.consumeInvitationAndActivateUser(tokenH, newHash);
    return result;
  }
}

export const authService = new AuthService();
