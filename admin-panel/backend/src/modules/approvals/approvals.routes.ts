import { Router } from 'express';
import { approvalsController } from './approvals.controller';
import { requireAuth } from '../../middlewares/auth';
import { requireRole, requireCorporateStaff } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validateRequest';
import { PERMISSIONS } from '../../config/constants';
import {
  approvalIdParamSchema,
  createApprovalSchema,
  decisionReasonSchema,
} from './approvals.schema';

const router = Router();

router.use(requireAuth, requireCorporateStaff);

router.get('/', requireRole(PERMISSIONS.VIEW_APPROVALS), approvalsController.getApprovals);
router.post(
  '/',
  requireRole(PERMISSIONS.VIEW_APPROVALS),
  validateRequest({ body: createApprovalSchema }),
  approvalsController.submitRequest
);
router.post(
  '/:id/approve',
  requireRole(PERMISSIONS.DECIDE_APPROVALS),
  validateRequest({ params: approvalIdParamSchema, body: decisionReasonSchema }),
  approvalsController.approveRequest
);
router.post(
  '/:id/reject',
  requireRole(PERMISSIONS.DECIDE_APPROVALS),
  validateRequest({ params: approvalIdParamSchema, body: decisionReasonSchema }),
  approvalsController.rejectRequest
);

export const approvalsRoutes = router;
