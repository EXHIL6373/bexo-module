import { Router } from 'express';
import { provisioningController } from './provisioning.controller';
import { requireAuth } from '../../middlewares/auth';
import { requireRole, requireCorporateStaff } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validateRequest';
import { PERMISSIONS } from '../../config/constants';
import { jobIdParamSchema, provisioningBatchSchema } from './provisioning.schema';

const router = Router();

router.use(requireAuth, requireCorporateStaff);

router.get('/', requireRole(PERMISSIONS.VIEW_PROVISIONING), provisioningController.getJobs);
router.get('/jobs', requireRole(PERMISSIONS.VIEW_PROVISIONING), provisioningController.getJobs);
router.get(
  '/jobs/:id',
  requireRole(PERMISSIONS.VIEW_PROVISIONING),
  validateRequest({ params: jobIdParamSchema }),
  provisioningController.getJobById
);
router.get(
  '/:id',
  requireRole(PERMISSIONS.VIEW_PROVISIONING),
  validateRequest({ params: jobIdParamSchema }),
  provisioningController.getJobById
);
router.post(
  '/batch',
  requireRole(PERMISSIONS.TRIGGER_PROVISIONING),
  validateRequest({ body: provisioningBatchSchema }),
  provisioningController.triggerBatch
);

export const provisioningRoutes = router;
