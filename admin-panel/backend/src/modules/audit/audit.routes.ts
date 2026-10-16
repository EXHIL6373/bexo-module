import { Router } from 'express';
import { auditController } from './audit.controller';
import { requireAuth } from '../../middlewares/auth';
import { requireRole, requireCorporateStaff } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validateRequest';
import { PERMISSIONS } from '../../config/constants';
import { logAuditActionSchema } from './audit.schema';

const router = Router();

router.use(requireAuth, requireCorporateStaff);

router.get('/logs', requireRole(PERMISSIONS.VIEW_AUDIT), auditController.getAuditLogs);
router.post(
  '/logs',
  requireRole(PERMISSIONS.VIEW_AUDIT),
  validateRequest({ body: logAuditActionSchema }),
  auditController.recordLog
);

export const auditRoutes = router;
