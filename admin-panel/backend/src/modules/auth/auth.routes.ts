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
  otpRequestSchema,
  otpVerifySchema,
  selectRoleSchema,
  googleVerifySchema,
  linkAccountSchema,
  completeGoogleLinkSchema,
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
  authLimiter,
  validateRequest({ body: otpRequestSchema }),
  authController.requestOtp
);
router.post(
  '/otp/verify',
  disableUnfinishedAuth,
  authLimiter,
  validateRequest({ body: otpVerifySchema }),
  authController.verifyOtp
);
router.post(
  '/select-role',
  disableUnfinishedAuth,
  authLimiter,
  validateRequest({ body: selectRoleSchema }),
  authController.selectRole
);

// --- GOOGLE SIGN-IN & ACCOUNT LINKING ENDPOINTS ---
router.post(
  '/google/verify',
  disableUnfinishedAuth,
  authLimiter,
  validateRequest({ body: googleVerifySchema }),
  authController.verifyGoogle
);
router.post(
  '/link-account',
  disableUnfinishedAuth,
  authLimiter,
  validateRequest({ body: linkAccountSchema }),
  authController.linkAccount
);
router.post(
  '/google/complete-link',
  disableUnfinishedAuth,
  authLimiter,
  validateRequest({ body: completeGoogleLinkSchema }),
  authController.completeGoogleLink
);

export const authRoutes = router;
