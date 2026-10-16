import { z } from 'zod';

export const templateIdParamSchema = z.object({
  id: z.string().min(2, 'Template ID must be at least 2 characters'),
});

export const createTemplateSchema = z.object({
  name: z.string().min(2, 'Template name is required').trim(),
  slug: z.string().min(2).optional(),
  category: z.enum(['portfolio', 'resume', 'biolink', 'showcase']),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  thumbnailColor: z.string().default('#3b82f6'),
  previewUrl: z.string().optional(),
  tier: z.enum(['Free', 'Pro', 'Institutional']).default('Free'),
  status: z.enum(['Published', 'Draft', 'Archived']).default('Published'),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  sourceBundle: z.string().optional(),
  compatibleAppVersion: z.string().default('>=1.0.0'),
  author: z.string().optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  category: z.enum(['portfolio', 'resume', 'biolink', 'showcase']).optional(),
  description: z.string().optional(),
  version: z.string().optional(),
  thumbnailColor: z.string().optional(),
  previewUrl: z.string().optional(),
  tier: z.enum(['Free', 'Pro', 'Institutional']).optional(),
  status: z.enum(['Published', 'Draft', 'Archived']).optional(),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  sourceBundle: z.string().optional(),
  compatibleAppVersion: z.string().optional(),
  author: z.string().optional(),
});
