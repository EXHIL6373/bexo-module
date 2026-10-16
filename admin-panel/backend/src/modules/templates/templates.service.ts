import { repository } from '../../db/repository';
import { NotFoundError } from '../../shared/errors/AppError';

export class TemplatesService {
  async getTemplates() {
    return await repository.getAllTemplates();
  }

  async getTemplateById(id: string) {
    const tmpl = await repository.getTemplateById(id);
    if (!tmpl) throw new NotFoundError('App template not found.');
    return tmpl;
  }

  async createTemplate(tmplData: any, actor: { userId: string; name: string; role: string; ip: string }) {
    const created = await repository.createTemplate({
      ...tmplData,
      slug: tmplData.slug || tmplData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      author: tmplData.author || actor.name,
    });

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CREATE_APP_TEMPLATE',
      entity: 'AppTemplate',
      entityId: created.id,
      entityName: created.name,
      ip: actor.ip,
      result: 'Success',
      reason: `Registered new application template (${created.name}, category: ${created.category})`,
    });

    return created;
  }

  async updateTemplate(id: string, updates: any, actor: { userId: string; name: string; role: string; ip: string }) {
    const tmpl = await repository.getTemplateById(id);
    if (!tmpl) throw new NotFoundError('App template not found.');

    const updated = await repository.updateTemplate(id, updates);

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'UPDATE_APP_TEMPLATE',
      entity: 'AppTemplate',
      entityId: tmpl.id,
      entityName: tmpl.name,
      ip: actor.ip,
      result: 'Success',
      reason: 'Updated application template metadata',
    });

    return updated;
  }

  async deleteTemplate(id: string, actor: { userId: string; name: string; role: string; ip: string }) {
    const tmpl = await repository.getTemplateById(id);
    if (!tmpl) throw new NotFoundError('App template not found.');

    await repository.deleteTemplate(id);

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'DELETE_APP_TEMPLATE',
      entity: 'AppTemplate',
      entityId: tmpl.id,
      entityName: tmpl.name,
      ip: actor.ip,
      result: 'Success',
      reason: `Deleted template ${tmpl.name}`,
    });
  }

  async togglePublish(id: string, actor: { userId: string; name: string; role: string; ip: string }) {
    const updated = await repository.togglePublishTemplate(id);

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'TOGGLE_PUBLISH_TEMPLATE',
      entity: 'AppTemplate',
      entityId: updated.id,
      entityName: updated.name,
      ip: actor.ip,
      result: 'Success',
      reason: `Publication state toggled to ${updated.status}`,
    });

    return updated;
  }

  async toggleFeatured(id: string, actor: { userId: string; name: string; role: string; ip: string }) {
    const updated = await repository.toggleFeaturedTemplate(id);

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'TOGGLE_FEATURED_TEMPLATE',
      entity: 'AppTemplate',
      entityId: updated.id,
      entityName: updated.name,
      ip: actor.ip,
      result: 'Success',
      reason: `Featured flag toggled to ${updated.isFeatured}`,
    });

    return updated;
  }
}

export const templatesService = new TemplatesService();
