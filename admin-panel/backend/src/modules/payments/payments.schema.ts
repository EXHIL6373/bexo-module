import { z } from 'zod';

export const createPaymentSchema = z.object({
  invoiceNumber: z.string().min(3, 'Invoice number is required').trim(),
  collegeId: z.string().min(2, 'College ID is required'),
  collegeName: z.string().min(2, 'College name is required'),
  amount: z.coerce.number().positive('Payment amount must be greater than zero'),
  status: z.enum(['Paid', 'Pending', 'Failed', 'Refunded']).default('Paid'),
  date: z.string().default(() => new Date().toISOString().split('T')[0]),
  dueDate: z.string().default(() => new Date().toISOString().split('T')[0]),
  paymentMethod: z.string().default('Corporate Wire / RTGS'),
  description: z.string().optional(),
  billingCycle: z.string().optional(),
  plan: z.string().optional(),
});
