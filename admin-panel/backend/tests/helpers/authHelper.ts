import { IRepository } from '../../src/db/repository/types';
import { signToken, hashToken } from '../../src/shared/utils/tokens';

export async function createAuthenticatedSession(
  repo: IRepository,
  user: {
    userId: string;
    email: string;
    role: any;
    name: string;
    collegeId?: string | null;
    sessionVersion?: number;
  }
): Promise<string> {
  const token = signToken({
    userId: user.userId,
    email: user.email,
    role: user.role,
    name: user.name,
    collegeId: user.collegeId ?? null,
    sessionVersion: user.sessionVersion ?? 1,
  });

  await repo.createSession({
    userId: user.userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    ipAddress: '127.0.0.1',
    userAgent: 'test-suite',
  });

  return token;
}
