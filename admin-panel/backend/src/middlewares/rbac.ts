import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../shared/errors/AppError';
import { ROLES, CORPORATE_ROLES } from '../config/constants';

export function requireRole(allowedRoles: readonly string[] | string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    const userRole = req.user.role;

    // super_admin always passes corporate authorization
    if (userRole === ROLES.SUPER_ADMIN) {
      return next();
    }

    // Treat 'admin' and 'platform_admin' interchangeably
    const normalizedUserRole = userRole === ROLES.PLATFORM_ADMIN ? ROLES.ADMIN : userRole;
    const isAllowed = allowedRoles.some((role) => {
      const normalizedRole = role === ROLES.PLATFORM_ADMIN ? ROLES.ADMIN : role;
      return normalizedRole === normalizedUserRole;
    });

    if (!isAllowed) {
      return next(
        new ForbiddenError(
          `Access forbidden: Role '${userRole}' lacks permission for this administrative operation.`
        )
      );
    }

    next();
  };
}

export function requireCorporateStaff(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required.'));
  }

  if (req.user.collegeId || req.user.role.startsWith('college_')) {
    return next(
      new ForbiddenError(
        'Institutional Access Restricted: This portal is for central BEXO corporate administrators. College staff must access via the dedicated College Portal.'
      )
    );
  }

  const isCorporate = (CORPORATE_ROLES as readonly string[]).includes(req.user.role);
  if (!isCorporate) {
    return next(
      new ForbiddenError('Access forbidden: Only corporate staff may access this resource.')
    );
  }

  next();
}
