import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../shared/errors/AppError';

export type PermissionAction =
  | 'VIEW_STUDENTS'
  | 'CREATE_STUDENT'
  | 'UPDATE_STUDENT'
  | 'IMPORT_STUDENTS'
  | 'GRANT_STUDENT_ACCESS'
  | 'VIEW_PROVISIONING'
  | 'RETRY_FAILED_RECORDS'
  | 'VIEW_SERVICES'
  | 'MANAGE_STAFF'
  | 'INVITE_STAFF'
  | 'SUBMIT_REQUESTS'
  | 'VIEW_AGREEMENT'
  | 'VIEW_BILLING'
  | 'VIEW_REPORTS'
  | 'EXPORT_REPORTS'
  | 'VIEW_ACTIVITY'
  | 'EDIT_COLLEGE_SETTINGS'
  | 'CORPORATE_ACTION';

const ROLE_PERMISSIONS: Record<string, Set<PermissionAction>> = {
  super_admin: new Set([
    'CORPORATE_ACTION',
    'VIEW_STUDENTS',
    'CREATE_STUDENT',
    'UPDATE_STUDENT',
    'IMPORT_STUDENTS',
    'GRANT_STUDENT_ACCESS',
    'VIEW_PROVISIONING',
    'RETRY_FAILED_RECORDS',
    'VIEW_SERVICES',
    'MANAGE_STAFF',
    'INVITE_STAFF',
    'SUBMIT_REQUESTS',
    'VIEW_AGREEMENT',
    'VIEW_BILLING',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
    'VIEW_ACTIVITY',
    'EDIT_COLLEGE_SETTINGS',
  ]),
  admin: new Set([
    'CORPORATE_ACTION',
    'VIEW_STUDENTS',
    'CREATE_STUDENT',
    'UPDATE_STUDENT',
    'IMPORT_STUDENTS',
    'GRANT_STUDENT_ACCESS',
    'VIEW_PROVISIONING',
    'RETRY_FAILED_RECORDS',
    'VIEW_SERVICES',
    'MANAGE_STAFF',
    'INVITE_STAFF',
    'SUBMIT_REQUESTS',
    'VIEW_AGREEMENT',
    'VIEW_BILLING',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
    'VIEW_ACTIVITY',
    'EDIT_COLLEGE_SETTINGS',
  ]),
  ops: new Set([
    'CORPORATE_ACTION',
    'VIEW_STUDENTS',
    'CREATE_STUDENT',
    'UPDATE_STUDENT',
    'IMPORT_STUDENTS',
    'GRANT_STUDENT_ACCESS',
    'VIEW_PROVISIONING',
    'RETRY_FAILED_RECORDS',
    'VIEW_SERVICES',
    'VIEW_REPORTS',
    'VIEW_ACTIVITY',
  ]),
  finance: new Set([
    'CORPORATE_ACTION',
    'VIEW_BILLING',
    'VIEW_AGREEMENT',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
    'VIEW_ACTIVITY',
  ]),
  support: new Set([
    'CORPORATE_ACTION',
    'VIEW_STUDENTS',
    'VIEW_SERVICES',
    'VIEW_ACTIVITY',
    'VIEW_REPORTS',
  ]),
  college_admin: new Set([
    'VIEW_STUDENTS',
    'CREATE_STUDENT',
    'UPDATE_STUDENT',
    'IMPORT_STUDENTS',
    'GRANT_STUDENT_ACCESS',
    'VIEW_PROVISIONING',
    'RETRY_FAILED_RECORDS',
    'VIEW_SERVICES',
    'MANAGE_STAFF',
    'INVITE_STAFF',
    'SUBMIT_REQUESTS',
    'VIEW_AGREEMENT',
    'VIEW_BILLING',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
    'VIEW_ACTIVITY',
    'EDIT_COLLEGE_SETTINGS',
  ]),
  college_coordinator: new Set([
    'VIEW_STUDENTS',
    'CREATE_STUDENT',
    'UPDATE_STUDENT',
    'IMPORT_STUDENTS',
    'GRANT_STUDENT_ACCESS',
    'VIEW_PROVISIONING',
    'RETRY_FAILED_RECORDS',
    'VIEW_SERVICES',
    'SUBMIT_REQUESTS',
    'VIEW_AGREEMENT',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
    'VIEW_ACTIVITY',
  ]),
  college_staff: new Set([
    'VIEW_STUDENTS',
    'VIEW_PROVISIONING',
    'VIEW_SERVICES',
    'VIEW_ACTIVITY',
  ]),
};

export function requirePermission(action: PermissionAction) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('User authentication not established.'));
    }

    const userRole = req.user.role;
    const permissions = ROLE_PERMISSIONS[userRole];

    if (!permissions || !permissions.has(action)) {
      return next(
        new ForbiddenError(
          `Action Forbidden: Your assigned role (${userRole}) is not authorized to execute '${action}'.`
        )
      );
    }

    next();
  };
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('User authentication not established.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Action Forbidden: Operation requires one of [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
        )
      );
    }

    next();
  };
}

export function requireCorporateStaff(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new ForbiddenError('User authentication not established.'));
  }
  const corporateRoles = ['super_admin', 'admin', 'ops', 'finance', 'support'];
  if (req.user.collegeId || !corporateRoles.includes(req.user.role)) {
    return next(
      new ForbiddenError(
        'Institutional Access Restricted: This portal is for central BEXO corporate administrators. College staff must access via the dedicated College Portal.'
      )
    );
  }
  next();
}
