import { TokenPayload } from '../shared/security/tokens';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload & {
        name?: string;
        department?: string;
        designation?: string;
        isActive?: boolean;
        accountStatus?: string;
      };
      collegeId?: string;
    }
  }
}

export {};
