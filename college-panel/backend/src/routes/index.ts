import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes';
import { collegeRoutes } from '../modules/college/college.routes';
import { studentsRoutes } from '../modules/students/students.routes';
import { staffRoutes } from '../modules/staff/staff.routes';
import { provisioningRoutes } from '../modules/provisioning/provisioning.routes';
import { requestsRoutes } from '../modules/requests/requests.routes';
import { notificationsRoutes } from '../modules/notifications/notifications.routes';
import { activityRoutes } from '../modules/activity/activity.routes';
import { corporateRoutes } from '../modules/corporate/corporate.routes';
import { healthRoutes } from '../modules/health/health.routes';
import { mobileRoutes } from '../modules/mobile/mobile.routes';

const apiRouter = Router();
const collegeRouter = Router();

// Aggregate college-scoped endpoints
collegeRouter.use('/', collegeRoutes);
collegeRouter.use('/', studentsRoutes);
collegeRouter.use('/', staffRoutes);
collegeRouter.use('/', provisioningRoutes);
collegeRouter.use('/', requestsRoutes);
collegeRouter.use('/', notificationsRoutes);
collegeRouter.use('/', activityRoutes);

// Top-level API routing
apiRouter.use('/auth', authRoutes);
apiRouter.use('/', healthRoutes);
apiRouter.use('/college', collegeRouter);
apiRouter.use('/corporate', corporateRoutes);
apiRouter.use('/', corporateRoutes);
apiRouter.use('/internal/mobile', mobileRoutes);

export { apiRouter, collegeRouter, corporateRoutes, authRoutes };
