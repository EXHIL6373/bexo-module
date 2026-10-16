import { Router } from 'express';
import { servicesController } from './services.controller';
import { requireAuth } from '../../middlewares/auth';
import { requireRole, requireCorporateStaff } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validateRequest';
import { PERMISSIONS } from '../../config/constants';
import { serviceIdParamSchema } from './services.schema';

const router = Router();

router.use(requireAuth, requireCorporateStaff);

router.get('/', requireRole(PERMISSIONS.VIEW_SERVICES), servicesController.getServices);
router.post(
  '/:id/toggle-global',
  requireRole(PERMISSIONS.MANAGE_SERVICES),
  validateRequest({ params: serviceIdParamSchema }),
  servicesController.toggleGlobalService
);

export const servicesRoutes = router;
