import { z } from 'zod';

export const inviteStaffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  role: z.string(), // Checked in service for institutional-only roles
  department: z.string().optional(),
  designation: z.string().optional(),
  mobile: z.string().optional(),
});

export const updateStaffRoleSchema = z.object({
  role: z.string(),
});

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});
