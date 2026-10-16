import { z } from 'zod';

export const triggerProvisioningSchema = z.object({
  studentIds: z.array(z.string()).min(1, 'At least one studentId is required'),
  serviceName: z.string().min(1, 'Service name is required'),
});
