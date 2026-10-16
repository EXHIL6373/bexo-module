import { z } from 'zod';

export const submitRequestSchema = z.object({
  type: z.enum([
    'New College',
    'Quota Increase',
    'Service Activation',
    'Access Request',
    'Agreement Request',
    'Other Operational Request',
  ]),
  requester: z.string().min(1),
  requesterEmail: z.string().email(),
  requesterRole: z.string().min(1),
  details: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    currentValue: z.union([z.string(), z.number()]).optional(),
    requestedValue: z.union([z.string(), z.number()]).optional(),
    urgency: z.string().optional(),
    supportingDoc: z.string().optional(),
    serviceName: z.string().optional(),
  }),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
});
