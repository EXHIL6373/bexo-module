# BEXO College Panel — API Specification & Multi-Tenant Integration Contract

## 1. Overview & Architectural Scope

The **BEXO College Panel Frontend** (`bexo-clg-admin`) is an independent, college-only frontend application.
It is exclusively designed for authorized higher-education institutional users (`college_admin`, `college_coordinator`, `college_staff`).

This portal allows institutions to:
1. Manage student rosters and profile lifecycles.
2. Ingest student cohorts via validated CSV / XLSX uploads with duplicate roll number detection.
3. Grant service entitlements (e.g., BEXO Portfolio Builder, ATS Resume Engine) based on verified institutional quotas.
4. Track asynchronous provisioning batches and inspect failed records.
5. Manage authorized college staff without corporate privilege escalation.
6. Submit operational requests (quota expansion, service additions, MOU extensions).
7. Review institutional agreements, billing records, and audit activity.

---

## 2. Mandatory Multi-Tenant Security Rules

### Principle 1: Zero Trust in Frontend-Supplied `collegeId`
The backend **MUST NOT** accept or trust a `collegeId` passed in query parameters, path variables, or request bodies to determine which institution's data to access or mutate.
- The user's institutional identity is derived **strictly from the cryptographically verified JWT or server session**.
- Every database query (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) must include `WHERE college_id = :authenticated_college_id`.

### Principle 2: Cross-Tenant Data Isolation
- A user belonging to College A must **never** receive records belonging to College B.
- Attempting to inspect or update another institution's student (e.g., `GET /college/students/:id` where `:id` belongs to another college) must immediately return `403 Forbidden` with a security audit event logged.

### Principle 3: Rejection of Corporate Admins
- If a central corporate administrator (`super_admin`, `admin`, `ops`, `finance`, `support` with no assigned `collegeId`) attempts to authenticate at `/auth/college-login`, the server must return:
  ```json
  {
    "success": false,
    "statusCode": 403,
    "message": "Institutional Access Restricted: This portal is exclusively for authorized college staff. Corporate administrators must sign in at the BEXO Corporate Admin Console."
  }
  ```

### Principle 4: Institutional Lifecycle Enforcement
- If an institution is marked as `Suspended` or `dashboardAccess: false`, write operations (especially student provisioning, bulk imports, and staff creation) must be strictly locked on the server side (`403 Forbidden`).
- Preserved Data: Suspension must **never** delete student portfolios, published resumes, or historical records.

---

## 3. Standard Request & Response Envelopes

### Request Headers
Every authenticated request includes:
```http
Authorization: Bearer <jwt_or_session_token>
Content-Type: application/json
Accept: application/json
```
Cookie-based session architectures are also supported via `credentials: 'include'`.

### Standard Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation message",
  "meta": {
    "total": 450,
    "page": 1,
    "limit": 50
  }
}
```

### Standard Error Envelope
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Access forbidden: Tenant isolation boundary active.",
  "errors": {
    "rollNumber": ["Roll number already enrolled in this institution."]
  }
}
```

---

## 4. REST Endpoints Specification

### 4.1 Authentication & Session
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/college-login` | Authenticate college staff | `{ email, password }` |
| `GET` | `/auth/me` | Return active user & institutional profile | None |
| `POST` | `/auth/logout` | Invalidate active session/token | None |
| `GET` | `/auth/invitations/validate` | Validate single-use invite token | Query: `?token=...` |
| `POST` | `/auth/activate-account` | Set password & activate account | `{ token, password }` |
| `POST` | `/auth/forgot-password` | Request password reset email | `{ email }` |
| `GET` | `/auth/reset-password/validate`| Validate password reset token | Query: `?token=...` |
| `POST` | `/auth/reset-password` | Complete password reset | `{ token, newPassword }` |

### 4.2 Institutional College Profile
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/college/profile` | Fetch college profile, quota, & services | None |
| `PATCH` | `/college/settings` | Update permitted profile settings | `{ address, city, district, state, pincode, primaryContact }` |
| `GET` | `/college/agreement` | View institutional MOU / agreement details | None |
| `GET` | `/college/billing` | View invoices and fee payment history | None |

### 4.3 Student Roster & Onboarding
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/college/students` | List college students (search, filter, page) | Query: `search`, `department`, `status`, `batch`, `page`, `limit` |
| `GET` | `/college/students/:id` | Fetch single student details | None |
| `POST` | `/college/students` | Enroll single student | `{ name, rollNumber, email, department, course, batch, phone }` |
| `PATCH` | `/college/students/:id` | Update student profile | `{ name, email, phone, department, course, batch }` |
| `POST` | `/college/students/:id/revoke` | Revoke service access | `{ reason: string }` |
| `POST` | `/college/students/:id/reactivate` | Reactivate student access | None |
| `POST` | `/college/students/bulk-import` | Ingest validated student array | `{ students: Array<BulkImportRow> }` |

### 4.4 Student Provisioning & Entitlements
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/college/provisioning/jobs` | List provisioning batch jobs | None |
| `GET` | `/college/provisioning/jobs/:id` | Inspect batch results & failed rows | None |
| `POST` | `/college/provisioning/jobs` | Trigger batch service granting | `{ studentIds: string[], serviceName: string }` |
| `POST` | `/college/provisioning/jobs/:id/retry` | Retry failed records | None |
| `GET` | `/college/entitlements` | List active student entitlements | None |

### 4.5 College Staff & Team Management
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/college/staff` | List authorized college staff | None |
| `POST` | `/college/staff/invite` | Send onboarding invitation | `{ name, email, role, department, designation, mobile }` |
| `POST` | `/college/staff/invitations/:id/resend` | Resend invitation email | None |
| `POST` | `/college/staff/invitations/:id/revoke` | Revoke pending invitation | `{ reason?: string }` |
| `PATCH` | `/college/staff/:id/role` | Change staff role (`coordinator` or `staff`) | `{ role: Role }` |
| `POST` | `/college/staff/:id/suspend` | Suspend staff member | `{ reason?: string }` |
| `POST` | `/college/staff/:id/activate` | Restore staff member | None |
| `PATCH` | `/college/staff/me` | Update current user profile | `{ name, phone, designation, department }` |
| `POST` | `/college/staff/change-password` | Update current user password | `{ currentPassword, newPassword }` |

### 4.6 Requests, Approvals & Operations
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/college/requests` | List institutional requests | None |
| `POST` | `/college/requests` | Submit request to BEXO Administration | `{ type, requester, requesterEmail, requesterRole, details, priority }` |

### 4.7 Notifications, Announcements & Activity
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/college/notifications` | List notifications | None |
| `PATCH` | `/college/notifications/:id/read` | Mark notification read | None |
| `POST` | `/college/notifications/read-all` | Mark all notifications read | None |
| `GET` | `/college/announcements` | List institutional announcements | None |
| `GET` | `/college/tasks` | List operational tasks | None |
| `PATCH` | `/college/tasks/:id/toggle` | Toggle task completion | None |
| `GET` | `/college/activity` | List audit log entries | None |
| `GET` | `/college/reports/export` | Export CSV / XLSX report | Query: `?type=students|provisioning|entitlements` |
