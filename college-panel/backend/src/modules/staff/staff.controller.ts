import { Request, Response, NextFunction } from 'express';
import { staffService } from './staff.service';
import { sendSuccess } from '../../shared/utils/response';

export class StaffController {
  async getStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const staff = await staffService.getStaff(req.collegeId!);
      return sendSuccess(res, staff);
    } catch (error) {
      next(error);
    }
  }

  async inviteStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const invite = await staffService.inviteStaff(req.collegeId!, req.body, req.user!);
      return sendSuccess(res, invite, 'Staff invitation created and dispatched.', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async resendInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const invite = await staffService.resendInvite(
        req.collegeId!,
        req.params.id as string,
        req.user!
      );
      return sendSuccess(res, invite, 'Invitation re-sent successfully.');
    } catch (error) {
      next(error);
    }
  }

  async revokeInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      await staffService.revokeInvite(req.collegeId!, req.params.id as string, reason, req.user!);
      return sendSuccess(res, { revoked: true }, 'Invitation revoked.');
    } catch (error) {
      next(error);
    }
  }

  async updateStaffRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      const updated = await staffService.updateStaffRole(
        req.collegeId!,
        req.params.id as string,
        role,
        req.user!
      );
      return sendSuccess(res, updated, 'Staff role updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async suspendStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const updated = await staffService.suspendStaff(
        req.collegeId!,
        req.params.id as string,
        reason,
        req.user!
      );
      return sendSuccess(res, updated, 'Staff account suspended.');
    } catch (error) {
      next(error);
    }
  }

  async activateStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await staffService.activateStaff(
        req.collegeId!,
        req.params.id as string,
        req.user!
      );
      return sendSuccess(res, updated, 'Staff account activated.');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await staffService.updateProfile(req.user!.userId, req.body);
      return sendSuccess(res, updated, 'Profile updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      await staffService.changePassword(req.user!.userId, currentPassword, newPassword);
      return sendSuccess(res, { success: true }, 'Password changed successfully.');
    } catch (error) {
      next(error);
    }
  }
}

export const staffController = new StaffController();
