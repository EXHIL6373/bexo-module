import crypto from 'node:crypto';
import { store } from '../../db/store';
import { NotFoundError, ValidationError, ForbiddenError, QuotaExceededError } from '../../shared/errors/AppError';

export class ProvisioningService {
  async getJobs(collegeId: string) {
    return store.getProvisioningJobsByCollege(collegeId);
  }

  async getJobById(id: string, collegeId: string) {
    const job = await store.getProvisioningJobById(id, collegeId);
    if (!job) throw new NotFoundError('Provisioning job record not found.');
    return job;
  }

  async triggerProvisioning(collegeId: string, studentIds: string[], serviceName: string, actor: any) {
    const actorInfo = {
      userId: actor?.userId || actor?.id || 'sys-actor',
      name: actor?.name || actor?.email || 'Institutional Staff',
      role: actor?.role || 'COLLEGE_STAFF',
      ip: actor?.ip || '127.0.0.1',
    };

    try {
      const res = await store.provisionBatchWithQuota(collegeId, studentIds, [serviceName], actorInfo);
      return {
        job: res.job,
        successful: res.successful,
        failed: 0,
        skipped: 0,
      };
    } catch (err: any) {
      if (err instanceof QuotaExceededError) {
        throw new ValidationError(err.message);
      }
      throw err;
    }
  }

  async retryJob(jobId: string, collegeId: string, actor: any) {
    const job = await this.getJobById(jobId, collegeId);
    if (!job.failedRecords || job.failedRecords.length === 0) {
      return { success: true, retriedCount: 0 };
    }

    const retriedCount = job.failedRecords.length;
    // Clear failed records on retry simulation
    job.failedRecords = [];
    job.successful += retriedCount;
    job.failed = 0;
    job.status = 'Completed';
    job.completedAt = new Date().toISOString();

    await store.updateProvisioningJob(jobId, job);

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId,
      actorStaffId: actor.userId,
      actorName: actor.name || actor.email,
      actorRole: actor.role,
      action: 'RETRY_PROVISIONING_RECORDS',
      entity: 'ProvisioningJob',
      entityId: jobId,
      entityName: `Retried ${retriedCount} records`,
      ip: '127.0.0.1',
      result: 'Success',
    });

    return { success: true, retriedCount };
  }

  async getEntitlements(collegeId: string) {
    return store.getEntitlementsByCollege(collegeId);
  }
}

export const provisioningService = new ProvisioningService();
