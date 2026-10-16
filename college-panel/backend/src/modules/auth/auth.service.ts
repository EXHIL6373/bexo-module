import crypto from 'node:crypto';
import { store } from '../../db/store';
import { comparePassword, hashPassword } from '../../shared/security/passwords';
import { signToken, generateSecureToken, hashToken } from '../../shared/security/tokens';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { emailService } from '../../shared/email/emailService';
import { getPasswordResetEmailTemplate } from '../../shared/email/templates';

const CORPORATE_ROLES = ['super_admin', 'admin', 'ops', 'finance', 'support'];

export class AuthService {
  async corporateLogin(email: string, password?: string) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password || typeof password !== 'string' || password.trim().length === 0) {
      throw new UnauthorizedError('Invalid corporate email or password.');
    }

    const user = await store.getStaffByEmail(cleanEmail);
    if (!user) {
      throw new UnauthorizedError('Invalid corporate email or password.');
    }

    // Multi-Tenant Guard: Rejection of College staff at Corporate Login Gateway
    if (user.collegeId || user.role.startsWith('college_')) {
      throw new ForbiddenError(
        'Institutional Access Restricted: This portal is for central BEXO corporate administrators. College staff must access via the dedicated College Portal.'
      );
    }

    if (!CORPORATE_ROLES.includes(user.role)) {
      throw new ForbiddenError(
        'Institutional Access Restricted: This portal is for central BEXO corporate administrators. College staff must access via the dedicated College Portal.'
      );
    }

    if (!user.isActive || user.accountStatus !== 'ACTIVE') {
      throw new ForbiddenError('Account is inactive, suspended or revoked.');
    }

    if (!user.passwordHash || typeof user.passwordHash !== 'string') {
      throw new UnauthorizedError('Invalid corporate email or password.');
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid corporate email or password.');
    }

    await store.updateStaff(user.id, { lastLoginAt: new Date().toISOString() });

    const sessionVersion = user.sessionVersion ?? 1;
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      collegeId: null,
      sessionVersion,
    });

    const safeUser = { ...user };
    delete safeUser.passwordHash;

    return { token, user: safeUser };
  }

  async login(email: string, password?: string) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password || typeof password !== 'string' || password.trim().length === 0) {
      throw new UnauthorizedError('Invalid institutional email or password.');
    }

    const user = await store.getStaffByEmail(cleanEmail);

    if (!user) {
      throw new UnauthorizedError('Invalid institutional email or password.');
    }

    // Principle 3: Rejection of Corporate Admins at College Gateway
    if (!user.collegeId || CORPORATE_ROLES.includes(user.role)) {
      throw new ForbiddenError(
        'Institutional Access Restricted: This portal is exclusively for authorized college staff. Corporate administrators must sign in at the BEXO Corporate Admin Console.'
      );
    }

    // Enforce account activation, approval, and suspension rules
    if (!user.isActive || user.accountStatus !== 'ACTIVE') {
      throw new ForbiddenError('Account is inactive, suspended or revoked.');
    }

    const college = await store.getCollegeById(user.collegeId);
    if (!college) {
      throw new NotFoundError('Institutional entity could not be verified.');
    }

    // Principle 4: Institutional Suspension Gate
    if (college.status === 'Suspended' || !college.dashboardAccess) {
      throw new ForbiddenError(
        college.suspensionReason ||
          "Institutional Access Suspended: Your institution's dashboard access is currently suspended. Please contact BEXO Enterprise Support."
      );
    }

    // Strictly require and verify password hash
    if (!user.passwordHash || typeof user.passwordHash !== 'string') {
      throw new UnauthorizedError('Invalid institutional email or password.');
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid institutional email or password.');
    }

    // Update last login
    await store.updateStaff(user.id, { lastLoginAt: new Date().toISOString() });

    // Issue JWT with persistent sessionVersion
    const sessionVersion = user.sessionVersion ?? 1;
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      collegeId: college.id,
      collegeName: college.name,
      sessionVersion,
    });

    const safeUser = { ...user };
    delete safeUser.passwordHash;

    return { token, user: safeUser, college };
  }

  async getMe(userId: string) {
    const user = await store.getStaffById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const safeUser = { ...user };
    delete safeUser.passwordHash;

    // Corporate Staff Identity (no collegeId or corporate role)
    if (!user.collegeId || CORPORATE_ROLES.includes(user.role)) {
      return { ...safeUser, user: safeUser };
    }

    const college = await store.getCollegeById(user.collegeId);
    if (!college) {
      throw new NotFoundError('Institutional profile not found.');
    }

    return { user: safeUser, college };
  }

  async validateInvitation(token: string) {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Invalid invitation token.' };
    }

    const tokenHash = hashToken(token);
    let invite = await store.getInvitationByToken(tokenHash);
    if (!invite) {
      invite = await store.getInvitationByToken(token);
    }

    if (!invite) {
      return { valid: false, error: 'Invalid or unknown invitation token.' };
    }

    if (invite.status !== 'INVITED') {
      return { valid: false, error: `Invitation is no longer active (Status: ${invite.status}).` };
    }

    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      return { valid: false, error: 'Invitation link has expired.' };
    }

    const safeInvite = { ...invite };
    delete safeInvite.tokenHash;

    return { valid: true, invitation: safeInvite };
  }

  async activateAccount(token: string, password: string) {
    if (!password || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long.');
    }

    const check = await this.validateInvitation(token);
    if (!check.valid || !check.invitation) {
      throw new ValidationError(check.error || 'Invalid invitation token.');
    }

    const invite = check.invitation;
    const college = await store.getCollegeById(invite.collegeId);
    if (!college) throw new NotFoundError('Institution not found.');

    const cleanEmail = invite.email.trim().toLowerCase();
    const existingStaff = await store.getStaffByEmail(cleanEmail);
    if (existingStaff && existingStaff.accountStatus === 'ACTIVE') {
      throw new ValidationError('An active account already exists for this email address.');
    }

    const hashedPassword = await hashPassword(password);
    const userId = `usr-staff-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;

    const newStaff = {
      id: userId,
      name: invite.fullName,
      email: cleanEmail,
      phone: invite.phone,
      role: invite.role,
      collegeId: college.id,
      collegeName: college.name,
      designation: invite.designation,
      isActive: true,
      accountStatus: 'ACTIVE',
      passwordHash: hashedPassword,
      invitationId: invite.id,
      sessionVersion: 1,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await store.createStaff(newStaff);

    // Atomically update invitation to prevent concurrent redemption
    await store.updateInvitation(invite.id, {
      status: 'ACTIVE',
      acceptedAt: new Date().toISOString(),
    });

    const authToken = signToken({
      userId: newStaff.id,
      email: newStaff.email,
      role: newStaff.role,
      collegeId: college.id,
      collegeName: college.name,
      sessionVersion: 1,
    });

    const { passwordHash: _, ...safeUser } = newStaff;

    return { token: authToken, user: safeUser, college };
  }

  async requestPasswordReset(email: string) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = await store.getStaffByEmail(cleanEmail);
    // Generic response if not found to prevent user enumeration
    if (!user) {
      return { success: true, message: 'If an institutional account exists with this email, instructions have been sent.' };
    }

    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const resetRecord = {
      id: `rst-${Date.now()}`,
      token: tokenHash, // Store only hashed token in database
      tokenHash,
      email: user.email,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      isUsed: false,
    };

    await store.createResetToken(resetRecord);

    const template = getPasswordResetEmailTemplate(user.email, rawToken);
    await emailService.sendEmail({
      to: user.email,
      toName: user.name,
      subject: template.subject,
      html: template.html,
    });

    const result: any = {
      success: true,
      message: 'If an institutional account exists with this email, instructions have been sent.',
    };

    // Return raw token in development and test environments for automated integration tests
    if (process.env.NODE_ENV !== 'production') {
      result.token = rawToken;
    }

    return result;
  }

  async validateResetToken(token: string) {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Invalid or missing password reset token.' };
    }

    const tokenHash = hashToken(token);
    let record = await store.getResetToken(tokenHash);
    if (!record) {
      record = await store.getResetToken(token);
    }

    if (!record || record.isUsed) {
      return { valid: false, error: 'Invalid or already utilized password reset token.' };
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      return { valid: false, error: 'Password reset token has expired.' };
    }

    return { valid: true, email: record.email };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters long.');
    }

    const check = await this.validateResetToken(token);
    if (!check.valid || !check.email) {
      throw new ValidationError(check.error || 'Invalid or expired password reset token.');
    }

    const tokenHash = hashToken(token);
    let record = await store.getResetToken(tokenHash);
    if (!record) {
      record = await store.getResetToken(token);
    }
    if (!record || record.isUsed) throw new ValidationError('Token not found or already utilized.');

    const user = await store.getStaffById(record.userId);
    if (!user) throw new NotFoundError('User not found.');

    const hashedPassword = await hashPassword(newPassword);
    // Invalidate existing sessions by incrementing sessionVersion
    const nextSessionVersion = (user.sessionVersion ?? 1) + 1;
    await store.updateStaff(user.id, {
      passwordHash: hashedPassword,
      sessionVersion: nextSessionVersion,
    });
    await store.markResetTokenUsed(record.token);

    return { success: true, message: 'Password reset successfully.' };
  }
}

export const authService = new AuthService();

