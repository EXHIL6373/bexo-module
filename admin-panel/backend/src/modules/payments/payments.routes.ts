import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { requireAuth } from '../../middlewares/auth';
import { requireRole, requireCorporateStaff } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validateRequest';
import { PERMISSIONS } from '../../config/constants';
import { createPaymentSchema } from './payments.schema';

const router = Router();

router.use(requireAuth, requireCorporateStaff);

router.get('/', requireRole(PERMISSIONS.VIEW_PAYMENTS), paymentsController.getPayments);
router.post(
  '/',
  requireRole(PERMISSIONS.MANAGE_PAYMENTS),
  validateRequest({ body: createPaymentSchema }),
  paymentsController.recordPayment
);

export const paymentsRoutes = router;
