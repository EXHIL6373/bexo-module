# BEXO College Admin Backend — Database Architecture

The backend utilizes PostgreSQL with Drizzle ORM and Drizzle Kit migrations.

---

## 1. Schema Mapping & Tables

### 1. `colleges`
Stores institutional entities with lifecycle and quota counters.
- `id` (text, PK): Unique institutional identifier (e.g. `clg-psg-01`).
- `name` (text, NOT NULL): Official name of the college.
- `code` (text, UNIQUE): Institutional code (e.g. `PSGCT`).
- `slug` (text, UNIQUE): URL-safe normalized slug (e.g. `psgtech`).
- `type` (text): Engineering, Arts & Science, Autonomous University, etc.
- `affiliation` (text): Parent university.
- `established_year` (integer).
- `address`, `city`, `district`, `state`, `pincode`, `country`.
- `primary_contact` (jsonb): `{ name, designation, email, mobile, alternateContact }`.
- `admin_contact` (jsonb): `{ name, email, mobile }`.
- `coordinators` (jsonb): Department coordinator records.
- `status` (text): `'Active'`, `'Pending'`, `'Suspended'`, `'Expired'`.
- `dashboard_access` (boolean): Master access gate.
- `total_students` (integer), `active_students` (integer).
- `quota_allocated` (integer), `quota_used` (integer).
- `warning_threshold` (integer), `critical_threshold` (integer).
- `department_limits` (jsonb): Seat caps per department.
- `services` (jsonb): Enabled BEXO platform services.
- `suspension_reason` (text), `suspended_at` (timestamp), `reactivated_at` (timestamp).
- `created_at`, `updated_at`, `last_activity_at`.

### 2. `staff_users`
Authorized institutional personnel.
- `id` (text, PK): User identifier (e.g. `usr-psg-admin`).
- `college_id` (text, FK -> `colleges.id`).
- `college_name` (text).
- `name`, `email` (UNIQUE), `phone`.
- `role`: `'college_admin'`, `'college_coordinator'`, `'college_staff'`, or corporate roles.
- `department`, `designation`.
- `is_active` (boolean), `account_status`: `'INVITED'`, `'ACTIVE'`, `'SUSPENDED'`, `'REVOKED'`.
- `password_hash` (text, bcrypt 10 rounds).
- `last_login_at`, `created_at`, `updated_at`.

### 3. `students`
Student roster records with multi-tenant unique constraints.
- `id` (text, PK): Student identifier (e.g. `stu-101`).
- `college_id` (text, FK -> `colleges.id`).
- `college_name` (text).
- `name`, `roll_number` (text), `email` (text), `phone`.
- `department`, `course`, `batch`.
- `access_status`: `'Active'`, `'Pending'`, `'Revoked'`, `'Suspended'`.
- `services` (jsonb): Array of service names.
- `entitlement_id`, `provisioning_job_id`.
- `enrolled_year`, `resume_count`, `portfolio_subdomain`.
- `last_activity_at`, `created_at`, `updated_at`.
- **Unique Indexes**:
  - `college_roll_number_idx` ON (`college_id`, `roll_number`)
  - `college_student_email_idx` ON (`college_id`, `email`)

### 4. `student_entitlements`
Active service grants.
- `id` (text, PK).
- `student_id` (text, FK -> `students.id`).
- `college_id` (text, FK -> `colleges.id`).
- `service_id` (text), `service_name` (text).
- `status`: `'Active'`, `'Pending'`, `'Suspended'`, `'Revoked'`.
- `granted_date`, `expiry_date`, `last_updated`.

### 5. `provisioning_jobs`
Asynchronous batch access jobs.
- `id` (text, PK).
- `college_id` (text, FK -> `colleges.id`).
- `created_by` (text), `source` (text).
- `total_records`, `successful`, `failed`, `partial`.
- `status`: `'Queued'`, `'Processing'`, `'Completed'`, `'Partially Completed'`, `'Failed'`.
- `failed_records` (jsonb): Array of `{ rollNumber, name, reason, status }`.
- `created_at`, `completed_at`.

### 6. Additional Tables
- `approval_requests`: Institutional requests requiring corporate action.
- `college_agreements`: MOU & commercial contracts.
- `payment_invoices`: Financial invoices & payment ledger.
- `notifications`: Scoped alerts and announcements.
- `college_tasks`: Operational tasks & action tracking.
- `college_announcements`: Institutional & global announcements.
- `audit_logs`: Immutable security & operational audit trail.
- `college_invitations`: Single-use tokens for onboarding.
- `password_reset_tokens`: 1-hour expiration tokens for password resets.
- `quota_history`: Audit trail for seat additions and deductions.
- `platform_services`: Catalog of global BEXO platform services.

---

## 2. Migrations Execution

Drizzle Kit configuration: [`drizzle.config.ts`](file:///d:/ACEDIGITALS/college-panel/backend/drizzle.config.ts)
Migrations directory: [`src/db/migrations/`](file:///d:/ACEDIGITALS/college-panel/backend/src/db/migrations)

```bash
# Generate new migration from schemas
npm run db:generate

# Apply migrations against PostgreSQL
npm run db:migrate
```
