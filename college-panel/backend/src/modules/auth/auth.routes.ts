import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../shared/validation/validateRequest';
import {
  loginSchema,
  activateAccountSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validateTokenQuerySchema,
  otpRequestSchema,
  otpVerifySchema,
  selectRoleSchema,
  googleVerifySchema,
  linkAccountSchema,
  completeGoogleLinkSchema,
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

// Milestone Guard: Safely disable unfinished Phone OTP & Google endpoints in dev & prod environments
const disableUnfinishedAuth = (_req: any, res: any, next: any) => {
  if (process.env.NODE_ENV !== 'test') {
    return res.status(501).json({
      success: false,
      error: 'Authentication method disabled for this milestone. Only Email + Password authentication is supported.',
    });
  }
  next();
};

// --- PHONE OTP & IDENTITY ENDPOINTS ---
router.post(
  '/otp/request',
  disableUnfinishedAuth,
  authRateLimiter,
  validateRequest({ body: otpRequestSchema }),
  authController.requestOtp
);
router.post(
  '/otp/verify',
  disableUnfinishedAuth,
  authRateLimiter,
  validateRequest({ body: otpVerifySchema }),
  authController.verifyOtp
);
router.post(
  '/select-role',
  disableUnfinishedAuth,
  authRateLimiter,
  validateRequest({ body: selectRoleSchema }),
  authController.selectRole
);

// --- GOOGLE SIGN-IN & ACCOUNT LINKING ENDPOINTS ---
router.post(
  '/google/verify',
  disableUnfinishedAuth,
  authRateLimiter,
  validateRequest({ body: googleVerifySchema }),
  authController.verifyGoogle
);
router.post(
  '/link-account',
  disableUnfinishedAuth,
  authRateLimiter,
  validateRequest({ body: linkAccountSchema }),
  authController.linkAccount
);
router.post(
  '/google/complete-link',
  disableUnfinishedAuth,
  authRateLimiter,
  validateRequest({ body: completeGoogleLinkSchema }),
  authController.completeGoogleLink
);

export const authRoutes = router;
