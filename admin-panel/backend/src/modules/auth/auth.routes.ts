import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { requireAuth } from '../../middlewares/auth';
import { authLimiter } from '../../middlewares/rateLimiter';
import {
  loginSchema,
  forgotPasswordSchema,
  validateResetTokenSchema,
  resetPasswordSchema,
  validateInviteTokenSchema,
  activateAccountSchema,
} from './auth.schema';

const router = Router();

router.post('/login', authLimiter, validateRequest({ body: loginSchema }), authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.getProfile);
router.post(
  '/forgot-password',
  authLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  authController.forgotPassword
);
router.get(
  '/reset-password/validate',
  validateRequest({ query: validateResetTokenSchema }),
  authController.validateResetToken
);
router.post(
  '/reset-password',
  authLimiter,
  validateRequest({ body: resetPasswordSchema }),
  authController.resetPassword
);
router.get(
  '/invitations/validate',
  validateRequest({ query: validateInviteTokenSchema }),
  authController.validateInviteToken
);
router.post(
  '/activate-account',
  authLimiter,
  validateRequest({ body: activateAccountSchema }),
  authController.activateAccount
);

export const authRoutes = router;
