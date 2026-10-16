import { Request, Response, NextFunction } from 'express';
import { invitationsService } from './invitations.service';
import { sendSuccess } from '../../shared/utils/response';

export class InvitationsController {
  async createInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const created = await invitationsService.createInvitation(req.body, actor);
      return sendSuccess(res, created, 'Cryptographic invitation dispatched successfully.', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async resendInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const updated = await invitationsService.resendInvitation(req.params.id as string, actor);
      return sendSuccess(res, updated, 'Invitation resent successfully.');
    } catch (error) {
      next(error);
    }
  }

  async revokeInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const { reason } = req.body || {};
      await invitationsService.revokeInvitation(req.params.id as string, reason || 'Revoked by admin', actor);
      return sendSuccess(res, { success: true }, 'Invitation revoked.');
    } catch (error) {
      next(error);
    }
  }
}

export const invitationsController = new InvitationsController();
