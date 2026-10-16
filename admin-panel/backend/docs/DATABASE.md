# BEXO Admin Panel — Database Schema, Repository Architecture & Migration Guide

> Detailed technical specification for the PostgreSQL database, Drizzle ORM schemas, repository abstractions, and migration procedures.

---

## 1. Architectural Strategy

The persistence layer uses the **Repository Pattern** driven by TypeScript interfaces. This design decouples the HTTP transport layer and business services from the underlying database driver.

### Core Repositories
1. **`DrizzleRepository` (`src/db/repository/drizzleRepository.ts`)**:
   - Production PostgreSQL driver using `drizzle-orm` and `pg.Pool`.
   - Executes atomic SQL transactions for composite mutations (e.g., student quota expansions, batch student provisioning).
   - Utilizes connection pooling with bounded health readiness probes.
2. **`MemoryRepository` (`src/db/repository/memoryRepository.ts`)**:
   - Zero-dependency, thread-safe in-memory store initialized with deterministic seed fixtures.
   - Enables fast test execution (<50ms per suite) and local development without requiring local PostgreSQL setup.

A central factory (`src/db/repository/index.ts`) initializes either repository based on the `USE_POSTGRES_STORE` environment flag.

---

## 2. Table Specifications (15 Schemas)

### 2.1 Identity & Access Management

#### `staff_users`
Corporate headquarters staff with system roles.
- `id` (VARCHAR(64), Primary Key)
- `name` (VARCHAR(128), Not Null)
- `email` (VARCHAR(255), Unique, Not Null)
- `phone` (VARCHAR(32))
- `role` (VARCHAR(32), Not Null) — `'super_admin'`, `'admin'`, `'ops'`, `'finance'`, `'support'`
- `college_id` (VARCHAR(64), Nullable) — Must be `NULL` for central corporate staff
- `college_name` (VARCHAR(128), Nullable)
- `designation` (VARCHAR(128))
- `department` (VARCHAR(128))
- `is_active` (BOOLEAN, Default: `true`)
- `account_status` (VARCHAR(32), Default: `'ACTIVE'`)
- `session_version` (INTEGER, Default: `1`) — Incremented on password changes / revocations
- `password_hash` (VARCHAR(255), Not Null)
- `last_login_at` (TIMESTAMP)
- `created_at` (TIMESTAMP, Default: `NOW()`)
- `updated_at` (TIMESTAMP, Default: `NOW()`)

#### `sessions`
Tracks active corporate administrator sessions.
- `id` (VARCHAR(64), Primary Key)
- `user_id` (VARCHAR(64), Foreign Key -> `staff_users.id`, Cascade Delete)
- `token_hash` (VARCHAR(64), Unique, Indexed)
- `ip_address` (VARCHAR(64))
- `user_agent` (TEXT)
- `session_version` (INTEGER, Not Null)
- `expires_at` (TIMESTAMP, Not Null)
- `is_revoked` (BOOLEAN, Default: `false`)
- `created_at` (TIMESTAMP, Default: `NOW()`)

#### `invitations`
Cryptographic staff invitations.
- `id` (VARCHAR(64), Primary Key)
- `email` (VARCHAR(255), Not Null)
- `full_name` (VARCHAR(128), Not Null)
- `role` (VARCHAR(32), Not Null)
- `designation` (VARCHAR(128))
- `token_hash` (VARCHAR(64), Unique, Indexed)
- `raw_token` (VARCHAR(128))
- `status` (VARCHAR(32), Default: `'INVITED'`) — `'INVITED'`, `'ACTIVE'`, `'EXPIRED'`, `'REVOKED'`
- `expires_at` (TIMESTAMP, Not Null)
- `created_at` (TIMESTAMP, Default: `NOW()`)
- `updated_at` (TIMESTAMP, Default: `NOW()`)

#### `password_reset_tokens`
SHA-256 hashed password reset tokens.
- `id` (VARCHAR(64), Primary Key)
- `user_id` (VARCHAR(64), Foreign Key -> `staff_users.id`)
- `email` (VARCHAR(255), Not Null)
- `token_hash` (VARCHAR(64), Unique, Indexed)
- `raw_token` (VARCHAR(128))
- `is_used` (BOOLEAN, Default: `false`)
- `expires_at` (TIMESTAMP, Not Null)
- `created_at` (TIMESTAMP, Default: `NOW()`)

---

### 2.2 Institutional Tenancy & Quota Management

#### `colleges`
Institutions onboarded into the BEXO platform.
- `id` (VARCHAR(64), Primary Key)
- `name` (VARCHAR(255), Not Null)
- `code` (VARCHAR(32), Unique, Not Null, Indexed) — e.g. `'PSG'`, `'KCT'`
- `domain` (VARCHAR(128))
- `city` (VARCHAR(128), Not Null)
- `state` (VARCHAR(128), Not Null)
- `status` (VARCHAR(32), Default: `'Active'`) — `'Active'`, `'Suspended'`, `'Pending'`
- `quota_allocated` (INTEGER, Default: `1000`)
- `quota_used` (INTEGER, Default: `0`)
- `contact_person` (VARCHAR(128), Not Null)
- `contact_email` (VARCHAR(255), Not Null)
- `contact_phone` (VARCHAR(32), Not Null)
- `agreement_signed` (BOOLEAN, Default: `true`)
- `renewal_date` (TIMESTAMP)
- `enabled_services` (TEXT, JSON string array)
- `created_at` (TIMESTAMP, Default: `NOW()`)
- `updated_at` (TIMESTAMP, Default: `NOW()`)

#### `quota_history`
Append-only log of institutional quota adjustments.
- `id` (VARCHAR(64), Primary Key)
- `college_id` (VARCHAR(64), Foreign Key -> `colleges.id`, Cascade Delete)
- `previous_quota` (INTEGER, Not Null)
- `new_quota` (INTEGER, Not Null)
- `changed_by` (VARCHAR(128), Not Null)
- `reason` (TEXT, Not Null)
- `changed_at` (TIMESTAMP, Default: `NOW()`)

---

### 2.3 Students & Bulk Provisioning

#### `students`
Student profiles enrolled across institutions.
- `id` (VARCHAR(64), Primary Key)
- `college_id` (VARCHAR(64), Foreign Key -> `colleges.id`, Cascade Delete)
- `name` (VARCHAR(128), Not Null)
- `email` (VARCHAR(255), Not Null)
- `roll_number` (VARCHAR(64), Not Null)
- `department` (VARCHAR(128), Not Null)
- `academic_year` (VARCHAR(32), Not Null)
- `status` (VARCHAR(32), Default: `'Active'`) — `'Active'`, `'Suspended'`, `'Pending'`
- `provisioning_job_id` (VARCHAR(64), Nullable)
- `created_at` (TIMESTAMP, Default: `NOW()`)
- `updated_at` (TIMESTAMP, Default: `NOW()`)
- *Unique Constraint*: `[college_id, roll_number]`

#### `student_entitlements`
Micro-service modules enabled per student.
- `id` (VARCHAR(64), Primary Key)
- `student_id` (VARCHAR(64), Foreign Key -> `students.id`, Cascade Delete)
- `module_key` (VARCHAR(64), Not Null)
- `is_enabled` (BOOLEAN, Default: `true`)
- `granted_at` (TIMESTAMP, Default: `NOW()`)

#### `provisioning_jobs`
Batch execution ledger for automated student account creation.
- `id` (VARCHAR(64), Primary Key)
- `college_id` (VARCHAR(64), Foreign Key -> `colleges.id`)
- `college_name` (VARCHAR(255), Not Null)
- `batch_size` (INTEGER, Not Null)
- `provisioned_count` (INTEGER, Default: `0`)
- `failed_count` (INTEGER, Default: `0`)
- `roll_number_range` (VARCHAR(128), Not Null)
- `department` (VARCHAR(128), Not Null)
- `academic_year` (VARCHAR(32), Not Null)
- `status` (VARCHAR(32), Default: `'Processing'`) — `'Processing'`, `'Completed'`, `'Partially Completed'`, `'Failed'`
- `triggered_by` (VARCHAR(128), Not Null)
- `failed_records` (TEXT, JSON array of `{ rollNumber, email, name, reason }`)
- `created_at` (TIMESTAMP, Default: `NOW()`)
- `completed_at` (TIMESTAMP)

---

### 2.4 Governance, Finance & Operations

#### `approval_requests`
Multi-stage governance sign-off requests.
- `id` (VARCHAR(64), Primary Key)
- `type` (VARCHAR(64), Not Null) — `'Quota Increase'`, `'Agreement Renewal'`, `'Access Provisioning'`, `'Role Elevation'`
- `college_id` (VARCHAR(64), Foreign Key -> `colleges.id`, Nullable)
- `college_name` (VARCHAR(255), Nullable)
- `requested_by` (VARCHAR(128), Not Null)
- `details` (TEXT, Not Null)
- `status` (VARCHAR(32), Default: `'Pending'`) — `'Pending'`, `'Approved'`, `'Rejected'`
- `reviewed_by` (VARCHAR(128), Nullable)
- `review_notes` (TEXT, Nullable)
- `created_at` (TIMESTAMP, Default: `NOW()`)
- `updated_at` (TIMESTAMP, Default: `NOW()`)

#### `platform_services`
Catalog of modular platform features.
- `id` (VARCHAR(64), Primary Key)
- `name` (VARCHAR(128), Not Null)
- `key` (VARCHAR(64), Unique, Not Null)
- `category` (VARCHAR(64), Not Null)
- `is_globally_enabled` (BOOLEAN, Default: `true`)
- `description` (TEXT)
- `updated_at` (TIMESTAMP, Default: `NOW()`)

#### `payment_invoices`
Institutional billing ledger.
- `id` (VARCHAR(64), Primary Key)
- `college_id` (VARCHAR(64), Foreign Key -> `colleges.id`)
- `college_name` (VARCHAR(255), Not Null)
- `invoice_number` (VARCHAR(64), Unique, Not Null)
- `amount` (NUMERIC(12, 2), Not Null)
- `plan` (VARCHAR(64), Not Null)
- `billing_cycle` (VARCHAR(64), Not Null)
- `status` (VARCHAR(32), Default: `'Paid'`) — `'Paid'`, `'Pending'`, `'Overdue'`
- `paid_at` (TIMESTAMP)
- `due_date` (TIMESTAMP, Not Null)
- `created_at` (TIMESTAMP, Default: `NOW()`)

#### `notifications`
Alerts and system messages.
- `id` (VARCHAR(64), Primary Key)
- `title` (VARCHAR(255), Not Null)
- `message` (TEXT, Not Null)
- `type` (VARCHAR(32), Default: `'info'`) — `'info'`, `'warning'`, `'success'`, `'error'`
- `category` (VARCHAR(64), Default: `'System'`)
- `is_read` (BOOLEAN, Default: `false`)
- `recipient_id` (VARCHAR(64), Nullable)
- `created_at` (TIMESTAMP, Default: `NOW()`)

#### `audit_logs`
Immutable administrative audit ledger.
- `id` (VARCHAR(64), Primary Key)
- `actor_id` (VARCHAR(64), Not Null)
- `actor_name` (VARCHAR(128), Not Null)
- `actor_role` (VARCHAR(32), Not Null)
- `action` (VARCHAR(64), Not Null)
- `entity_type` (VARCHAR(64), Not Null)
- `entity_id` (VARCHAR(64), Not Null)
- `details` (TEXT) — Structured JSON snapshot of mutation
- `ip_address` (VARCHAR(64))
- `timestamp` (TIMESTAMP, Default: `NOW()`)

#### `app_templates`
Portal theme and layout templates.
- `id` (VARCHAR(64), Primary Key)
- `name` (VARCHAR(128), Not Null)
- `category` (VARCHAR(64), Not Null)
- `version` (VARCHAR(32), Not Null)
- `is_published` (BOOLEAN, Default: `false`)
- `is_featured` (BOOLEAN, Default: `false`)
- `description` (TEXT)
- `created_at` (TIMESTAMP, Default: `NOW()`)
- `updated_at` (TIMESTAMP, Default: `NOW()`)

---

## 3. Database Migration Procedures

Drizzle Kit manages versioned migrations under `src/db/migrations/`.

### Generate Migration from Schemas
```bash
npm run db:generate
```
Generates versioned SQL migration scripts in `src/db/migrations/`.

### Execute Migrations
```bash
npm run db:migrate
```
Executes all unapplied migrations transactionally against PostgreSQL and verifies schema integrity.

### Verify Database Connection & Tables
```bash
npm run db:verify
```
Probes PostgreSQL connectivity and reports table existence and row counts.

---

## 4. Database Seeding & Production Guard

The database seeder is located at `src/db/seed.ts`.

### Strict Production Safety Guard
The seeder enforces an unconditional lock:
```typescript
if (env.NODE_ENV === 'production') {
  logger.error('CRITICAL: Database seeding is strictly forbidden in production.');
  process.exit(1);
}
```

### Seeding in Development/Staging
```bash
npm run db:seed
```
Seeds 6 corporate staff users, 4 default colleges (PSG, KCT, BIT, CIT), quota records, sample provisioning jobs, invoices, service records, and initial notifications.
