import { z } from 'zod';
import { ROLES } from '../../config/constants';

export const invitationIdParamSchema = z.object({
  id: z.string().min(2, 'Invitation ID must be at least 2 characters'),
});

export const createInvitationSchema = z.object({
  email: z.string().email('Valid email is required').trim().toLowerCase(),
  fullName: z.string().min(2, 'Full name is required').trim(),
  phone: z.string().optional(),
  designation: z.string().min(2, 'Designation is required').trim(),
  collegeId: z.string().optional().nullable(),
  collegeName: z.string().optional().nullable(),
  role: z.enum([
    ROLES.SUPER_ADMIN,
    ROLES.PLATFORM_ADMIN,
    ROLES.ADMIN,
    ROLES.OPS,
    ROLES.FINANCE,
    ROLES.SUPPORT,
    ROLES.COLLEGE_ADMIN,
    ROLES.COLLEGE_STAFF,
    ROLES.COLLEGE_COORDINATOR,
  ]),
});

export const revokeInvitationSchema = z.object({
  reason: z.string().min(3, 'Revocation reason is required').trim(),
});
