import { Router } from 'express';
import { provisioningController } from './provisioning.controller';
import { validateRequest } from '../../shared/validation/validateRequest';
import { triggerProvisioningSchema } from './provisioning.schemas';
import { requireAuth } from '../../middlewares/auth';
import { requireCollegeTenant } from '../../middlewares/tenant';
import { requirePermission } from '../../middlewares/permissions';

const router = Router();

router.use(requireAuth, requireCollegeTenant);

router.get('/provisioning/jobs', requirePermission('VIEW_PROVISIONING'), provisioningController.getJobs);
router.get('/provisioning/jobs/:id', requirePermission('VIEW_PROVISIONING'), provisioningController.getJobById);

router.post(
  '/provisioning/jobs',
  requirePermission('GRANT_STUDENT_ACCESS'),
  validateRequest({ body: triggerProvisioningSchema }),
  provisioningController.triggerProvisioning
);

router.post(
  '/provisioning/jobs/:id/retry',
  requirePermission('RETRY_FAILED_RECORDS'),
  provisioningController.retryJob
);

router.get('/entitlements', requirePermission('VIEW_SERVICES'), provisioningController.getEntitlements);

export const provisioningRoutes = router;
