import { z } from 'zod';

export const collegeIdParamSchema = z.object({
  id: z.string().trim().min(3, 'College ID must be at least 3 characters').max(64, 'College ID is too long'),
});

export const requestIdParamSchema = z.object({
  id: z.string().trim().min(3, 'Request ID must be at least 3 characters').max(64, 'Request ID is too long'),
});

export const studentIdParamSchema = z.object({
  id: z.string().trim().min(2, 'Student ID must be at least 2 characters'),
});

export const staffIdParamSchema = z.object({
  id: z.string().trim().min(2, 'Staff ID must be at least 2 characters'),
});

export const templateIdParamSchema = z.object({
  id: z.string().trim().min(2, 'Template ID must be at least 2 characters'),
});

export const suspendCollegeSchema = z.object({
  reason: z.string().trim().min(3, 'Suspension reason must be at least 3 characters').max(500).optional(),
});

export const updateCorporateQuotaSchema = z.object({
  allocated: z
    .number({ required_error: 'Allocated quota is required', invalid_type_error: 'Allocated quota must be a valid number' })
    .int('Allocated quota must be an integer')
    .min(0, 'Allocated quota cannot be negative')
    .max(1_000_000, 'Allocated quota cannot exceed institutional limit of 1,000,000')
    .refine((v) => Number.isFinite(v), 'Quota must be a finite number'),
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters').max(255).optional(),
});

export const reviewRequestSchema = z.object({
  status: z.enum(['Approved', 'Rejected'], {
    errorMap: () => ({ message: "Status must be either 'Approved' or 'Rejected'" }),
  }),
  decisionReason: z
    .string({ required_error: 'Decision reason is required' })
    .trim()
    .min(3, 'Decision reason must be at least 3 characters')
    .max(500, 'Decision reason cannot exceed 500 characters'),
});

export const approveRejectSchema = z.object({
  decisionReason: z.string().trim().min(3, 'Decision reason must be at least 3 characters').max(500),
});

export const createCollegeSchema = z.object({
  name: z.string().trim().min(3, 'College name is required'),
  code: z.string().trim().min(2).optional(),
  slug: z.string().trim().min(2).optional(),
  type: z.string().optional(),
  affiliation: z.string().optional(),
  establishedYear: z.number().int().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional(),
  primaryContact: z.any().optional(),
  adminContact: z.any().optional(),
  quotaAllocated: z.number().optional(),
  departmentLimits: z.record(z.number()).optional(),
  emailDomains: z.array(z.string()).optional(),
});

export const createStudentSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  rollNumber: z.string().trim().min(2, 'Roll number is required'),
  collegeId: z.string().trim().min(2, 'College ID is required'),
  email: z.string().email('Valid email is required'),
  department: z.string().trim().min(2, 'Department is required'),
  course: z.string().optional(),
  batch: z.string().optional(),
  enrolledYear: z.number().optional(),
});

export const revokeStudentSchema = z.object({
  reason: z.string().trim().min(3, 'Revocation reason is required'),
});

export const provisioningBatchSchema = z.object({
  collegeId: z.string().trim().min(2, 'College ID is required'),
  source: z.string().optional(),
  startRoll: z.string().optional(),
  endRoll: z.string().optional(),
  batchSize: z.number().optional(),
});

export const createStaffSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['super_admin', 'admin', 'ops', 'finance', 'support', 'college_admin', 'college_coordinator', 'college_staff']),
  phone: z.string().optional(),
  collegeId: z.string().nullable().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
});

export const createInvitationSchema = z.object({
  email: z.string().email('Valid email is required'),
  fullName: z.string().trim().min(2, 'Full name is required'),
  role: z.enum(['super_admin', 'admin', 'ops', 'finance', 'support', 'college_admin', 'college_coordinator', 'college_staff']),
  collegeId: z.string().nullable().optional(),
  designation: z.string().optional(),
  phone: z.string().optional(),
});

export const revokeInvitationSchema = z.object({
  reason: z.string().trim().min(3, 'Revocation reason is required'),
});

export const createTemplateSchema = z.object({
  name: z.string().trim().min(2, 'Template name is required'),
  slug: z.string().optional(),
  category: z.enum(['portfolio', 'resume', 'biolink', 'showcase']),
  description: z.string().optional(),
  version: z.string().optional(),
  tier: z.enum(['Free', 'Pro', 'Institutional']).optional(),
  status: z.enum(['Published', 'Draft', 'Deprecated']).optional(),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  compatibleAppVersion: z.string().optional(),
  author: z.string().optional(),
  thumbnailColor: z.string().optional(),
  previewUrl: z.string().optional(),
});

export const linkMobileStudentSchema = z.object({
  mobileUserId: z.string().trim().min(2, 'mobileUserId is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
});
