import { repository } from '../../db/repository';
import { NotFoundError } from '../../shared/errors/AppError';

export class ServicesService {
  async getServices() {
    return await repository.getAllServices();
  }

  async toggleGlobalService(id: string, actor: { userId: string; name: string; role: string; ip: string }) {
    const service = await repository.getServiceById(id);
    if (!service) throw new NotFoundError('Platform service not found.');

    const updated = await repository.toggleGlobalService(id);

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'TOGGLE_GLOBAL_SERVICE',
      entity: 'PlatformService',
      entityId: service.id,
      entityName: service.name,
      ip: actor.ip,
      result: 'Success',
      reason: `Global service status toggled to ${updated.isGlobalActive}`,
      beforeState: { isGlobalActive: service.isGlobalActive },
      afterState: { isGlobalActive: updated.isGlobalActive },
    });

    return updated;
  }
}

export const servicesService = new ServicesService();
