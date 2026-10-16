import crypto from 'node:crypto';
import { store } from '../../db/store';
import { NotFoundError } from '../../shared/errors/AppError';

export class RequestsService {
  async getRequests(collegeId: string) {
    return store.getRequestsByCollege(collegeId);
  }

  async submitRequest(collegeId: string, input: any, actor: any) {
    const college = await store.getCollegeById(collegeId);
    if (!college) throw new NotFoundError('College not found.');

    const requestId = `req-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const newRequest = {
      id: requestId,
      type: input.type,
      collegeId,
      collegeName: college.name,
      requester: input.requester || actor.name || actor.email,
      requesterEmail: input.requesterEmail || actor.email,
      requesterRole: input.requesterRole || actor.role,
      details: input.details,
      priority: input.priority || 'Medium',
      status: 'Pending', // Strictly pending until corporate admin reviews
      createdAt: new Date().toISOString(),
    };

    await store.createRequest(newRequest);

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId,
      actorStaffId: actor.userId,
      actorName: actor.name || actor.email,
      actorRole: actor.role,
      action: 'SUBMIT_OPERATIONAL_REQUEST',
      entity: 'ApprovalRequest',
      entityId: requestId,
      entityName: input.details.title,
      ip: '127.0.0.1',
      result: 'Success',
      afterState: newRequest,
    });

    return newRequest;
  }
}

export const requestsService = new RequestsService();
