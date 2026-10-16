import { Router } from 'express';
import { requestsController } from './requests.controller';
import { validateRequest } from '../../shared/validation/validateRequest';
import { submitRequestSchema } from './requests.schemas';
import { requireAuth } from '../../middlewares/auth';
import { requireCollegeTenant } from '../../middlewares/tenant';
import { requirePermission } from '../../middlewares/permissions';

const router = Router();

router.use(requireAuth, requireCollegeTenant);

router.get('/requests', requestsController.getRequests);

router.post(
  '/requests',
  requirePermission('SUBMIT_REQUESTS'),
  validateRequest({ body: submitRequestSchema }),
  requestsController.submitRequest
);

export const requestsRoutes = router;
