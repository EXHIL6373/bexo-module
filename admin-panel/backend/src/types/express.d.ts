import { AuthTokenPayload } from '../shared/utils/tokens';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
      id?: string;
      token?: string;
      tokenHash?: string;
    }
  }
}
