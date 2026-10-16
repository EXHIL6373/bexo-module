import { repository } from '../../db/repository';
import { NotFoundError, ValidationError, QuotaExceededError } from '../../shared/errors/AppError';

export class ProvisioningService {
  async getJobs(collegeId?: string) {
    return await repository.getAllProvisioningJobs(collegeId);
  }

  async getJobById(id: string) {
    const job = await repository.getProvisioningJobById(id);
    if (!job) throw new NotFoundError('Provisioning job not found.');
    return job;
  }

  async triggerBatch(
    payload: {
      collegeId: string;
      source?: string;
      startRoll?: string;
      endRoll?: string;
      batchSize?: number;
    },
    actor: { userId: string; name: string; role: string; ip: string }
  ) {
    const college = await repository.getCollegeById(payload.collegeId);
    if (!college) throw new NotFoundError('College not found.');

    if (college.status === 'Suspended' || !college.dashboardAccess) {
      throw new ValidationError(
        `Cannot initiate student provisioning: ${college.name} is currently suspended.`
      );
    }

    const count = payload.batchSize || 50;
    const availableQuota = Math.max(0, college.quotaAllocated - college.quotaUsed);

    const failedRecords: any[] = [];
    let successful = 0;
    let failed = 0;

    if (count > availableQuota) {
      const quotaShortage = count - availableQuota;
      failed += quotaShortage;
      failedRecords.push({
        rollNumber: 'BATCH-EXCESS',
        name: 'Quota Limit Exceeded Records',
        reason: `Requested ${count} seats but only ${availableQuota} available in ${college.name}`,
        status: 'Quota Exceeded',
      });
      successful = availableQuota;
    } else {
      successful = count;
    }

    const status =
      failed === 0
        ? 'Completed'
        : successful > 0
        ? 'Partially Completed'
        : 'Failed';

    const jobId = `job-prov-${Date.now()}`;
    const jobRecord = {
      id: jobId,
      collegeId: college.id,
      collegeName: college.name,
      createdBy: `${actor.name} (${actor.role})`,
      source: payload.source || 'Roll Number Range',
      totalRecords: count,
      successful,
      failed,
      partial: 0,
      status,
      failedRecords,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    const createdJob = await repository.createProvisioningJob(jobRecord);

    if (successful > 0) {
      await repository.updateCollege(college.id, {
        quotaUsed: college.quotaUsed + successful,
        totalStudents: (college.totalStudents || 0) + successful,
        activeStudents: (college.activeStudents || 0) + successful,
      });
    }

    await repository.createNotification({
      title: `Provisioning Batch ${status}`,
      message: `Batch job ${jobId} for ${college.name} completed: ${successful} successful, ${failed} failed.`,
      category: 'Provisioning',
      severity: failed > 0 ? 'warning' : 'success',
      relatedEntity: { type: 'job', id: jobId, name: college.name },
      actionUrl: `/provisioning`,
    });

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'TRIGGER_PROVISIONING_BATCH',
      entity: 'ProvisioningJob',
      entityId: jobId,
      entityName: college.name,
      ip: actor.ip,
      result: failed > 0 ? 'Denied' : 'Success',
      reason: `Provisioned batch of ${count} records (${successful} created, ${failed} failed)`,
      afterState: { successful, failed, status },
    });

    return createdJob;
  }
}

export const provisioningService = new ProvisioningService();
