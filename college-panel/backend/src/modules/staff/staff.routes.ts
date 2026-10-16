import { Router } from 'express';
import { staffController } from './staff.controller';
import { validateRequest } from '../../shared/validation/validateRequest';
import {
  inviteStaffSchema,
  updateStaffRoleSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './staff.schemas';
import { requireAuth } from '../../middlewares/auth';
import { requireCollegeTenant } from '../../middlewares/tenant';
import { requirePermission } from '../../middlewares/permissions';

const router = Router();

router.use(requireAuth, requireCollegeTenant);

router.get('/staff', requirePermission('MANAGE_STAFF'), staffController.getStaff);

router.post(
  '/staff/invite',
  requirePermission('INVITE_STAFF'),
  validateRequest({ body: inviteStaffSchema }),
  staffController.inviteStaff
);

router.post('/staff/invitations/:id/resend', requirePermission('INVITE_STAFF'), staffController.resendInvite);
router.post('/staff/invitations/:id/revoke', requirePermission('INVITE_STAFF'), staffController.revokeInvite);

router.patch(
  '/staff/:id/role',
  requirePermission('MANAGE_STAFF'),
  validateRequest({ body: updateStaffRoleSchema }),
  staffController.updateStaffRole
);

router.post('/staff/:id/suspend', requirePermission('MANAGE_STAFF'), staffController.suspendStaff);
router.post('/staff/:id/activate', requirePermission('MANAGE_STAFF'), staffController.activateStaff);

router.patch('/staff/me', validateRequest({ body: updateProfileSchema }), staffController.updateProfile);
router.post(
  '/staff/change-password',
  validateRequest({ body: changePasswordSchema }),
  staffController.changePassword
);

export const staffRoutes = router;
