import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { requireRole, requireCorporateStaff } from '../../middlewares/permissions';
import { store } from '../../db/store';
import { sendSuccess } from '../../shared/utils/response';
import { NotFoundError, ValidationError, ForbiddenError } from '../../shared/errors/AppError';
import { validateRequest } from '../../shared/validation/validateRequest';
import { generateSecureToken, hashToken } from '../../shared/security/tokens';
import { emailService } from '../../shared/email/emailService';
import { getInvitationEmailTemplate } from '../../shared/email/templates';
import {
  collegeIdParamSchema,
  requestIdParamSchema,
  studentIdParamSchema,
  staffIdParamSchema,
  templateIdParamSchema,
  suspendCollegeSchema,
  updateCorporateQuotaSchema,
  reviewRequestSchema,
  approveRejectSchema,
  createCollegeSchema,
  createStudentSchema,
  revokeStudentSchema,
  provisioningBatchSchema,
  createStaffSchema,
  createInvitationSchema,
  revokeInvitationSchema,
  createTemplateSchema,
} from './corporate.schemas';

const router = Router();

// Strictly guard corporate boundary with corporate administrative roles
router.use(requireAuth, requireRole(['super_admin', 'admin', 'ops', 'finance', 'support']), requireCorporateStaff);

// =========================================================================
// 1. COLLEGE DIRECTORY & LIFECYCLE
// =========================================================================

// List colleges with query filtering
router.get('/colleges', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status, type, page, limit } = req.query;
    let list = await store.getAllColleges();

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter((c: any) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q))
      );
    }

    if (status && typeof status === 'string') {
      list = list.filter((c: any) => c.status.toLowerCase() === status.toLowerCase());
    }

    if (type && typeof type === 'string') {
      list = list.filter((c: any) => c.type.toLowerCase() === type.toLowerCase());
    }

    const total = list.length;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;

    return sendSuccess(res, list, undefined, { total, page: pageNum, limit: limitNum });
  } catch (error) {
    next(error);
  }
});

// Fetch single college profile
router.get('/colleges/:id', validateRequest({ params: collegeIdParamSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const college = await store.getCollegeById(req.params.id as string);
    if (!college) throw new NotFoundError('College not found.');
    return sendSuccess(res, college);
  } catch (error) {
    next(error);
  }
});

// Onboard / Register new college
router.post('/colleges', validateRequest({ body: createCollegeSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await store.getAllColleges();
    const codeConflict = existing.find((c: any) => c.code.toLowerCase() === (req.body.code || '').toLowerCase());
    if (codeConflict) {
      throw new ValidationError(`College code '${req.body.code}' is already registered.`);
    }

    const created = await store.createCollege(req.body);

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId: created.id,
      actorStaffId: req.user!.userId,
      actorName: req.user!.name || req.user!.email,
      actorRole: req.user!.role,
      action: 'ONBOARD_COLLEGE',
      entity: 'College',
      entityId: created.id,
      entityName: created.name,
      ip: req.ip || '127.0.0.1',
      result: 'Success',
      reason: 'Onboarded new institution via BEXO Corporate Console',
    });

    return sendSuccess(res, created, 'College onboarded successfully.', undefined, 201);
  } catch (error) {
    next(error);
  }
});

// Update college profile
router.patch('/colleges/:id', validateRequest({ params: collegeIdParamSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const college = await store.getCollegeById(req.params.id as string);
    if (!college) throw new NotFoundError('College not found.');

    const updated = await store.updateCollege(req.params.id as string, req.body);

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId: req.params.id as string,
      actorStaffId: req.user!.userId,
      actorName: req.user!.name || req.user!.email,
      actorRole: req.user!.role,
      action: 'UPDATE_COLLEGE_PROFILE',
      entity: 'College',
      entityId: college.id,
      entityName: college.name,
      ip: req.ip || '127.0.0.1',
      result: 'Success',
      reason: 'Updated college profile details',
    });

    return sendSuccess(res, updated, 'College profile updated successfully.');
  } catch (error) {
    next(error);
  }
});

// Suspend college (freezes dashboard access, strictly preserves data)
router.post(
  '/colleges/:id/suspend',
  validateRequest({ params: collegeIdParamSchema, body: suspendCollegeSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body;
      const college = await store.getCollegeById(req.params.id as string);
      if (!college) throw new NotFoundError('College not found.');

      const updated = await store.updateCollege(req.params.id as string, {
        status: 'Suspended',
        dashboardAccess: false,
        suspensionReason: reason || 'Suspended by central corporate administration.',
        suspendedAt: new Date().toISOString(),
      });

      await store.createAuditLog({
        id: `aud-${Date.now()}`,
        collegeId: req.params.id as string,
        actorStaffId: req.user!.userId,
        actorName: req.user!.name || req.user!.email,
        actorRole: req.user!.role,
        action: 'SUSPEND_COLLEGE',
        entity: 'College',
        entityId: college.id,
        entityName: college.name,
        ip: req.ip || '127.0.0.1',
        result: 'Success',
        reason: reason || 'Suspended by central corporate administration.',
      });

      return sendSuccess(res, updated, 'College suspended successfully.');
    } catch (error) {
      next(error);
    }
  }
);

// Reactivate college
router.post(
  '/colleges/:id/reactivate',
  validateRequest({ params: collegeIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const college = await store.getCollegeById(req.params.id as string);
      if (!college) throw new NotFoundError('College not found.');

      const updated = await store.updateCollege(req.params.id as string, {
        status: 'Active',
        dashboardAccess: true,
        suspensionReason: null,
        reactivatedAt: new Date().toISOString(),
      });

      await store.createAuditLog({
        id: `aud-${Date.now()}`,
        collegeId: req.params.id as string,
        actorStaffId: req.user!.userId,
        actorName: req.user!.name || req.user!.email,
        actorRole: req.user!.role,
        action: 'REACTIVATE_COLLEGE',
        entity: 'College',
        entityId: college.id,
        entityName: college.name,
        ip: req.ip || '127.0.0.1',
        result: 'Success',
        reason: req.body?.reason || 'Cleared suspension and restored dashboard access',
      });

      return sendSuccess(res, updated, 'College reactivated successfully.');
    } catch (error) {
      next(error);
    }
  }
);

// College Lifecycle Synchronization (Downstream endpoint for BEXO Admin Panel)
router.post(
  '/colleges/:id/lifecycle-sync',
  validateRequest({ params: collegeIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const collegeId = req.params.id as string;
      const { status, dashboardAccess, quotaAllocated, services, reason, version } = req.body;

      // Scope authorization on M2M service tokens
      if (
        req.user?.scope &&
        Array.isArray(req.user.scope) &&
        req.user.scope.length > 0 &&
        !req.user.scope.includes('lifecycle:sync') &&
        !req.user.scope.includes('*')
      ) {
        throw new ForbiddenError('Service token lacks required scope: lifecycle:sync');
      }

      const college = await store.getCollegeById(collegeId);
      if (!college) {
        throw new NotFoundError(`College '${collegeId}' not found for lifecycle synchronization.`);
      }

      const currentVersion = college.lifecycleVersion ?? 0;

      // Priority 2: Stale lifecycle event prevention & idempotent duplicate delivery
      if (version !== undefined && typeof version === 'number') {
        if (version < currentVersion) {
          // Stale older event: Safely ignore to prevent overwriting newer state
          return sendSuccess(res, {
            collegeId,
            status: college.status,
            dashboardAccess: college.dashboardAccess,
            quotaAllocated: college.quotaAllocated,
            lifecycleVersion: currentVersion,
            applied: false,
            reason: `Stale lifecycle event version (${version}) rejected against current version (${currentVersion}).`,
            synchronizedAt: new Date().toISOString(),
          });
        }

        if (version === currentVersion) {
          // Idempotent duplicate delivery: Return confirmed current state without duplicate side effects
          return sendSuccess(res, {
            collegeId,
            status: college.status,
            dashboardAccess: college.dashboardAccess,
            quotaAllocated: college.quotaAllocated,
            lifecycleVersion: currentVersion,
            applied: true,
            idempotentDuplicate: true,
            synchronizedAt: new Date().toISOString(),
          });
        }
      }

      const updates: any = {};
      if (version !== undefined) {
        updates.lifecycleVersion = version;
      }
      if (status) {
        updates.status = status;
        updates.dashboardAccess = dashboardAccess !== undefined ? dashboardAccess : (status === 'Active');
        if (status === 'Suspended') {
          updates.suspensionReason = reason || 'Suspended by central corporate administration.';
          updates.suspendedAt = new Date().toISOString();
        } else if (status === 'Active') {
          updates.suspensionReason = null;
          updates.reactivatedAt = new Date().toISOString();
        }
      }

      if (services) {
        updates.services = services;
      }

      const updated = await store.updateCollege(collegeId, updates);

      if (quotaAllocated !== undefined && quotaAllocated !== college.quotaAllocated) {
        await store.updateQuota(
          collegeId,
          Number(quotaAllocated),
          reason || 'Quota synchronized from BEXO Corporate Central Admin',
          req.user?.name || 'BEXO Corporate Orchestrator'
        );
      }

      await store.createAuditLog({
        id: `aud-${Date.now()}`,
        collegeId,
        actorStaffId: req.user?.userId || 'admin-service-identity',
        actorName: req.user?.name || 'BEXO Corporate Sync',
        actorRole: req.user?.role || 'corporate_sync',
        action: 'LIFECYCLE_SYNC',
        entity: 'College',
        entityId: collegeId,
        entityName: college.name,
        ip: req.ip || '127.0.0.1',
        result: 'Success',
        reason: reason || `Synchronized lifecycle status (${status || college.status}) and quota (${quotaAllocated ?? college.quotaAllocated})`,
      });

      return sendSuccess(res, {
        collegeId,
        status: updated.status,
        dashboardAccess: updated.dashboardAccess,
        quotaAllocated: quotaAllocated ?? college.quotaAllocated,
        lifecycleVersion: updated.lifecycleVersion ?? version,
        applied: true,
        synchronizedAt: new Date().toISOString(),
      }, 'College lifecycle synchronized successfully.');
    } catch (error) {
      next(error);
    }
  }
);

// Quota adjustment — POST (Admin frontend contract returns QuotaHistoryEntry)
router.post(
  '/colleges/:id/quota',
  validateRequest({ params: collegeIdParamSchema, body: updateCorporateQuotaSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { allocated, reason } = req.body;
      const college = await store.getCollegeById(req.params.id as string);
      if (!college) throw new NotFoundError('College not found.');

      await store.updateQuota(
        req.params.id as string,
        Number(allocated),
        reason || 'Quota adjustment approved by corporate admin',
        req.user!.name || req.user!.email
      );

      const history = await store.getQuotaHistory(req.params.id as string);
      const latest = history[history.length - 1];

      return sendSuccess(res, latest, 'Quota allocation updated successfully.');
    } catch (error) {
      next(error);
    }
  }
);

// Quota adjustment — PATCH (Preserves existing integration test suite contract)
router.patch(
  '/colleges/:id/quota',
  validateRequest({ params: collegeIdParamSchema, body: updateCorporateQuotaSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { allocated, reason } = req.body;
      const college = await store.getCollegeById(req.params.id as string);
      if (!college) throw new NotFoundError('College not found.');

      const updated = await store.updateQuota(
        req.params.id as string,
        Number(allocated),
        reason || 'Quota adjustment approved by corporate admin',
        req.user!.name || req.user!.email
      );

      return sendSuccess(res, updated, 'Institutional quota adjusted.');
    } catch (error) {
      next(error);
    }
  }
);

// Quota history
router.get('/colleges/:id/quota-history', validateRequest({ params: collegeIdParamSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await store.getQuotaHistory(req.params.id as string);
    return sendSuccess(res, history);
  } catch (error) {
    next(error);
  }
});

router.get('/colleges/quota-history', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await store.getQuotaHistory();
    return sendSuccess(res, history);
  } catch (error) {
    next(error);
  }
});

// Toggle college service entitlement
router.post('/colleges/:id/services/:serviceId/toggle', validateRequest({ params: collegeIdParamSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { enabled } = req.body;
    const college = await store.getCollegeById(req.params.id as string);
    if (!college) throw new NotFoundError('College not found.');

    const updated = await store.toggleCollegeService(req.params.id as string, req.params.serviceId as string, Boolean(enabled));
    return sendSuccess(res, updated, 'College service entitlement updated.');
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// 2. STUDENT OVERSIGHT
// =========================================================================

router.get('/students', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await store.getAllStudents(req.query);
    return sendSuccess(res, list, undefined, { total: list.length, page: 1, limit: 50 });
  } catch (error) {
    next(error);
  }
});

router.get('/students/:id', validateRequest({ params: studentIdParamSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await store.getStudentById(req.params.id as string);
    if (!student) throw new NotFoundError('Student not found.');
    return sendSuccess(res, student);
  } catch (error) {
    next(error);
  }
});

router.post('/students', validateRequest({ body: createStudentSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await store.getStudentByRollNumber(req.body.collegeId, req.body.rollNumber);
    if (existing) {
      throw new ValidationError(`Roll number '${req.body.rollNumber}' is already registered in this institution.`);
    }

    const college = await store.getCollegeById(req.body.collegeId);
    if (!college) throw new NotFoundError('Institutional college not found.');

    const newStudent = {
      id: `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      collegeId: req.body.collegeId,
      collegeName: college.name,
      name: req.body.name,
      rollNumber: req.body.rollNumber,
      email: req.body.email,
      department: req.body.department,
      course: req.body.course || 'B.E.',
      batch: req.body.batch || '2023-2027',
      enrolledYear: req.body.enrolledYear || 2023,
      accessStatus: 'Active',
      services: ['BEXO Portfolio', 'BEXO Templates', 'ATS Resume Engine'],
      entitlementId: `ent-${Date.now()}`,
      resumeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };

    const created = await store.createStudent(newStudent);
    return sendSuccess(res, created, 'Student created successfully.', undefined, 201);
  } catch (error) {
    next(error);
  }
});

router.post('/students/:id/revoke', validateRequest({ params: studentIdParamSchema, body: revokeStudentSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const student = await store.getStudentById(req.params.id as string);
    if (!student) throw new NotFoundError('Student not found.');

    const updated = await store.revokeStudent(req.params.id as string, reason);

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId: student.collegeId,
      actorStaffId: req.user!.userId,
      actorName: req.user!.name || req.user!.email,
      actorRole: req.user!.role,
      action: 'REVOKE_STUDENT_ACCESS',
      entity: 'Student',
      entityId: student.id,
      entityName: student.name,
      ip: req.ip || '127.0.0.1',
      result: 'Success',
      reason,
    });

    return sendSuccess(res, updated, 'Student service access revoked.');
  } catch (error) {
    next(error);
  }
});

router.post('/students/:id/reactivate', validateRequest({ params: studentIdParamSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await store.getStudentById(req.params.id as string);
    if (!student) throw new NotFoundError('Student not found.');

    const updated = await store.reactivateStudent(req.params.id as string);

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId: student.collegeId,
      actorStaffId: req.user!.userId,
      actorName: req.user!.name || req.user!.email,
      actorRole: req.user!.role,
      action: 'REACTIVATE_STUDENT_ACCESS',
      entity: 'Student',
      entityId: student.id,
      entityName: student.name,
      ip: req.ip || '127.0.0.1',
      result: 'Success',
      reason: 'Student access restored by corporate admin',
    });

    return sendSuccess(res, updated, 'Student service access reactivated.');
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// 3. BULK PROVISIONING ENGINE
// =========================================================================

router.get('/provisioning/jobs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobs = await store.getAllProvisioningJobs(req.query.collegeId as string);
    return sendSuccess(res, jobs);
  } catch (error) {
    next(error);
  }
});

router.get('/provisioning/jobs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await store.getProvisioningJobById(req.params.id as string, '');
    if (!job) throw new NotFoundError('Provisioning job not found.');
    return sendSuccess(res, job);
  } catch (error) {
    next(error);
  }
});

router.post('/provisioning/batch', validateRequest({ body: provisioningBatchSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await store.createProvisioningBatch(req.body, req.user!.name || req.user!.email);
    return sendSuccess(res, job, 'Provisioning batch dispatched successfully.', undefined, 201);
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// 4. APPROVAL CENTER & REQUESTS LEDGER
// =========================================================================

router.get('/approvals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const approvals = await store.getAllApprovals(req.query.status as string);
    return sendSuccess(res, approvals);
  } catch (error) {
    next(error);
  }
});

router.post('/approvals/:id/approve', validateRequest({ params: requestIdParamSchema, body: approveRejectSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { decisionReason } = req.body;
    const request = await store.getRequestById(req.params.id as string);
    if (!request) throw new NotFoundError('Request not found.');

    const updated = await store.approveRequest(req.params.id as string, decisionReason, req.user!.name || req.user!.email);

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId: request.collegeId,
      actorStaffId: req.user!.userId,
      actorName: req.user!.name || req.user!.email,
      actorRole: req.user!.role,
      action: 'APPROVE_OPERATIONAL_REQUEST',
      entity: 'ApprovalRequest',
      entityId: request.id,
      entityName: request.details?.title || request.type,
      ip: req.ip || '127.0.0.1',
      result: 'Approved',
      reason: decisionReason,
    });

    return sendSuccess(res, updated, 'Operational request approved.');
  } catch (error) {
    next(error);
  }
});

router.post('/approvals/:id/reject', validateRequest({ params: requestIdParamSchema, body: approveRejectSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { decisionReason } = req.body;
    const request = await store.getRequestById(req.params.id as string);
    if (!request) throw new NotFoundError('Request not found.');

    const updated = await store.rejectRequest(req.params.id as string, decisionReason, req.user!.name || req.user!.email);

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId: request.collegeId,
      actorStaffId: req.user!.userId,
      actorName: req.user!.name || req.user!.email,
      actorRole: req.user!.role,
      action: 'REJECT_OPERATIONAL_REQUEST',
      entity: 'ApprovalRequest',
      entityId: request.id,
      entityName: request.details?.title || request.type,
      ip: req.ip || '127.0.0.1',
      result: 'Rejected',
      reason: decisionReason,
    });

    return sendSuccess(res, updated, 'Operational request rejected.');
  } catch (error) {
    next(error);
  }
});

router.post('/approvals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newReq = await store.createRequest({
      ...req.body,
      id: `req-${Date.now()}`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    });
    return sendSuccess(res, newReq, 'Operational request submitted successfully.', undefined, 201);
  } catch (error) {
    next(error);
  }
});

// Dual compatibility alias: POST /requests/:id/review
router.post(
  '/requests/:id/review',
  validateRequest({ params: requestIdParamSchema, body: reviewRequestSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, decisionReason } = req.body;
      const request = await store.getRequestById(req.params.id as string);
      if (!request) throw new NotFoundError('Request not found.');

      if (request.status !== 'Pending') {
        throw new ValidationError(`Request has already been processed (Current status: '${request.status}').`);
      }

      let updated;
      if (status === 'Approved') {
        updated = await store.approveRequest(req.params.id as string, decisionReason, req.user!.name || req.user!.email);
      } else {
        updated = await store.rejectRequest(req.params.id as string, decisionReason, req.user!.name || req.user!.email);
      }

      await store.createAuditLog({
        id: `aud-${Date.now()}`,
        collegeId: request.collegeId,
        actorStaffId: req.user!.userId,
        actorName: req.user!.name || req.user!.email,
        actorRole: req.user!.role,
        action: 'REVIEW_OPERATIONAL_REQUEST',
        entity: 'ApprovalRequest',
        entityId: request.id,
        entityName: request.details?.title || request.type,
        ip: req.ip || '127.0.0.1',
        result: status,
        reason: decisionReason,
      });

      return sendSuccess(res, updated, `Request status updated to ${status}.`);
    } catch (error) {
      next(error);
    }
  }
);

// =========================================================================
// 5. PLATFORM SERVICES CATALOG
// =========================================================================

router.get('/services', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await store.getAllServices();
    return sendSuccess(res, services);
  } catch (error) {
    next(error);
  }
});

router.post('/services/:id/toggle-global', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await store.togglePlatformServiceGlobal(req.params.id as string);
    return sendSuccess(res, service, 'Global service availability updated.');
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// 6. PAYMENTS & FINANCE
// =========================================================================

router.get('/payments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoices = await store.getAllInvoices(req.query.collegeId as string);
    return sendSuccess(res, invoices);
  } catch (error) {
    next(error);
  }
});

router.post('/payments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await store.createPaymentInvoice(req.body);
    return sendSuccess(res, invoice, 'Payment invoice recorded successfully.', undefined, 201);
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// 7. NOTIFICATIONS CENTER
// =========================================================================

router.get('/notifications', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await store.getAllAdminNotifications();
    return sendSuccess(res, notifications);
  } catch (error) {
    next(error);
  }
});

router.post('/notifications/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await store.markNotificationRead(req.params.id as string, '');
    return sendSuccess(res, { success: true }, 'Notification marked as read.');
  } catch (error) {
    next(error);
  }
});

router.post('/notifications/mark-all-read', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await store.markAllNotificationsRead('');
    return sendSuccess(res, { success: true }, 'All notifications marked as read.');
  } catch (error) {
    next(error);
  }
});

router.delete('/notifications/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await store.deleteNotification(req.params.id as string);
    return sendSuccess(res, { success: true }, 'Notification dismissed.');
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// 8. AUDIT & COMPLIANCE
// =========================================================================

router.get('/audit/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entity, page, limit } = req.query;
    const logs = await store.getAllAuditLogs(entity as string, Number(page) || 1, Number(limit) || 50);
    return sendSuccess(res, logs);
  } catch (error) {
    next(error);
  }
});

router.post('/audit/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = await store.createAuditLog({
      ...req.body,
      id: req.body.id || `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorStaffId: req.user!.userId,
      actorName: req.user!.name || req.user!.email,
      actorRole: req.user!.role,
      ip: req.ip || '127.0.0.1',
    });
    return sendSuccess(res, log, 'Audit log recorded.', undefined, 201);
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// 9. SYSTEM HEALTH & OPERATIONS
// =========================================================================

router.get('/system/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await store.getSystemHealth();
    return sendSuccess(res, metrics);
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// 10. USERS, STAFF & INVITATIONS
// =========================================================================

router.get('/users/staff', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await store.getAllStaffUsers(req.query.collegeId as string);
    return sendSuccess(res, staff);
  } catch (error) {
    next(error);
  }
});

router.post('/users/staff', validateRequest({ body: createStaffSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await store.getStaffByEmail(req.body.email);
    if (existing) {
      throw new ValidationError(`Staff email '${req.body.email}' is already registered.`);
    }

    const created = await store.createStaffUser(req.body);
    return sendSuccess(res, created, 'Staff user created successfully.', undefined, 201);
  } catch (error) {
    next(error);
  }
});

router.patch('/users/staff/:id', validateRequest({ params: staffIdParamSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await store.updateStaffUser(req.params.id as string, req.body);
    return sendSuccess(res, updated, 'Staff user profile updated successfully.');
  } catch (error) {
    next(error);
  }
});

router.delete('/users/staff/:id', validateRequest({ params: staffIdParamSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await store.deleteStaffUser(req.params.id as string);
    return sendSuccess(res, { success: true }, 'Staff user revoked.');
  } catch (error) {
    next(error);
  }
});

router.post('/invitations', validateRequest({ body: createInvitationSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = generateSecureToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const college = req.body.collegeId ? await store.getCollegeById(req.body.collegeId) : null;

    const newInvite = {
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      token,
      email: req.body.email.trim().toLowerCase(),
      fullName: req.body.fullName,
      phone: req.body.phone,
      designation: req.body.designation || 'Institutional Administrator',
      collegeId: req.body.collegeId || 'clg-central',
      collegeName: college ? college.name : 'BEXO Corporate Administration',
      role: req.body.role,
      invitedBy: req.user!.name || req.user!.email,
      invitedByRole: req.user!.role,
      invitedAt: new Date().toISOString(),
      expiresAt,
      status: 'INVITED',
    };

    await store.createInvitation(newInvite);
    // Also save hash for dual-compatibility validation
    await store.createInvitation({ ...newInvite, id: `${newInvite.id}-hash`, token: tokenHash });

    const tmpl = getInvitationEmailTemplate(newInvite.fullName, newInvite.collegeName, newInvite.role, token);
    await emailService.sendEmail({
      to: newInvite.email,
      subject: tmpl.subject,
      html: tmpl.html,
    });

    return sendSuccess(res, newInvite, 'Cryptographic invitation dispatched successfully.', undefined, 201);
  } catch (error) {
    next(error);
  }
});

router.post('/invitations/:id/resend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invite = await store.getInvitationById(req.params.id as string);
    if (!invite) throw new NotFoundError('Invitation not found.');

    const token = generateSecureToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const updated = await store.updateInvitation(req.params.id as string, { token, expiresAt, status: 'INVITED' });
    await store.createInvitation({ ...updated, id: `${updated.id}-hash`, token: tokenHash });

    const tmplResent = getInvitationEmailTemplate(updated.fullName, updated.collegeName, updated.role, token);
    await emailService.sendEmail({
      to: updated.email,
      subject: tmplResent.subject,
      html: tmplResent.html,
    });

    return sendSuccess(res, updated, 'Invitation resent successfully.');
  } catch (error) {
    next(error);
  }
});

router.post('/invitations/:id/revoke', validateRequest({ body: revokeInvitationSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const invite = await store.getInvitationById(req.params.id as string);
    if (!invite) throw new NotFoundError('Invitation not found.');

    await store.updateInvitation(req.params.id as string, {
      status: 'REVOKED',
      revokedAt: new Date().toISOString(),
      revokedReason: reason,
    });

    return sendSuccess(res, { success: true }, 'Invitation revoked.');
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// 11. APP TEMPLATES CATALOG
// =========================================================================

router.get('/templates', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await store.getAllTemplates();
    return sendSuccess(res, templates);
  } catch (error) {
    next(error);
  }
});

router.post('/templates', validateRequest({ body: createTemplateSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await store.createTemplate({
      ...req.body,
      author: req.body.author || req.user!.name || req.user!.email,
    });
    return sendSuccess(res, template, 'Template created successfully.', undefined, 201);
  } catch (error) {
    next(error);
  }
});

router.patch('/templates/:id', validateRequest({ params: templateIdParamSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await store.getTemplateById(req.params.id as string);
    if (!template) throw new NotFoundError('Template not found.');

    const updated = await store.updateTemplate(req.params.id as string, req.body);
    return sendSuccess(res, updated, 'Template updated successfully.');
  } catch (error) {
    next(error);
  }
});

router.delete('/templates/:id', validateRequest({ params: templateIdParamSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await store.deleteTemplate(req.params.id as string);
    return sendSuccess(res, { success: true }, 'Template removed.');
  } catch (error) {
    next(error);
  }
});

router.post('/templates/:id/toggle-publish', validateRequest({ params: templateIdParamSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await store.toggleTemplatePublish(req.params.id as string);
    return sendSuccess(res, template, 'Template publication state toggled.');
  } catch (error) {
    next(error);
  }
});

router.post('/templates/:id/toggle-featured', validateRequest({ params: templateIdParamSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await store.toggleTemplateFeatured(req.params.id as string);
    return sendSuccess(res, template, 'Template featured flag toggled.');
  } catch (error) {
    next(error);
  }
});

export const corporateRoutes = router;
