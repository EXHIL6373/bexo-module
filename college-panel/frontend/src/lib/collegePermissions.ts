import { Role } from '../types';

export type CollegePermissionAction =
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
  | 'EDIT_COLLEGE_SETTINGS';

const COLLEGE_ROLE_PERMISSIONS: Record<Role, Set<CollegePermissionAction>> = {
  super_admin: new Set([
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
    'VIEW_STUDENTS',
    'CREATE_STUDENT',
    'UPDATE_STUDENT',
    'IMPORT_STUDENTS',
    'GRANT_STUDENT_ACCESS',
    'VIEW_PROVISIONING',
    'RETRY_FAILED_RECORDS',
    'VIEW_SERVICES',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
    'VIEW_ACTIVITY',
  ]),
  finance: new Set([
    'VIEW_BILLING',
    'VIEW_AGREEMENT',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
  ]),
  support: new Set([
    'VIEW_STUDENTS',
    'VIEW_PROVISIONING',
    'VIEW_SERVICES',
    'VIEW_ACTIVITY',
  ]),

  // Institutional Roles
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

export function canPerformCollegeAction(role: Role, action: CollegePermissionAction): boolean {
  const permissions = COLLEGE_ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.has(action);
}

export function getRoleDisplayName(role: Role): string {
  switch (role) {
    case 'college_admin':
      return 'College Administrator';
    case 'college_coordinator':
      return 'College Coordinator';
    case 'college_staff':
      return 'College Staff';
    case 'super_admin':
      return 'BEXO Super Administrator';
    case 'admin':
      return 'BEXO Corporate Admin';
    case 'ops':
      return 'Operations Team';
    case 'finance':
      return 'Finance Controller';
    case 'support':
      return 'Support Specialist';
    default:
      return role;
  }
}

export function getRoleBadgeStyle(role: Role): { bg: string; color: string; border: string } {
  switch (role) {
    case 'college_admin':
      return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
    case 'college_coordinator':
      return { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' };
    case 'college_staff':
      return { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' };
    case 'super_admin':
      return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
    default:
      return { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
  }
}
