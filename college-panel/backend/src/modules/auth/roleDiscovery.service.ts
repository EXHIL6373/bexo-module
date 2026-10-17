import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { store } from '../../db/store';
import { normalizePhoneNumber } from '../../shared/security/phoneNormalization';
import {
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
} from '../../shared/errors/AppError';
import { env } from '../../config/env';
import { signToken } from '../../shared/security/tokens';
import { logger } from '../../shared/utils/logger';

export interface DiscoveredRole {
  id: string;
  role: string;
  displayName: string;
  portal: 'admin' | 'college' | 'user';
  portalUrl: string;
  landingPath: string;
  collegeId?: string | null;
  collegeName?: string | null;
  entityId: string;
  entityType: 'corporate_staff' | 'college_staff' | 'student' | 'consumer';
  hasPremium: boolean;
  services?: string[];
  department?: string;
  rollNumber?: string;
  email?: string;
}

export interface PreAuthTokenPayload {
  type: 'pre_auth';
  phoneNumber: string;
  identityId: string;
  availableRoles: DiscoveredRole[];
  iat?: number;
  exp?: number;
}

export class RoleDiscoveryService {
  private readonly jwtSecret: string;
  private readonly adminPortalUrl: string;
  private readonly collegePortalUrl: string;

  constructor() {
    this.jwtSecret = env.JWT_SECRET;
    this.adminPortalUrl = 'http://localhost:5173/admin';
    this.collegePortalUrl = 'http://localhost:5174/dashboard';
  }

  /**
   * Discovers all authorized roles for a verified canonical phone number.
   */
  public async discoverRolesForPhone(
    rawPhoneNumber: string
  ): Promise<{
    phoneNumber: string;
    identity: any;
    availableRoles: DiscoveredRole[];
    requiresRoleSelection: boolean;
    preAuthToken?: string;
    token?: string;
    user?: any;
    selectedRole?: DiscoveredRole;
  }> {
    const norm = normalizePhoneNumber(rawPhoneNumber);
    if (!norm.isValid) {
      throw new ValidationError('Invalid canonical phone number.');
    }

    // 1. Retrieve or provision core user identity record
    let identity = await store.getIdentityByPhone(norm.e164);
    if (!identity) {
      identity = await store.createIdentity({
        id: `usr-id-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        phoneNumber: norm.e164,
        phoneVerifiedAt: new Date(),
        primaryRole: 'normal_user',
        status: 'ACTIVE',
      });
    } else {
      await store.updateIdentity(identity.id, {
        phoneVerifiedAt: new Date(),
      });
    }

    // 2. Discover matching staff users (corporate admin & college management)
    const matchingStaff = await store.getStaffByPhone(norm.e164);

    // 3. Discover matching student rosters
    const matchingStudents = await store.getStudentsByPhone(norm.e164);

    const availableRoles: DiscoveredRole[] = [];

    // Map Staff Users
    for (const staff of matchingStaff) {
      if (!staff.isActive || staff.accountStatus === 'SUSPENDED' || staff.accountStatus === 'REVOKED') {
        continue;
      }

      if (staff.collegeId) {
        // College management / department coordinator
        availableRoles.push({
          id: `role-clg-${staff.id}`,
          role: staff.role || 'college_admin',
          displayName: `${staff.name} — ${staff.collegeName || 'Institutional Staff'} (${staff.role})`,
          portal: 'college',
          portalUrl: this.collegePortalUrl,
          landingPath: '/college/dashboard',
          collegeId: staff.collegeId,
          collegeName: staff.collegeName,
          entityId: staff.id,
          entityType: 'college_staff',
          hasPremium: true,
          department: staff.department,
          email: staff.email,
        });
      } else {
        // Corporate Central Admin
        availableRoles.push({
          id: `role-admin-${staff.id}`,
          role: staff.role || 'super_admin',
          displayName: `${staff.name} — Corporate Administrator (${staff.role})`,
          portal: 'admin',
          portalUrl: this.adminPortalUrl,
          landingPath: '/admin',
          collegeId: null,
          collegeName: null,
          entityId: staff.id,
          entityType: 'corporate_staff',
          hasPremium: true,
          email: staff.email,
        });
      }
    }

    // Map Students
    for (const student of matchingStudents) {
      if (student.accessStatus !== 'Active') {
        continue;
      }

      availableRoles.push({
        id: `role-student-${student.id}`,
        role: 'college_user',
        displayName: `${student.name} — Enrolled Student (${student.collegeName}, Roll: ${student.rollNumber})`,
        portal: 'user',
        portalUrl: 'http://localhost:5173/user',
        landingPath: '/user',
        collegeId: student.collegeId,
        collegeName: student.collegeName,
        entityId: student.id,
        entityType: 'student',
        hasPremium: true,
        services: (student.services as string[]) || [],
        department: student.department,
        rollNumber: student.rollNumber,
        email: student.email,
      });
    }

    // Consumer fallback: If no institutional roles found, provide regular consumer user role
    if (availableRoles.length === 0) {
      availableRoles.push({
        id: `role-consumer-${identity.id}`,
        role: 'normal_user',
        displayName: `BEXO Member (${norm.e164})`,
        portal: 'user',
        portalUrl: 'http://localhost:5173/user',
        landingPath: '/user',
        collegeId: null,
        collegeName: null,
        entityId: identity.id,
        entityType: 'consumer',
        hasPremium: false,
        services: [],
      });
    }

    // Synchronize role assignments in identity_role_assignments table
    for (const r of availableRoles) {
      try {
        await store.createRoleAssignment({
          id: `asgn-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          identityId: identity.id,
          role: r.role,
          collegeId: r.collegeId || null,
          collegeName: r.collegeName || null,
          entityId: r.entityId,
          entityType: r.entityType,
          isActive: true,
        });
      } catch {
        // Idempotent assignment synchronization
      }
    }

    // 4. Decision: Single Role vs Multi-Role Selection
    if (availableRoles.length === 1) {
      const selected = availableRoles[0];
      const sessionResult = await this.issueSessionForRole(identity, selected);

      return {
        phoneNumber: norm.e164,
        identity,
        availableRoles,
        requiresRoleSelection: false,
        token: sessionResult.token,
        user: sessionResult.user,
        selectedRole: selected,
      };
    }

    // Multi-role: Generate short-lived pre-auth token (10 minutes)
    const preAuthToken = jwt.sign(
      {
        type: 'pre_auth',
        phoneNumber: norm.e164,
        identityId: identity.id,
        availableRoles,
      },
      this.jwtSecret,
      { expiresIn: '10m', algorithm: 'HS256' }
    );

    return {
      phoneNumber: norm.e164,
      identity,
      availableRoles,
      requiresRoleSelection: true,
      preAuthToken,
    };
  }

  /**
   * Completes role selection when multiple personas exist for a verified phone number.
   */
  public async selectRole(
    preAuthToken: string,
    selectedRoleId: string
  ) {
    if (!preAuthToken || typeof preAuthToken !== 'string') {
      throw new ValidationError('Pre-authentication token is required.');
    }
    if (!selectedRoleId || typeof selectedRoleId !== 'string') {
      throw new ValidationError('Role selection ID is required.');
    }

    let payload: PreAuthTokenPayload;
    try {
      payload = jwt.verify(preAuthToken, this.jwtSecret, { algorithms: ['HS256'] }) as PreAuthTokenPayload;
    } catch {
      throw new UnauthorizedError('Pre-authentication selection token has expired or is invalid. Please sign in again.');
    }

    if (payload.type !== 'pre_auth') {
      throw new UnauthorizedError('Invalid token type for role selection.');
    }

    const chosenRole = payload.availableRoles.find((r) => r.id === selectedRoleId);
    if (!chosenRole) {
      throw new ForbiddenError(
        'Unauthorized role selection: The requested persona is not authorized for your verified identity.'
      );
    }

    const identity = await store.getIdentityByPhone(payload.phoneNumber);
    if (!identity) {
      throw new NotFoundError('Identity record not found for verified phone number.');
    }

    const sessionResult = await this.issueSessionForRole(identity, chosenRole);

    return {
      success: true,
      token: sessionResult.token,
      user: sessionResult.user,
      selectedRole: chosenRole,
    };
  }

  /**
   * Issues the full authenticated session JWT for a selected persona.
   */
  public async issueSessionForRole(identity: any, role: DiscoveredRole) {
    let email = role.email || `${role.entityId}@bexo.internal`;
    let sessionVersion = 1;

    if (role.entityType === 'corporate_staff' || role.entityType === 'college_staff') {
      const staffUser = await store.getStaffById(role.entityId);
      if (staffUser) {
        email = staffUser.email;
        sessionVersion = staffUser.sessionVersion || 1;
        await store.updateStaff(staffUser.id, { lastLoginAt: new Date().toISOString() });
      }
    }

    const tokenPayload = {
      userId: role.entityId,
      identityId: identity.id,
      email,
      role: role.role,
      name: role.displayName.split('—')[0].trim(),
      collegeId: role.collegeId || null,
      collegeName: role.collegeName || undefined,
      portal: role.portal,
      portalUrl: role.portalUrl,
      landingPath: role.landingPath,
      hasPremium: role.hasPremium,
      services: role.services || [],
      sessionVersion,
    };

    const token = signToken(tokenPayload);

    const user = {
      id: role.entityId,
      identityId: identity.id,
      phoneNumber: identity.phoneNumber,
      email,
      name: role.displayName.split('—')[0].trim(),
      role: role.role,
      portal: role.portal,
      portalUrl: role.portalUrl,
      landingPath: role.landingPath,
      collegeId: role.collegeId || null,
      collegeName: role.collegeName || null,
      hasPremium: role.hasPremium,
      services: role.services || [],
      department: role.department,
      rollNumber: role.rollNumber,
    };

    logger.info(
      { userId: user.id, role: user.role, portal: user.portal },
      `[AUTHENTICATION] Session issued for ${user.role} targeting ${user.portal} portal`
    );

    return { token, user };
  }
}

export const roleDiscoveryService = new RoleDiscoveryService();
