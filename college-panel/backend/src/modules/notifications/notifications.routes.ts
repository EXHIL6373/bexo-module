import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { requireAuth } from '../../middlewares/auth';
import { requireCollegeTenant } from '../../middlewares/tenant';

const router = Router();

router.use(requireAuth, requireCollegeTenant);

router.get('/notifications', notificationsController.getNotifications);
router.patch('/notifications/:id/read', notificationsController.markAsRead);
router.post('/notifications/read-all', notificationsController.markAllAsRead);

router.get('/announcements', notificationsController.getAnnouncements);

router.get('/tasks', notificationsController.getTasks);
router.patch('/tasks/:id/toggle', notificationsController.toggleTask);

export const notificationsRoutes = router;
