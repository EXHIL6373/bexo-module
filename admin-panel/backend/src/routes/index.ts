import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes';
import { collegeRoutes } from '../modules/colleges/colleges.routes';
import { studentsRoutes } from '../modules/students/students.routes';
import { usersRoutes } from '../modules/users/users.routes';
import { invitationsRoutes } from '../modules/invitations/invitations.routes';
import { approvalsRoutes } from '../modules/approvals/approvals.routes';
import { provisioningRoutes } from '../modules/provisioning/provisioning.routes';
import { servicesRoutes } from '../modules/services/services.routes';
import { paymentsRoutes } from '../modules/payments/payments.routes';
import { notificationsRoutes } from '../modules/notifications/notifications.routes';
import { auditRoutes } from '../modules/audit/audit.routes';
import { templatesRoutes } from '../modules/templates/templates.routes';
import { systemRoutes } from '../modules/system/system.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/colleges', collegeRoutes);
apiRouter.use('/students', studentsRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/invitations', invitationsRoutes);
apiRouter.use('/approvals', approvalsRoutes);
apiRouter.use('/provisioning', provisioningRoutes);
apiRouter.use('/services', servicesRoutes);
apiRouter.use('/payments', paymentsRoutes);
apiRouter.use('/notifications', notificationsRoutes);
apiRouter.use('/audit', auditRoutes);
apiRouter.use('/templates', templatesRoutes);
apiRouter.use('/', systemRoutes);

export { apiRouter };
