import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { otpService } from './otp.service';
import { roleDiscoveryService } from './roleDiscovery.service';
import { googleAuthService } from './googleAuth.service';
import { sendSuccess } from '../../shared/utils/response';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password, req.ip);

      res.cookie('bexo_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return sendSuccess(res, result, 'Authentication successful.');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : undefined;
      const cookieMatch = req.headers.cookie ? req.headers.cookie.match(/bexo_token=([^;]+)/) : null;
      const token = req.token || bearerToken || (cookieMatch ? cookieMatch[1] : undefined);

      const result = await authService.logout(req.user?.userId, token);

      res.clearCookie('bexo_token');
      return sendSuccess(res, result, 'Successfully logged out.');
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await authService.getProfile(req.user!.userId);
      return sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset(email);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async validateResetToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = (req.query.token as string) || '';
      const result = await authService.validateResetToken(token);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword);
      return sendSuccess(res, result, 'Password reset successfully.');
    } catch (error) {
      next(error);
    }
  }

  async validateInviteToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = (req.query.token as string) || '';
      const result = await authService.validateInviteToken(token);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async activateAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      const result = await authService.activateAccount(token, password);
      return sendSuccess(res, result, 'Account activated successfully.');
    } catch (error) {
      next(error);
    }
  }

  // --- PHONE OTP & IDENTITY FLOW ---
  async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNumber, purpose } = req.body;
      const result = await otpService.requestOtp(phoneNumber, purpose);
      return sendSuccess(res, result, 'Verification code dispatched successfully.');
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { challengeId, otp } = req.body;
      const verifyRes = await otpService.verifyOtp(challengeId, otp);
      const discoveryRes = await roleDiscoveryService.discoverRolesForPhone(verifyRes.phoneNumber, req.ip);

      if (discoveryRes.token) {
        res.cookie('bexo_token', discoveryRes.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
        });
      }

      return sendSuccess(res, discoveryRes, 'Phone number verified.');
    } catch (error) {
      next(error);
    }
  }

  async selectRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { preAuthToken, selectedRoleId } = req.body;
      const result = await roleDiscoveryService.selectRole(preAuthToken, selectedRoleId, req.ip);

      if (result.token) {
        res.cookie('bexo_token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
        });
      }

      return sendSuccess(res, result, 'Role selected successfully.');
    } catch (error) {
      next(error);
    }
  }

  // --- GOOGLE SIGN-IN & ACCOUNT LINKING ---
  async verifyGoogle(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken } = req.body;
      const result = await googleAuthService.authenticateWithGoogle(idToken, req.ip);

      if ((result as any).token) {
        res.cookie('bexo_token', (result as any).token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
        });
      }

      return sendSuccess(res, result, 'Google identity processed.');
    } catch (error) {
      next(error);
    }
  }

  async linkAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNumber, idToken } = req.body;
      const result = await googleAuthService.linkGoogleAccount(phoneNumber, idToken);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async completeGoogleLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { preLinkToken, phoneNumber } = req.body;
      const result = await googleAuthService.completeLinkWithPreLinkToken(preLinkToken, phoneNumber, req.ip);

      if (result.token) {
        res.cookie('bexo_token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
        });
      }

      return sendSuccess(res, result, 'Account linked and authenticated successfully.');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
