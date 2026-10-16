import { z } from 'zod';

export const serviceIdParamSchema = z.object({
  id: z.string().min(2, 'Service ID must be at least 2 characters'),
});
