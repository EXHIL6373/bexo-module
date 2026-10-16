import { z } from 'zod';

export const approvalIdParamSchema = z.object({
  id: z.string().min(2, 'Approval ID must be at least 2 characters'),
});

export const createApprovalSchema = z.object({
  type: z.enum([
    'New College',
    'Quota Increase',
    'Service Activation',
    'Access Request',
    'Agreement Request',
    'Other Operational Request',
  ]),
  collegeId: z.string().min(2, 'College ID is required'),
  collegeName: z.string().min(2, 'College name is required'),
  requester: z.string().min(2, 'Requester name is required'),
  requesterEmail: z.string().email('Requester email is required'),
  requesterRole: z.string().min(2, 'Requester role is required'),
  details: z.object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().min(3, 'Description is required'),
    currentValue: z.union([z.string(), z.number()]).optional(),
    requestedValue: z.union([z.string(), z.number()]).optional(),
    urgency: z.string().optional(),
    supportingDoc: z.string().optional(),
    serviceName: z.string().optional(),
  }),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
});

export const decisionReasonSchema = z.object({
  decisionReason: z.string().min(3, 'Decision reason is required').trim(),
});
