import { store } from '../../db/store';
import { NotFoundError } from '../../shared/errors/AppError';

export class CollegeService {
  async getMyCollege(collegeId: string) {
    const college = await store.getCollegeById(collegeId);
    if (!college) {
      throw new NotFoundError('Institutional entity could not be verified.');
    }
    return college;
  }

  async updateSettings(collegeId: string, updates: any, actor: any) {
    const college = await store.getCollegeById(collegeId);
    if (!college) {
      throw new NotFoundError('Institutional entity could not be verified.');
    }

    const updated = await store.updateCollege(collegeId, updates);

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId,
      actorStaffId: actor.userId,
      actorName: actor.name || actor.email,
      actorRole: actor.role,
      action: 'UPDATE_COLLEGE_SETTINGS',
      entity: 'College',
      entityId: collegeId,
      entityName: college.name,
      ip: '127.0.0.1',
      result: 'Success',
      beforeState: { address: college.address, primaryContact: college.primaryContact },
      afterState: updates,
    });

    return updated;
  }

  async getAgreement(collegeId: string) {
    return store.getAgreementByCollege(collegeId);
  }

  async getBilling(collegeId: string) {
    return store.getInvoicesByCollege(collegeId);
  }
}

export const collegeService = new CollegeService();
