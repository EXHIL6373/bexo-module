import { Router } from 'express';
import { activityController } from './activity.controller';
import { requireAuth } from '../../middlewares/auth';
import { requireCollegeTenant } from '../../middlewares/tenant';
import { requirePermission } from '../../middlewares/permissions';

const router = Router();

router.use(requireAuth, requireCollegeTenant);

router.get('/activity', requirePermission('VIEW_ACTIVITY'), activityController.getActivityLogs);
router.get('/reports/export', requirePermission('EXPORT_REPORTS'), activityController.exportReport);

export const activityRoutes = router;
