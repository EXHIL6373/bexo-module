import { z } from 'zod';

export const studentFilterQuerySchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  status: z.string().optional(),
  batch: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export const addStudentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  email: z.string().email(),
  phone: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  course: z.string().optional(),
  batch: z.string().optional(),
  enrolledYear: z.coerce.number().optional(),
  accessStatus: z.enum(['Active', 'Pending', 'Revoked', 'Suspended']).optional(),
  services: z.array(z.string()).optional(),
  collegeId: z.string().optional(), // Tamper attempt test parameter
});

export const updateStudentSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  course: z.string().optional(),
  batch: z.string().optional(),
});

export const revokeStudentSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

export const bulkImportSchema = z.object({
  students: z.array(
    z.object({
      name: z.string().min(1),
      rollNumber: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      department: z.string().optional(),
      course: z.string().optional(),
      batch: z.string().optional(),
    })
  ).min(1, 'At least one student must be supplied'),
});
