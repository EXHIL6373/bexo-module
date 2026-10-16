import { Router } from 'express';
import { invitationsController } from './invitations.controller';
import { requireAuth } from '../../middlewares/auth';
import { requireRole, requireCorporateStaff } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validateRequest';
import { PERMISSIONS } from '../../config/constants';
import {
  invitationIdParamSchema,
  createInvitationSchema,
  revokeInvitationSchema,
} from './invitations.schema';

const router = Router();

router.use(requireAuth, requireCorporateStaff);

router.post(
  '/',
  requireRole(PERMISSIONS.INVITE_STAFF),
  validateRequest({ body: createInvitationSchema }),
  invitationsController.createInvitation
);
router.post(
  '/:id/resend',
  requireRole(PERMISSIONS.INVITE_STAFF),
  validateRequest({ params: invitationIdParamSchema }),
  invitationsController.resendInvitation
);
router.post(
  '/:id/revoke',
  requireRole(PERMISSIONS.INVITE_STAFF),
  validateRequest({ params: invitationIdParamSchema, body: revokeInvitationSchema }),
  invitationsController.revokeInvitation
);

export const invitationsRoutes = router;
