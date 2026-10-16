import { repository } from '../../db/repository';
import { NotFoundError, ConflictError, ForbiddenError } from '../../shared/errors/AppError';
import { ROLES } from '../../config/constants';

export class UsersService {
  async getStaffUsers(collegeId?: string) {
    const list = await repository.getAllStaffUsers(collegeId);
    return list.map(({ passwordHash: _, ...safeUser }) => safeUser);
  }

  async addStaffUser(userData: any, actor: { userId: string; name: string; role: string; ip: string }) {
    // Privilege escalation guard
    if (userData.role === ROLES.SUPER_ADMIN && actor.role !== ROLES.SUPER_ADMIN) {
      throw new ForbiddenError('Only a super_admin can create another super_admin account.');
    }

    const existing = await repository.getStaffByEmail(userData.email);
    if (existing) {
      throw new ConflictError(`User with email '${userData.email}' is already registered.`);
    }

    const created = await repository.createStaffUser(userData);

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'ADD_STAFF_USER',
      entity: 'StaffUser',
      entityId: created.id,
      entityName: created.name,
      ip: actor.ip,
      result: 'Success',
      reason: `Created staff user (${created.email}, role: ${created.role})`,
    });

    const { passwordHash: _, ...safeUser } = created;
    return safeUser;
  }

  async updateStaffUser(id: string, updates: any, actor: { userId: string; name: string; role: string; ip: string }) {
    const user = await repository.getStaffById(id);
    if (!user) throw new NotFoundError('Staff user not found.');

    // Privilege escalation guard
    if (updates.role === ROLES.SUPER_ADMIN && actor.role !== ROLES.SUPER_ADMIN) {
      throw new ForbiddenError('Only a super_admin can grant super_admin privileges.');
    }

    // Invalidate sessions immediately on deactivation or suspension
    if (updates.isActive === false || updates.accountStatus === 'SUSPENDED' || updates.accountStatus === 'REVOKED') {
      await repository.bumpSessionVersion(id);
      await repository.revokeAllUserSessions(id);
    }

    const updated = await repository.updateStaffUser(id, updates);

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'UPDATE_STAFF_USER',
      entity: 'StaffUser',
      entityId: user.id,
      entityName: user.name,
      ip: actor.ip,
      result: 'Success',
      reason: 'Updated staff user attributes',
      beforeState: { role: user.role, isActive: user.isActive },
      afterState: { role: updated.role, isActive: updated.isActive },
    });

    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }

  async deleteStaffUser(id: string, actor: { userId: string; name: string; role: string; ip: string }) {
    const user = await repository.getStaffById(id);
    if (!user) throw new NotFoundError('Staff user not found.');

    if (user.id === actor.userId) {
      throw new ForbiddenError('You cannot delete your own active administrator account.');
    }

    // Invalidate all active sessions before deletion
    await repository.bumpSessionVersion(id);
    await repository.revokeAllUserSessions(id);

    await repository.deleteStaffUser(id);

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'DELETE_STAFF_USER',
      entity: 'StaffUser',
      entityId: user.id,
      entityName: user.name,
      ip: actor.ip,
      result: 'Success',
      reason: `Revoked and deleted staff user account (${user.email})`,
    });
  }
}

export const usersService = new UsersService();
