import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../shared/utils/response';

export class AuthController {
  async corporateLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.corporateLogin(email, password);
      return sendSuccess(res, result, 'Corporate authentication successful.');
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return sendSuccess(res, result, 'Authentication successful.');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.getMe(req.user!.userId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, { loggedOut: true }, 'Signed out successfully.');
    } catch (error) {
      next(error);
    }
  }

  async validateInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.query.token as string;
      const result = await authService.validateInvitation(token);
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

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset(email);
      return sendSuccess(res, result, 'Password reset instructions dispatched.');
    } catch (error) {
      next(error);
    }
  }

  async validateResetToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.query.token as string;
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
      return sendSuccess(res, result, 'Password reset completed.');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
