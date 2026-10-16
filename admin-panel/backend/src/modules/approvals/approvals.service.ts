import { repository } from '../../db/repository';
import { NotFoundError, ConflictError } from '../../shared/errors/AppError';

export class ApprovalsService {
  async getApprovals(status?: string) {
    return await repository.getAllApprovals(status);
  }

  async getApprovalById(id: string) {
    const appr = await repository.getApprovalById(id);
    if (!appr) throw new NotFoundError('Approval request not found.');
    return appr;
  }

  async submitRequest(requestData: any, actor: { userId: string; name: string; role: string; ip: string }) {
    const created = await repository.createApproval(requestData);

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'SUBMIT_APPROVAL_REQUEST',
      entity: 'ApprovalRequest',
      entityId: created.id,
      entityName: created.type,
      ip: actor.ip,
      result: 'Success',
      reason: `Submitted approval request: ${created.type} for ${created.collegeName}`,
    });

    return created;
  }

  async approveRequest(id: string, decisionReason: string, actor: { userId: string; name: string; role: string; ip: string }) {
    const updated = await repository.updateApprovalDecision(id, 'Approved', decisionReason, actor.name);

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'APPROVE_REQUEST',
      entity: 'ApprovalRequest',
      entityId: updated.id,
      entityName: updated.type,
      ip: actor.ip,
      result: 'Success',
      reason: decisionReason,
      beforeState: { status: 'Pending' },
      afterState: { status: 'Approved', decisionReason },
    });

    return updated;
  }

  async rejectRequest(id: string, decisionReason: string, actor: { userId: string; name: string; role: string; ip: string }) {
    const updated = await repository.updateApprovalDecision(id, 'Rejected', decisionReason, actor.name);

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'REJECT_REQUEST',
      entity: 'ApprovalRequest',
      entityId: updated.id,
      entityName: updated.type,
      ip: actor.ip,
      result: 'Success',
      reason: decisionReason,
      beforeState: { status: 'Pending' },
      afterState: { status: 'Rejected', decisionReason },
    });

    return updated;
  }
}

export const approvalsService = new ApprovalsService();
