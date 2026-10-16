import { repository } from '../../db/repository';

export class AuditService {
  async getAuditLogs(entity?: string, page = 1, limit = 50) {
    return await repository.getAllAuditLogs(entity, page, limit);
  }

  async recordLog(logData: any, actor: { userId: string; name: string; role: string; ip: string }) {
    // Authoritative audit guarantee: Client-supplied events are tagged as MANUAL_ADMIN_NOTE
    // to prevent client events from spoofing system-generated transactional business operations.
    // Actor details are strictly derived from the authenticated server-side session.
    const entry = {
      ...logData,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      ip: actor.ip,
      source: 'MANUAL_ADMIN_NOTE',
      action: logData.action ? (logData.action.startsWith('MANUAL_') ? logData.action : `MANUAL_${logData.action}`) : 'MANUAL_AUDIT_ENTRY',
    };
    return await repository.createAuditLog(entry);
  }
}

export const auditService = new AuditService();
