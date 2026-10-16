import { z } from 'zod';

export const studentIdParamSchema = z.object({
  id: z.string().min(2, 'Student ID must be at least 2 characters'),
});

export const createStudentSchema = z.object({
  name: z.string().min(2, 'Student name is required').trim(),
  rollNumber: z.string().min(2, 'Roll number is required').trim().toUpperCase(),
  collegeId: z.string().min(2, 'College ID is required'),
  collegeName: z.string().min(2, 'College name is required'),
  department: z.string().min(2, 'Department is required').trim(),
  course: z.string().optional(),
  batch: z.string().optional(),
  email: z.string().email('Valid email address is required').trim().toLowerCase(),
  phone: z.string().optional(),
  accessStatus: z.enum(['Active', 'Pending', 'Revoked', 'Suspended']).default('Active'),
  services: z.array(z.string()).default(['BEXO Portfolio', 'BEXO Templates']),
  enrolledYear: z.coerce.number().optional(),
  portfolioSubdomain: z.string().optional(),
});

export const revokeStudentSchema = z.object({
  reason: z.string().min(3, 'Revocation reason is required').trim(),
});
