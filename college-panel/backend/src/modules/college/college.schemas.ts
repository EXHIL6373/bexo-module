import { z } from 'zod';

export const updateCollegeSettingsSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  primaryContact: z
    .object({
      name: z.string().optional(),
      designation: z.string().optional(),
      email: z.string().email().optional(),
      mobile: z.string().optional(),
      alternateContact: z.string().optional(),
    })
    .optional(),
});
