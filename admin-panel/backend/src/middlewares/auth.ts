import { Request, Response, NextFunction } from 'express';
import { verifyToken, hashToken, AuthTokenPayload } from '../shared/utils/tokens';
import { UnauthorizedError, ForbiddenError } from '../shared/errors/AppError';
import { repository } from '../db/repository';

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers.cookie) {
      const match = req.headers.cookie.match(/bexo_token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (!token) {
      throw new UnauthorizedError('Session expired or unauthorized. Please sign in again.');
    }

    // 1. Verify cryptographic JWT signature, algorithm, issuer and audience
    const payload = verifyToken<AuthTokenPayload>(token);

    // 2. Multi-tenant perimeter guard (reject institutional identities immediately)
    if (payload.collegeId || (payload.role && payload.role.startsWith('college_'))) {
      throw new ForbiddenError(
        'Institutional Access Restricted: This portal is for central BEXO corporate administrators. College staff must access via the dedicated College Portal.'
      );
    }

    // 3. Validate session record & revocation status
    const tokenHash = hashToken(token);
    const session = await repository.getSessionByTokenHash(tokenHash);
    if (!session || session.isRevoked) {
      throw new UnauthorizedError('Session has been revoked or invalidated. Please sign in again.');
    }

    const expiresAt = new Date(session.expiresAt).getTime();
    if (!isNaN(expiresAt) && expiresAt < Date.now()) {
      throw new UnauthorizedError('Session has expired. Please sign in again.');
    }

    // 3. Validate user account status and session version
    const user = await repository.getStaffById(payload.userId);
    if (!user) {
      throw new UnauthorizedError('Corporate staff account no longer exists.');
    }

    if (!user.isActive || user.accountStatus === 'SUSPENDED' || user.accountStatus === 'REVOKED') {
      throw new ForbiddenError('Your corporate account is suspended or inactive. Please contact system admin.');
    }

    // Compare token session version with user's current session version
    const currentVersion = user.sessionVersion || 1;
    const tokenVersion = payload.sessionVersion || 1;
    if (tokenVersion < currentVersion) {
      throw new UnauthorizedError(
        'Session is no longer valid due to a security update or password reset. Please sign in again.'
      );
    }

    // 4. Multi-tenant perimeter guard
    if (user.collegeId || payload.collegeId || user.role.startsWith('college_') || (payload.role && payload.role.startsWith('college_'))) {
      throw new ForbiddenError(
        'Institutional Access Restricted: This portal is for central BEXO corporate administrators. College staff must access via the dedicated College Portal.'
      );
    }

    req.user = {
      ...payload,
      role: user.role,
      name: user.name,
      collegeId: null,
      sessionVersion: currentVersion,
    };
    req.token = token;
    req.tokenHash = tokenHash;

    next();
  } catch (error) {
    next(error);
  }
}
