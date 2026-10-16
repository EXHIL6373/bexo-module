# BEXO College Panel — Complete API Audit Matrix

Comprehensive audit matrix covering every registered backend route (`/api/v1`), their controller/service mappings, authorization guards, request/response contracts, affected PostgreSQL tables, and verification results.

---

## 1. Authentication & Account Lifecycle (`/api/v1/auth`)

| Method & Route | Controller & Service | Auth & Role | Tenant Scope | Request Validation | Success Response | Error Codes | Tables Affected | Test Coverage | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /api/v1/auth/college-login` | `authController.login` → `authService.login` | Public (Rate Limited) | N/A (Establishes tenant session) | `loginSchema` (`email`, `password`) | `200 OK`: `{ token, user, college }` | 400, 401, 403, 429 | `staff_users`, `colleges` | `authHardeningAndPersistence.test.ts`, `multiTenantSecurity.test.ts` | **PASS** |
| `GET /api/v1/auth/me` | `authController.getMe` → `authService.getMe` | `requireAuth` | Derived from JWT session | None | `200 OK`: `{ user, college }` | 401, 403, 404 | `staff_users`, `colleges` | `authHardeningAndPersistence.test.ts` | **PASS** |
| `POST /api/v1/auth/logout` | `authController.logout` → `authService.logout` | `requireAuth` | Derived from JWT session | None | `200 OK`: `{ message: "Logged out successfully" }` | 401 | None | `multiTenantSecurity.test.ts` | **PASS** |
| `GET /api/v1/auth/invitations/validate` | `authController.validateInvitation` → `authService.validateInvitation` | Public | Token-bound | `validateTokenQuerySchema` (`token`) | `200 OK`: `{ valid: true, invitation }` | 400 | `college_invitations` | `authHardeningAndPersistence.test.ts` | **PASS** |
| `POST /api/v1/auth/activate-account` | `authController.activateAccount` → `authService.activateAccount` | Public | Token-bound | `activateAccountSchema` (`token`, `password`) | `200 OK`: `{ token, user, college }` | 400, 404 | `college_invitations`, `staff_users`, `colleges`, `audit_logs` | `authHardeningAndPersistence.test.ts` | **PASS** |
| `POST /api/v1/auth/forgot-password` | `authController.forgotPassword` → `authService.forgotPassword` | Public (Rate Limited) | Email lookup | `forgotPasswordSchema` (`email`) | `200 OK`: `{ message }` (Generic message) | 400, 429 | `staff_users`, `password_reset_tokens` | `authHardeningAndPersistence.test.ts` | **PASS** |
| `GET /api/v1/auth/reset-password/validate` | `authController.validateResetToken` → `authService.validateResetToken` | Public | Token-bound | `validateTokenQuerySchema` (`token`) | `200 OK`: `{ valid: true, email }` | 400 | `password_reset_tokens` | `authHardeningAndPersistence.test.ts` | **PASS** |
| `POST /api/v1/auth/reset-password` | `authController.resetPassword` → `authService.resetPassword` | Public | Token-bound | `resetPasswordSchema` (`token`, `newPassword`) | `200 OK`: `{ message: "Password updated successfully" }` | 400 | `password_reset_tokens`, `staff_users`, `audit_logs` | `authHardeningAndPersistence.test.ts` | **PASS** |

---

## 2. Institutional College Profile & Settings (`/api/v1/college`)

| Method & Route | Controller & Service | Auth & Role | Tenant Scope | Request Validation | Success Response | Error Codes | Tables Affected | Test Coverage | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/college/profile` | `collegeController.getProfile` → `collegeService.getMyCollege` | `requireAuth` + `requireCollegeTenant` | Authenticated `req.collegeId` | None | `200 OK`: `College` profile & quotas | 401, 403, 404 | `colleges` | `multiTenantSecurity.test.ts` | **PASS** |
| `PATCH /api/v1/college/settings` | `collegeController.updateSettings` → `collegeService.updateSettings` | `requireAuth` + `requirePermission('EDIT_COLLEGE_SETTINGS')` | Authenticated `req.collegeId` | `updateCollegeSettingsSchema` (`address`, `contactEmail`, etc.) | `200 OK`: `College` | 400, 401, 403, 404 | `colleges`, `audit_logs` | `multiTenantSecurity.test.ts` | **PASS** |
| `GET /api/v1/college/agreement` | `collegeController.getAgreement` → `collegeService.getAgreement` | `requireAuth` + `requirePermission('VIEW_AGREEMENT')` | Authenticated `req.collegeId` | None | `200 OK`: `CollegeAgreement` | 401, 403, 404 | `college_agreements` | `requestsAndNotifications.test.ts` | **PASS** |
| `GET /api/v1/college/billing` | `collegeController.getBilling` → `collegeService.getBilling` | `requireAuth` + `requirePermission('VIEW_BILLING')` | Authenticated `req.collegeId` | None | `200 OK`: `PaymentInvoice[]` | 401, 403 | `payment_invoices` | `requestsAndNotifications.test.ts` | **PASS** |

---

## 3. Staff & Role Management (`/api/v1/college/staff`)

| Method & Route | Controller & Service | Auth & Role | Tenant Scope | Request Validation | Success Response | Error Codes | Tables Affected | Test Coverage | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/college/staff` | `staffController.getStaff` → `staffService.getStaff` | `requireAuth` + `requirePermission('MANAGE_STAFF')` | Authenticated `req.collegeId` | None | `200 OK`: `StaffUser[]` | 401, 403 | `staff_users` | `quotaAndStaff.test.ts` | **PASS** |
| `POST /api/v1/college/staff/invite` | `staffController.inviteStaff` → `staffService.inviteStaff` | `requireAuth` + `requirePermission('INVITE_STAFF')` | Authenticated `req.collegeId` | `inviteStaffSchema` (`name`, `email`, `role`, `department`) | `201 Created`: `CollegeInvitation` | 400, 401, 403, 409 | `college_invitations`, `audit_logs` | `staffAndAccountLifecycle.test.ts`, `postgresPersistenceAndCrud.test.ts` | **PASS** |
| `POST /api/v1/college/staff/invitations/:id/resend` | `staffController.resendInvite` → `staffService.resendInvite` | `requireAuth` + `requirePermission('INVITE_STAFF')` | Authenticated `req.collegeId` | Param `:id` | `200 OK`: `CollegeInvitation` | 400, 401, 403, 404 | `college_invitations`, `audit_logs` | `staffAndAccountLifecycle.test.ts`, `postgresPersistenceAndCrud.test.ts` | **PASS** |
| `POST /api/v1/college/staff/invitations/:id/revoke` | `staffController.revokeInvite` → `staffService.revokeInvite` | `requireAuth` + `requirePermission('INVITE_STAFF')` | Authenticated `req.collegeId` | Param `:id` | `200 OK`: `{ message }` | 401, 403, 404 | `college_invitations`, `audit_logs` | `authHardeningAndPersistence.test.ts` | **PASS** |
| `PATCH /api/v1/college/staff/:id/role` | `staffController.updateStaffRole` → `staffService.updateStaffRole` | `requireAuth` + `requirePermission('MANAGE_STAFF')` | Authenticated `req.collegeId` | `updateStaffRoleSchema` (`role`) | `200 OK`: `StaffUser` (session bumped) | 400, 401, 403, 404 | `staff_users`, `audit_logs` | `multiTenantSecurity.test.ts` | **PASS** |
| `POST /api/v1/college/staff/:id/suspend` | `staffController.suspendStaff` → `staffService.suspendStaff` | `requireAuth` + `requirePermission('MANAGE_STAFF')` | Authenticated `req.collegeId` | Param `:id` | `200 OK`: `StaffUser` (session bumped) | 401, 403, 404 | `staff_users`, `audit_logs` | `authHardeningAndPersistence.test.ts` | **PASS** |
| `POST /api/v1/college/staff/:id/activate` | `staffController.activateStaff` → `staffService.activateStaff` | `requireAuth` + `requirePermission('MANAGE_STAFF')` | Authenticated `req.collegeId` | Param `:id` | `200 OK`: `StaffUser` | 401, 403, 404 | `staff_users`, `audit_logs` | `authHardeningAndPersistence.test.ts` | **PASS** |
| `PATCH /api/v1/college/staff/me` | `staffController.updateProfile` → `staffService.updateProfile` | `requireAuth` | Authenticated user | `updateProfileSchema` (`name`, `phone`, `designation`) | `200 OK`: `StaffUser` | 400, 401 | `staff_users`, `audit_logs` | `quotaAndStaff.test.ts` | **PASS** |
| `POST /api/v1/college/staff/change-password` | `staffController.changePassword` → `staffService.changePassword` | `requireAuth` | Authenticated user | `changePasswordSchema` (`currentPassword`, `newPassword`) | `200 OK`: `{ message }` | 400, 401 | `staff_users`, `audit_logs` | `quotaAndStaff.test.ts` | **PASS** |

---

## 4. Student Management & Bulk Rosters (`/api/v1/college/students`)

| Method & Route | Controller & Service | Auth & Role | Tenant Scope | Request Validation | Success Response | Error Codes | Tables Affected | Test Coverage | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/college/students` | `studentsController.getStudents` → `studentsService.getStudents` | `requireAuth` + `requirePermission('VIEW_STUDENTS')` | Authenticated `req.collegeId` | `studentFilterQuerySchema` (`search`, `department`, `page`, `limit`) | `200 OK`: `Student[]`, `meta: { total, page, limit }` | 401, 403 | `students` | `studentManagement.test.ts` | **PASS** |
| `GET /api/v1/college/students/:id` | `studentsController.getStudentById` → `studentsService.getStudentById` | `requireAuth` + `requirePermission('VIEW_STUDENTS')` | Authenticated `req.collegeId` | Param `:id` | `200 OK`: `Student` | 401, 403, 404 | `students` | `studentManagement.test.ts`, `postgresPersistenceAndCrud.test.ts` | **PASS** |
| `POST /api/v1/college/students` | `studentsController.addStudent` → `studentsService.addStudent` | `requireAuth` + `requirePermission('CREATE_STUDENT')` | Authenticated `req.collegeId` | `addStudentSchema` (`name`, `rollNumber`, `email`, `department`) | `201 Created`: `Student` | 400, 401, 403, 409 | `students`, `colleges`, `audit_logs` | `studentManagement.test.ts`, `postgresPersistenceAndCrud.test.ts` | **PASS** |
| `PATCH /api/v1/college/students/:id` | `studentsController.updateStudent` → `studentsService.updateStudent` | `requireAuth` + `requirePermission('UPDATE_STUDENT')` | Authenticated `req.collegeId` | `updateStudentSchema` | `200 OK`: `Student` | 400, 401, 403, 404 | `students`, `audit_logs` | `studentManagement.test.ts`, `postgresPersistenceAndCrud.test.ts` | **PASS** |
| `POST /api/v1/college/students/:id/revoke` | `studentsController.revokeAccess` → `studentsService.revokeAccess` | `requireAuth` + `requirePermission('UPDATE_STUDENT')` | Authenticated `req.collegeId` | `revokeStudentSchema` (`reason`) | `200 OK`: `Student` | 400, 401, 403, 404 | `students`, `student_entitlements`, `colleges`, `audit_logs` | `studentManagement.test.ts`, `postgresPersistenceAndCrud.test.ts` | **PASS** |
| `POST /api/v1/college/students/:id/reactivate` | `studentsController.reactivateAccess` → `studentsService.reactivateAccess` | `requireAuth` + `requirePermission('UPDATE_STUDENT')` | Authenticated `req.collegeId` | Param `:id` | `200 OK`: `Student` | 400, 401, 403, 404 | `students`, `student_entitlements`, `colleges`, `audit_logs` | `studentManagement.test.ts` | **PASS** |
| `POST /api/v1/college/students/bulk-import` | `studentsController.bulkImport` → `studentsService.bulkImport` | `requireAuth` + `requirePermission('IMPORT_STUDENTS')` | Authenticated `req.collegeId` | `bulkImportSchema` (`students[]`) | `200 OK`: `{ importedCount, skippedCount, errors }` | 400, 401, 403 | `students`, `colleges`, `audit_logs` | `studentManagement.test.ts`, `authHardeningAndPersistence.test.ts` | **PASS** |

---

## 5. Provisioning & Entitlements (`/api/v1/college/provisioning` & `/entitlements`)

| Method & Route | Controller & Service | Auth & Role | Tenant Scope | Request Validation | Success Response | Error Codes | Tables Affected | Test Coverage | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/college/provisioning/jobs` | `provisioningController.getJobs` → `provisioningService.getJobs` | `requireAuth` + `requirePermission('VIEW_PROVISIONING')` | Authenticated `req.collegeId` | None | `200 OK`: `ProvisioningJob[]` | 401, 403 | `provisioning_jobs` | `provisioning.test.ts` | **PASS** |
| `GET /api/v1/college/provisioning/jobs/:id` | `provisioningController.getJobById` → `provisioningService.getJobById` | `requireAuth` + `requirePermission('VIEW_PROVISIONING')` | Authenticated `req.collegeId` | Param `:id` | `200 OK`: `ProvisioningJob` | 401, 403, 404 | `provisioning_jobs` | `provisioning.test.ts` | **PASS** |
| `POST /api/v1/college/provisioning/jobs` | `provisioningController.triggerProvisioning` → `provisioningService.triggerProvisioning` | `requireAuth` + `requirePermission('GRANT_STUDENT_ACCESS')` | Authenticated `req.collegeId` | `triggerProvisioningSchema` (`studentIds`, `serviceName`) | `201 Created`: `ProvisioningResult` | 400, 401, 403 | `provisioning_jobs`, `student_entitlements`, `colleges`, `audit_logs` | `provisioning.test.ts` | **PASS** |
| `POST /api/v1/college/provisioning/jobs/:id/retry` | `provisioningController.retryJob` → `provisioningService.retryJob` | `requireAuth` + `requirePermission('RETRY_FAILED_RECORDS')` | Authenticated `req.collegeId` | Param `:id` | `200 OK`: `{ success, retriedCount }` | 401, 403, 404 | `provisioning_jobs`, `student_entitlements`, `audit_logs` | `provisioning.test.ts` | **PASS** |
| `GET /api/v1/college/entitlements` | `provisioningController.getEntitlements` → `provisioningService.getEntitlements` | `requireAuth` + `requirePermission('VIEW_SERVICES')` | Authenticated `req.collegeId` | None | `200 OK`: `StudentEntitlement[]` | 401, 403 | `student_entitlements` | `provisioning.test.ts` | **PASS** |

---

## 6. Requests, Notifications, Tasks & Reports

| Method & Route | Controller & Service | Auth & Role | Tenant Scope | Request Validation | Success Response | Error Codes | Tables Affected | Test Coverage | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/college/requests` | `requestsController.getRequests` → `requestsService.getRequests` | `requireAuth` | Authenticated `req.collegeId` | None | `200 OK`: `ApprovalRequest[]` | 401, 403 | `approval_requests` | `requestsAndNotifications.test.ts` | **PASS** |
| `POST /api/v1/college/requests` | `requestsController.submitRequest` → `requestsService.submitRequest` | `requireAuth` + `requirePermission('SUBMIT_REQUESTS')` | Authenticated `req.collegeId` | `submitRequestSchema` (`type`, `priority`, `details`) | `201 Created`: `ApprovalRequest` | 400, 401, 403 | `approval_requests`, `audit_logs` | `requestsAndNotifications.test.ts` | **PASS** |
| `GET /api/v1/college/notifications` | `notificationsController.getNotifications` | `requireAuth` | Authenticated `req.collegeId` | None | `200 OK`: `NotificationItem[]` | 401, 403 | `notifications` | `requestsAndNotifications.test.ts` | **PASS** |
| `PATCH /api/v1/college/notifications/:id/read` | `notificationsController.markAsRead` | `requireAuth` | Authenticated `req.collegeId` | Param `:id` | `200 OK`: `{ message }` | 401, 403 | `notifications` | `requestsAndNotifications.test.ts` | **PASS** |
| `POST /api/v1/college/notifications/read-all` | `notificationsController.markAllAsRead` | `requireAuth` | Authenticated `req.collegeId` | None | `200 OK`: `{ message }` | 401, 403 | `notifications` | `requestsAndNotifications.test.ts` | **PASS** |
| `GET /api/v1/college/announcements` | `notificationsController.getAnnouncements` | `requireAuth` | College / Global (`NULL` or `req.collegeId`) | None | `200 OK`: `CollegeAnnouncement[]` | 401, 403 | `college_announcements` | `requestsAndNotifications.test.ts` | **PASS** |
| `GET /api/v1/college/tasks` | `notificationsController.getTasks` | `requireAuth` | Authenticated `req.collegeId` | None | `200 OK`: `CollegeTask[]` | 401, 403 | `college_tasks` | `requestsAndNotifications.test.ts` | **PASS** |
| `PATCH /api/v1/college/tasks/:id/toggle` | `notificationsController.toggleTask` | `requireAuth` | Authenticated `req.collegeId` | Param `:id` | `200 OK`: `CollegeTask` | 401, 403, 404 | `college_tasks` | `requestsAndNotifications.test.ts` | **PASS** |
| `GET /api/v1/college/activity` | `activityController.getActivityLogs` | `requireAuth` + `requirePermission('VIEW_ACTIVITY')` | Authenticated `req.collegeId` | None | `200 OK`: `AuditLogItem[]` | 401, 403 | `audit_logs` | `requestsAndNotifications.test.ts` | **PASS** |
| `GET /api/v1/college/reports/export` | `activityController.exportReport` | `requireAuth` + `requirePermission('EXPORT_REPORTS')` | Authenticated `req.collegeId` | Query `?type` | `200 OK`: `{ downloadUrl, csvContent }` | 400, 401, 403 | `students`, `provisioning_jobs`, `student_entitlements` | `requestsAndNotifications.test.ts` | **PASS** |

---

## 7. Central Corporate Administration (`/api/v1/corporate`)

| Method & Route | Controller & Service | Auth & Role | Tenant Scope | Request Validation | Success Response | Error Codes | Tables Affected | Test Coverage | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/corporate/colleges` | Inline handler in router | `requireRole(['super_admin', 'admin', 'ops'])` | Global | None | `200 OK`: `College[]` | 401, 403 | `colleges` | `multiTenantSecurity.test.ts` | **PASS** |
| `POST /api/v1/corporate/colleges/:id/suspend` | Inline handler in router | `requireRole(['super_admin', 'admin', 'ops'])` | Target college `:id` | `params: collegeIdParamSchema`, `body: suspendCollegeSchema` | `200 OK`: `College` | 400, 401, 403, 404 | `colleges`, `audit_logs` | `corporateOperations.test.ts` | **PASS** |
| `POST /api/v1/corporate/colleges/:id/reactivate` | Inline handler in router | `requireRole(['super_admin', 'admin', 'ops'])` | Target college `:id` | `params: collegeIdParamSchema` | `200 OK`: `College` | 400, 401, 403, 404 | `colleges`, `audit_logs` | `corporateOperations.test.ts` | **PASS** |
| `PATCH /api/v1/corporate/colleges/:id/quota` | Inline handler in router | `requireRole(['super_admin', 'admin', 'ops'])` | Target college `:id` | `params: collegeIdParamSchema`, `body: updateCorporateQuotaSchema` | `200 OK`: `College` | 400, 401, 403, 404 | `colleges`, `quota_history`, `audit_logs` | `corporateOperations.test.ts` | **PASS** |
| `POST /api/v1/corporate/requests/:id/review` | Inline handler in router | `requireRole(['super_admin', 'admin', 'ops'])` | Target request `:id` | `params: requestIdParamSchema`, `body: reviewRequestSchema` | `200 OK`: `ApprovalRequest` | 400, 401, 403, 404 | `approval_requests`, `colleges`, `quota_history`, `audit_logs` | `authHardeningAndPersistence.test.ts`, `corporateOperations.test.ts` | **PASS** |

---

## 8. Health & Observability Probes

| Method & Route | Controller & Service | Auth & Role | Tenant Scope | Request Validation | Success Response | Error Codes | Tables Affected | Test Coverage | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/health/live` | `healthRoutes` inline | Public | Global | None | `200 OK`: `{ status: 'alive', uptimeSeconds }` | None | None | `authHardeningAndPersistence.test.ts` | **PASS** |
| `GET /api/v1/health/ready` | `healthRoutes` inline | Public | Global | None | `200 OK`: `{ status: 'ready', database: 'connected' }` | 503 | Active `SELECT 1` query | `authHardeningAndPersistence.test.ts` | **PASS** |
| `GET /health` | `app.ts` root handler | Public | Global | None | `200 OK`: `{ status: 'healthy', database: 'connected' }` | 503 | Active `SELECT 1` query | `requestsAndNotifications.test.ts` | **PASS** |

---

## 9. Frontend Service Mapping Analysis & Discrepancies

1. **Route Alignment**:
   - 100% of the routes invoked by the frontend services (`activityService`, `authService`, `collegeService`, `notificationsService`, `provisioningService`, `requestsService`, `staffService`, `studentsService`) map 1:1 to backend routes.
2. **Method & Path Verification**:
   - All HTTP verbs (`GET`, `POST`, `PATCH`) match frontend service specifications.
3. **Response Envelopes**:
   - Every endpoint returns `{ success: true, data: T, message?: string, meta?: { total, page, limit } }`, matching `ApiResponse<T>` in `frontend/src/services/apiClient.ts`.
4. **HTML Spec v2.4.0 Aliases**:
   - Additional compatibility prefixes (`/api/college/auth`, `/api/college`, `/api/admin`, `/api`) are mounted in `src/app.ts` for dual-compatibility with legacy client revisions.
