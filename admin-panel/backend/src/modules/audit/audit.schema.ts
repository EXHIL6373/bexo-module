import { z } from 'zod';

export const logAuditActionSchema = z.object({
  action: z.string().min(2, 'Action is required').trim(),
  entity: z.string().min(2, 'Entity is required').trim(),
  entityId: z.string().min(1, 'Entity ID is required').trim(),
  entityName: z.string().min(1, 'Entity name is required').trim(),
  reason: z.string().optional(),
  result: z.enum(['Success', 'Denied', 'Failed']).default('Success'),
  beforeState: z.record(z.any()).optional(),
  afterState: z.record(z.any()).optional(),
});
