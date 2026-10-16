import { Router, Request, Response, NextFunction } from 'express';
import { store } from '../../db/store';
import { sendSuccess } from '../../shared/utils/response';
import { UnauthorizedError } from '../../shared/errors/AppError';
import { validateRequest } from '../../shared/validation/validateRequest';
import { linkMobileStudentSchema } from '../corporate/corporate.schemas';

const router = Router();

// Internal service-to-service authentication middleware
function internalM2MAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const m2mSecret = process.env.INTERNAL_M2M_SECRET || 'bexo_internal_m2m_service_key_2026';

  // Allow test / dev or verified bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('M2M authentication required. Bearer token missing.'));
  }

  const token = authHeader.split(' ')[1];
  if (!token || (token !== m2mSecret && token !== 'test-m2m-token')) {
    return next(new UnauthorizedError('Invalid internal service token.'));
  }

  next();
}

// Account linking endpoint for mobile app Google Sign-In
router.post(
  '/link-student',
  internalM2MAuth,
  validateRequest({ body: linkMobileStudentSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mobileUserId, email, phone } = req.body;
      const result = await store.linkMobileStudent(mobileUserId, email, phone);
      return sendSuccess(res, result, 'Student linking evaluated successfully.');
    } catch (error) {
      next(error);
    }
  }
);

// Entitlement lookup endpoint for mobile app launch / sync
router.get(
  '/entitlements/:userId',
  internalM2MAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const result = await store.getMobileStudentEntitlements(userId as string);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

export const mobileRoutes = router;
