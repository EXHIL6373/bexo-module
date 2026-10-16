import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../shared/validation/validateRequest';
import {
  loginSchema,
  activateAccountSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validateTokenQuerySchema,
} from './auth.schemas';
import { requireAuth } from '../../middlewares/auth';
import { authRateLimiter } from '../../middlewares/rateLimiter';

const router = Router();


router.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  authController.corporateLogin
);

router.post(
  '/college-login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  authController.login
);

router.get('/me', requireAuth, authController.getMe);
router.post('/logout', requireAuth, authController.logout);

router.get(
  '/invitations/validate',
  validateRequest({ query: validateTokenQuerySchema }),
  authController.validateInvitation
);

router.post(
  '/activate-account',
  validateRequest({ body: activateAccountSchema }),
  authController.activateAccount
);

router.post(
  '/forgot-password',
  authRateLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  authController.forgotPassword
);

router.get(
  '/reset-password/validate',
  validateRequest({ query: validateTokenQuerySchema }),
  authController.validateResetToken
);

router.post(
  '/reset-password',
  validateRequest({ body: resetPasswordSchema }),
  authController.resetPassword
);

export const authRoutes = router;
