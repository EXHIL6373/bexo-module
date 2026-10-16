import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, NotFoundError } from '../shared/errors/AppError';
import { store } from '../db/store';

export async function requireCollegeTenant(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ForbiddenError('Authentication context missing.');
    }

    // Principle 3: Rejection of Corporate Admins attempting to use College Gateway
    if (!req.user.collegeId) {
      throw new ForbiddenError(
        'Institutional Access Restricted: This portal is exclusively for authorized college staff. Corporate administrators must sign in at the BEXO Corporate Admin Console.'
      );
    }

    const college = await store.getCollegeById(req.user.collegeId);
    if (!college) {
      throw new NotFoundError('Institutional entity could not be verified.');
    }

    // Principle 4: Institutional Lifecycle Enforcement
    if (college.status === 'Suspended' || !college.dashboardAccess) {
      // Reject write operations
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
        throw new ForbiddenError(
          college.suspensionReason ||
            "Institutional Access Suspended: Your institution's dashboard access is currently suspended. Please contact BEXO Enterprise Support."
        );
      }
    }

    req.collegeId = req.user.collegeId;

    // Principle 1: Zero Trust in Frontend-Supplied collegeId - prevent tampering
    if (req.body && typeof req.body === 'object') {
      req.body.collegeId = req.collegeId;
    }

    next();
  } catch (error) {
    next(error);
  }
}
