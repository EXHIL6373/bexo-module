import { Router } from 'express';
import { usersController } from './users.controller';
import { requireAuth } from '../../middlewares/auth';
import { requireRole, requireCorporateStaff } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validateRequest';
import { PERMISSIONS } from '../../config/constants';
import { staffIdParamSchema, createStaffUserSchema, updateStaffUserSchema } from './users.schema';

const router = Router();

router.use(requireAuth, requireCorporateStaff);

router.get('/staff', requireRole(PERMISSIONS.VIEW_STAFF), usersController.getStaffUsers);
router.post(
  '/staff',
  requireRole(PERMISSIONS.MANAGE_STAFF),
  validateRequest({ body: createStaffUserSchema }),
  usersController.addStaffUser
);
router.patch(
  '/staff/:id',
  requireRole(PERMISSIONS.MANAGE_STAFF),
  validateRequest({ params: staffIdParamSchema, body: updateStaffUserSchema }),
  usersController.updateStaffUser
);
router.delete(
  '/staff/:id',
  requireRole(PERMISSIONS.MANAGE_STAFF),
  validateRequest({ params: staffIdParamSchema }),
  usersController.deleteStaffUser
);

export const usersRoutes = router;
