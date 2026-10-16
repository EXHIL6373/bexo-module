import { z } from 'zod';

export const jobIdParamSchema = z.object({
  id: z.string().min(2, 'Job ID must be at least 2 characters'),
});

export const provisioningBatchSchema = z.object({
  collegeId: z.string().min(2, 'College ID is required'),
  source: z.enum(['Roll Number Range', 'CSV Upload', 'Manual Batch', 'XLSX Batch', 'API Sync']).default('Roll Number Range'),
  startRoll: z.string().optional(),
  endRoll: z.string().optional(),
  batchSize: z.coerce.number().int().positive().max(5000).optional(),
});
