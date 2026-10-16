import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { requireAuth } from '../../middlewares/auth';
import { requireRole, requireCorporateStaff } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validateRequest';
import { PERMISSIONS } from '../../config/constants';
import { notificationIdParamSchema } from './notifications.schema';

const router = Router();

router.use(requireAuth, requireCorporateStaff);

router.get('/', requireRole(PERMISSIONS.MANAGE_NOTIFICATIONS), notificationsController.getNotifications);
router.post(
  '/:id/read',
  requireRole(PERMISSIONS.MANAGE_NOTIFICATIONS),
  validateRequest({ params: notificationIdParamSchema }),
  notificationsController.markAsRead
);
router.post('/mark-all-read', requireRole(PERMISSIONS.MANAGE_NOTIFICATIONS), notificationsController.markAllAsRead);
router.delete(
  '/:id',
  requireRole(PERMISSIONS.MANAGE_NOTIFICATIONS),
  validateRequest({ params: notificationIdParamSchema }),
  notificationsController.deleteNotification
);

export const notificationsRoutes = router;
