import { z } from 'zod';
import { ROLES } from '../../config/constants';

export const staffIdParamSchema = z.object({
  id: z.string().min(2, 'Staff ID must be at least 2 characters'),
});

export const createStaffUserSchema = z.object({
  name: z.string().min(2, 'Full name is required').trim(),
  email: z.string().email('Valid email address is required').trim().toLowerCase(),
  phone: z.string().optional(),
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
  collegeId: z.string().optional().nullable(),
  collegeName: z.string().optional().nullable(),
  department: z.string().optional(),
  designation: z.string().optional(),
  isActive: z.boolean().default(true),
  accountStatus: z.enum(['INVITED', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED']).default('ACTIVE'),
});

export const updateStaffUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z
    .enum([
      ROLES.SUPER_ADMIN,
      ROLES.PLATFORM_ADMIN,
      ROLES.ADMIN,
      ROLES.OPS,
      ROLES.FINANCE,
      ROLES.SUPPORT,
      ROLES.COLLEGE_ADMIN,
      ROLES.COLLEGE_STAFF,
      ROLES.COLLEGE_COORDINATOR,
    ])
    .optional(),
  collegeId: z.string().optional().nullable(),
  collegeName: z.string().optional().nullable(),
  department: z.string().optional(),
  designation: z.string().optional(),
  isActive: z.boolean().optional(),
  accountStatus: z.enum(['INVITED', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED']).optional(),
});
