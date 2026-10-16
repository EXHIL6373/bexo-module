import { Router } from 'express';
import { collegeController } from './college.controller';
import { validateRequest } from '../../shared/validation/validateRequest';
import { updateCollegeSettingsSchema } from './college.schemas';
import { requireAuth } from '../../middlewares/auth';
import { requireCollegeTenant } from '../../middlewares/tenant';
import { requirePermission } from '../../middlewares/permissions';

const router = Router();

router.use(requireAuth, requireCollegeTenant);

router.get('/profile', collegeController.getProfile);

router.patch(
  '/settings',
  requirePermission('EDIT_COLLEGE_SETTINGS'),
  validateRequest({ body: updateCollegeSettingsSchema }),
  collegeController.updateSettings
);

router.get('/agreement', requirePermission('VIEW_AGREEMENT'), collegeController.getAgreement);
router.get('/billing', requirePermission('VIEW_BILLING'), collegeController.getBilling);

export const collegeRoutes = router;
