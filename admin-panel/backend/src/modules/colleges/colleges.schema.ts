import { z } from 'zod';

export const collegeIdParamSchema = z.object({
  id: z.string().min(2, 'College ID must be at least 2 characters'),
});

export const collegeServiceParamSchema = z.object({
  id: z.string().min(2, 'College ID must be at least 2 characters'),
  serviceId: z.string().min(2, 'Service ID must be at least 2 characters'),
});

export const createCollegeSchema = z.object({
  name: z.string().min(3, 'College name must be at least 3 characters').trim(),
  code: z
    .string()
    .min(2, 'College code must be at least 2 characters')
    .max(32)
    .trim()
    .toUpperCase(),
  slug: z.string().min(2).max(64).trim().toLowerCase().optional(),
  type: z.enum([
    'Engineering',
    'Arts & Science',
    'Autonomous University',
    'Polytechnic',
    'Medical',
    'Management',
    'Government Aided',
  ]),
  affiliation: z.string().optional(),
  establishedYear: z.coerce.number().optional(),
  address: z.string().optional(),
  city: z.string().min(2, 'City is required').trim(),
  district: z.string().optional(),
  state: z.string().min(2, 'State is required').trim(),
  pincode: z.string().optional(),
  country: z.string().default('India'),
  primaryContact: z.object({
    name: z.string().min(2, 'Primary contact name is required'),
    designation: z.string().min(2, 'Designation is required'),
    email: z.string().email('Valid contact email is required'),
    mobile: z.string().min(6, 'Valid contact mobile is required'),
    alternateContact: z.string().optional(),
  }),
  adminContact: z
    .object({
      name: z.string().min(2),
      email: z.string().email(),
      mobile: z.string().min(6),
    })
    .optional(),
  quota: z
    .object({
      allocated: z.coerce.number().int().positive().max(1000000).default(1000),
      used: z.coerce.number().default(0),
      warningThreshold: z.coerce.number().default(80),
      criticalThreshold: z.coerce.number().default(95),
      departmentLimits: z.record(z.coerce.number()).optional(),
    })
    .optional(),
  services: z.array(z.any()).optional(),
  agreement: z.record(z.any()).optional(),
});

export const updateCollegeSchema = z.object({
  name: z.string().min(3).optional(),
  code: z.string().min(2).max(32).toUpperCase().optional(),
  slug: z.string().min(2).max(64).toLowerCase().optional(),
  type: z
    .enum([
      'Engineering',
      'Arts & Science',
      'Autonomous University',
      'Polytechnic',
      'Medical',
      'Management',
      'Government Aided',
    ])
    .optional(),
  affiliation: z.string().optional(),
  establishedYear: z.coerce.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional(),
  primaryContact: z
    .object({
      name: z.string().optional(),
      designation: z.string().optional(),
      email: z.string().email().optional(),
      mobile: z.string().optional(),
      alternateContact: z.string().optional(),
    })
    .optional(),
  adminContact: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      mobile: z.string().optional(),
    })
    .optional(),
  quota: z
    .object({
      allocated: z.coerce.number().int().positive().max(1000000).optional(),
      used: z.coerce.number().optional(),
      warningThreshold: z.coerce.number().optional(),
      criticalThreshold: z.coerce.number().optional(),
      departmentLimits: z.record(z.coerce.number()).optional(),
    })
    .optional(),
  services: z.array(z.any()).optional(),
  agreement: z.record(z.any()).optional(),
});

export const suspendCollegeSchema = z.object({
  reason: z.string().min(3, 'Suspension reason must be provided').trim(),
});

export const reactivateCollegeSchema = z.object({
  reason: z.string().trim().optional(),
});

export const updateQuotaSchema = z
  .object({
    allocated: z
      .coerce
      .number({ invalid_type_error: 'Allocated quota must be a valid number' })
      .int('Allocated quota must be an integer')
      .positive('Allocated quota must be greater than zero')
      .max(1000000, 'Allocated quota cannot exceed institutional limit of 1,000,000')
      .optional(),
    quotaAllocated: z
      .coerce
      .number({ invalid_type_error: 'Allocated quota must be a valid number' })
      .int('Allocated quota must be an integer')
      .positive('Allocated quota must be greater than zero')
      .max(1000000, 'Allocated quota cannot exceed institutional limit of 1,000,000')
      .optional(),
    reason: z.string().min(3, 'Audit reason is required for quota adjustments').trim(),
  })
  .refine((data) => data.allocated !== undefined || data.quotaAllocated !== undefined, {
    message: 'Allocated quota must be provided as either "allocated" or "quotaAllocated"',
  });

export const toggleServiceSchema = z.object({
  enabled: z.boolean(),
});
