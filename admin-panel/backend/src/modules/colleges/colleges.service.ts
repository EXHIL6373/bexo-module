import { repository } from '../../db/repository';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError';
import { CollegeFilters } from '../../db/repository/types';
import { outboxProcessor } from '../../integrations/outboxProcessor';
import { collegePanelClient } from '../../integrations/collegePanelClient';
import { logger } from '../../shared/utils/logger';

export class CollegesService {
  async getColleges(filters?: CollegeFilters) {
    return await repository.getAllColleges(filters);
  }

  async getCollegeById(id: string) {
    const college = await repository.getCollegeById(id);
    if (!college) throw new NotFoundError('College not found.');
    return college;
  }

  async createCollege(collegeData: any, actor: { userId: string; name: string; role: string; ip: string }) {
    const existing = await repository.getCollegeByCode(collegeData.code);
    if (existing) {
      throw new ConflictError(`College code '${collegeData.code}' is already registered.`);
    }

    const created = await repository.createCollege(collegeData);

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CREATE_COLLEGE',
      entity: 'College',
      entityId: created.id,
      entityName: created.name,
      ip: actor.ip,
      result: 'Success',
      reason: 'Onboarded new institution via BEXO Corporate Console',
      afterState: { code: created.code, name: created.name, status: created.status },
    });

    // Asynchronously notify downstream College Panel of onboarding
    collegePanelClient
      .syncCollegeLifecycle({
        collegeId: created.id,
        status: created.status,
        quotaAllocated: created.quotaAllocated,
        services: created.services || [],
        timestamp: new Date().toISOString(),
      })
      .catch((err) => {
        logger.warn({ err: err.message, collegeId: created.id }, 'Downstream college onboarding notice failed (non-blocking)');
      });

    return created;
  }

  async updateCollege(id: string, updates: any, actor: { userId: string; name: string; role: string; ip: string }) {
    const college = await repository.getCollegeById(id);
    if (!college) throw new NotFoundError('College not found.');

    if (updates.code && updates.code.toUpperCase() !== college.code) {
      const conflict = await repository.getCollegeByCode(updates.code);
      if (conflict && conflict.id !== id) {
        throw new ConflictError(`College code '${updates.code}' is already in use by another college.`);
      }
    }

    const updated = await repository.updateCollege(id, updates);

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'UPDATE_COLLEGE_PROFILE',
      entity: 'College',
      entityId: college.id,
      entityName: college.name,
      ip: actor.ip,
      result: 'Success',
      reason: 'Updated institutional profile details',
      beforeState: { name: college.name, status: college.status },
      afterState: { name: updated.name, status: updated.status },
    });

    return updated;
  }

  async suspendCollege(id: string, reason: string, actor: { userId: string; name: string; role: string; ip: string }) {
    const college = await repository.getCollegeById(id);
    if (!college) throw new NotFoundError('College not found.');

    const nextVersion = (college.lifecycleVersion || 1) + 1;
    const updated = await repository.updateCollege(id, {
      status: 'Suspended',
      dashboardAccess: false,
      suspensionReason: reason,
      suspendedAt: new Date().toISOString(),
      lifecycleVersion: nextVersion,
      syncStatus: 'PENDING_SYNC',
    });

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'SUSPEND_COLLEGE',
      entity: 'College',
      entityId: college.id,
      entityName: college.name,
      ip: actor.ip,
      result: 'Success',
      reason,
      beforeState: { status: college.status, dashboardAccess: college.dashboardAccess, lifecycleVersion: college.lifecycleVersion },
      afterState: { status: 'Suspended', dashboardAccess: false, lifecycleVersion: nextVersion },
    });

    // Create durable transactional outbox event
    await repository.createOutboxEvent({
      collegeId: id,
      lifecycleVersion: nextVersion,
      eventType: 'SUSPEND',
      payload: {
        collegeId: id,
        status: 'Suspended',
        dashboardAccess: false,
        quotaAllocated: updated.quotaAllocated,
        services: [],
        version: nextVersion,
        reason,
        timestamp: new Date().toISOString(),
      },
      status: 'PENDING',
    });

    // Dispatch outbox events with bounded retry in background
    outboxProcessor.processPending().catch((err) => {
      logger.warn({ err: err.message, collegeId: id }, 'Outbox processing scheduled in background');
    });

    return updated;
  }

  async reactivateCollege(id: string, reason = 'Reactivated by central administration', actor: { userId: string; name: string; role: string; ip: string }) {
    const college = await repository.getCollegeById(id);
    if (!college) throw new NotFoundError('College not found.');

    const nextVersion = (college.lifecycleVersion || 1) + 1;
    const updated = await repository.updateCollege(id, {
      status: 'Active',
      dashboardAccess: true,
      suspensionReason: null,
      reactivatedAt: new Date().toISOString(),
      lifecycleVersion: nextVersion,
      syncStatus: 'PENDING_SYNC',
    });

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'REACTIVATE_COLLEGE',
      entity: 'College',
      entityId: college.id,
      entityName: college.name,
      ip: actor.ip,
      result: 'Success',
      reason,
      beforeState: { status: college.status, dashboardAccess: college.dashboardAccess, lifecycleVersion: college.lifecycleVersion },
      afterState: { status: 'Active', dashboardAccess: true, lifecycleVersion: nextVersion },
    });

    // Create durable transactional outbox event
    await repository.createOutboxEvent({
      collegeId: id,
      lifecycleVersion: nextVersion,
      eventType: 'REACTIVATE',
      payload: {
        collegeId: id,
        status: 'Active',
        dashboardAccess: true,
        quotaAllocated: updated.quotaAllocated,
        services: updated.services || [],
        version: nextVersion,
        reason,
        timestamp: new Date().toISOString(),
      },
      status: 'PENDING',
    });

    // Dispatch outbox events with bounded retry in background
    outboxProcessor.processPending().catch((err) => {
      logger.warn({ err: err.message, collegeId: id }, 'Outbox processing scheduled in background');
    });

    return updated;
  }

  async updateQuota(collegeId: string, newAllocated: number, reason: string, actor: { userId: string; name: string; role: string; ip: string }) {
    const college = await repository.getCollegeById(collegeId);
    if (!college) throw new NotFoundError('College not found.');

    const nextVersion = (college.lifecycleVersion || 1) + 1;
    const historyEntry = await repository.updateQuota(collegeId, newAllocated, reason, actor.name);

    await repository.updateCollege(collegeId, {
      lifecycleVersion: nextVersion,
      syncStatus: 'PENDING_SYNC',
    }).catch(() => {});

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'UPDATE_QUOTA',
      entity: 'College',
      entityId: college.id,
      entityName: college.name,
      ip: actor.ip,
      result: 'Success',
      reason,
      beforeState: { quotaAllocated: college.quotaAllocated, lifecycleVersion: college.lifecycleVersion },
      afterState: { quotaAllocated: newAllocated, lifecycleVersion: nextVersion },
    });

    // Create durable transactional outbox event
    await repository.createOutboxEvent({
      collegeId,
      lifecycleVersion: nextVersion,
      eventType: 'QUOTA_UPDATE',
      payload: {
        collegeId,
        status: college.status,
        dashboardAccess: college.dashboardAccess,
        quotaAllocated: newAllocated,
        services: college.services || [],
        version: nextVersion,
        reason,
        timestamp: new Date().toISOString(),
      },
      status: 'PENDING',
    });

    // Dispatch outbox events with bounded retry in background
    outboxProcessor.processPending().catch((err) => {
      logger.warn({ err: err.message, collegeId }, 'Outbox processing scheduled in background');
    });

    return historyEntry;
  }

  async getQuotaHistory(collegeId?: string) {
    return await repository.getQuotaHistory(collegeId);
  }

  async toggleCollegeService(collegeId: string, serviceId: string, enabled: boolean, actor: { userId: string; name: string; role: string; ip: string }) {
    const college = await repository.getCollegeById(collegeId);
    if (!college) throw new NotFoundError('College not found.');

    const updated = await repository.toggleCollegeService(collegeId, serviceId, enabled);

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: enabled ? 'ENABLE_COLLEGE_SERVICE' : 'DISABLE_COLLEGE_SERVICE',
      entity: 'CollegeService',
      entityId: `${collegeId}:${serviceId}`,
      entityName: college.name,
      ip: actor.ip,
      result: 'Success',
      reason: `Institutional service state toggled to ${enabled}`,
    });

    return updated;
  }
}

export const collegesService = new CollegesService();
