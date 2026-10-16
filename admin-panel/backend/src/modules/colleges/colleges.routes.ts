import { Router } from 'express';
import { collegesController } from './colleges.controller';
import { requireAuth } from '../../middlewares/auth';
import { requireRole, requireCorporateStaff } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validateRequest';
import { PERMISSIONS } from '../../config/constants';
import {
  collegeIdParamSchema,
  collegeServiceParamSchema,
  createCollegeSchema,
  updateCollegeSchema,
  suspendCollegeSchema,
  reactivateCollegeSchema,
  updateQuotaSchema,
  toggleServiceSchema,
} from './colleges.schema';

const router = Router();

// Perimeter: All college endpoints require authenticated corporate staff
router.use(requireAuth, requireCorporateStaff);

router.get('/', requireRole(PERMISSIONS.VIEW_COLLEGES), collegesController.getColleges);
router.get('/quota-history', requireRole(PERMISSIONS.VIEW_COLLEGES), collegesController.getQuotaHistory);

router.get(
  '/:id',
  requireRole(PERMISSIONS.VIEW_COLLEGES),
  validateRequest({ params: collegeIdParamSchema }),
  collegesController.getCollegeById
);

router.post(
  '/',
  requireRole(PERMISSIONS.MANAGE_COLLEGES),
  validateRequest({ body: createCollegeSchema }),
  collegesController.createCollege
);

router.patch(
  '/:id',
  requireRole(PERMISSIONS.MANAGE_COLLEGES),
  validateRequest({ params: collegeIdParamSchema, body: updateCollegeSchema }),
  collegesController.updateCollege
);

router.post(
  '/:id/suspend',
  requireRole(PERMISSIONS.SUSPEND_COLLEGES),
  validateRequest({ params: collegeIdParamSchema, body: suspendCollegeSchema }),
  collegesController.suspendCollege
);

router.post(
  '/:id/reactivate',
  requireRole(PERMISSIONS.SUSPEND_COLLEGES),
  validateRequest({ params: collegeIdParamSchema, body: reactivateCollegeSchema }),
  collegesController.reactivateCollege
);

router.post(
  '/:id/quota',
  requireRole(PERMISSIONS.MANAGE_QUOTA),
  validateRequest({ params: collegeIdParamSchema, body: updateQuotaSchema }),
  collegesController.updateQuota
);

router.get(
  '/:id/quota-history',
  requireRole(PERMISSIONS.VIEW_COLLEGES),
  validateRequest({ params: collegeIdParamSchema }),
  collegesController.getQuotaHistory
);

router.post(
  '/:id/services/:serviceId/toggle',
  requireRole(PERMISSIONS.MANAGE_COLLEGES),
  validateRequest({ params: collegeServiceParamSchema, body: toggleServiceSchema }),
  collegesController.toggleService
);

export const collegeRoutes = router;
