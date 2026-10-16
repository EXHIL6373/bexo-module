import { z } from 'zod';

export const notificationIdParamSchema = z.object({
  id: z.string().min(2, 'Notification ID must be at least 2 characters'),
});
