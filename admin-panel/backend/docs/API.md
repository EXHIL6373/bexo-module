# BEXO Admin Panel — Complete REST API Reference

> Specification for all endpoints exposed by the BEXO Corporate Admin Backend at `/api/v1`.

---

## 1. Global Conventions

### Base URLs
- **Root Health Probe**: `http://localhost:8080/health`
- **API Base**: `http://localhost:8080/api/v1`

### Authentication
Protected endpoints require an `Authorization` header containing a valid JSON Web Token (JWT):
```http
Authorization: Bearer <jwt_access_token>
```

### Standard Response Envelope (Success)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully.",
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

### Standard Error Envelope (Failure)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Human-readable error description.",
  "errors": {
    "field": ["Validation error detail"]
  }
}
```

### Standard HTTP Status Codes
| Status | Meaning | Usage |
|---|---|---|
| `200 OK` | Success | GET, PUT, and standard action POST requests |
| `201 Created` | Resource Created | POST resource creation requests |
| `400 Bad Request` | Validation Failure | Invalid input body, query parameter, or constraint violation |
| `401 Unauthorized` | Missing / Invalid Token | Missing, invalid, expired, or malformed JWT token |
| `403 Forbidden` | Access Restricted | Insufficient role permissions or institutional perimeter barrier |
| `404 Not Found` | Resource Absent | Requested resource ID does not exist |
| `409 Conflict` | Unique Key Conflict | Duplicate email, duplicate college code, or duplicate invoice number |
| `422 Unprocessable Entity` | Business Rule Violation | Insufficient college quota for provisioning |
| `429 Too Many Requests` | Rate Limit Exceeded | Exceeded allowed requests per window |
| `500 Internal Error` | Server Exception | Uncaught runtime error (masked in staging/production) |

---

## 2. Authentication & Session Module

### `POST /auth/login`
Authenticates a corporate administrative user.
- **Access**: Public (Subject to `authLimiter`: 20 req/min)
- **Request Body**:
  ```json
  {
    "email": "kavinbalaji@atbexo.com",
    "password": "AdminPassword123!"
  }
  ```
- **Responses**:
  - `200 OK`: Returns JWT token and staff profile.
  - `401 Unauthorized`: `"Invalid corporate credentials."` (Uniform response preventing email enumeration)
  - `403 Forbidden`: Multi-tenant perimeter guard when institutional college account logs in:
    ```json
    {
      "success": false,
      "statusCode": 403,
      "message": "Institutional Access Restricted: This portal is for central BEXO corporate administrators. College staff must access via the dedicated College Portal."
    }
    ```

### `POST /auth/logout`
Terminates user session and invalidates token.
- **Access**: Authenticated

### `GET /auth/me`
Retrieves current authenticated corporate user profile.
- **Access**: Authenticated

### `POST /auth/forgot-password`
Initiates a password reset link.
- **Access**: Public
- **Request Body**: `{ "email": "kavinbalaji@atbexo.com" }`
- **Response**: `200 OK` (Always returns generic success message preventing account enumeration)

### `GET /auth/reset-password/validate?token=<token>`
Validates password reset token without consuming it.
- **Access**: Public
- **Response**: `200 OK` `{ "data": { "valid": true, "email": "..." } }`

### `POST /auth/reset-password`
Consumes reset token and updates password.
- **Access**: Public
- **Request Body**: `{ "token": "...", "newPassword": "NewStrongPassword123!" }`

### `GET /auth/invitations/validate?token=<token>`
Validates corporate staff invitation token.
- **Access**: Public
- **Response**: `200 OK` `{ "data": { "valid": true, "email": "...", "fullName": "...", "role": "..." } }`

### `POST /auth/activate-account`
Consumes invitation token, sets initial password, and activates staff account.
- **Access**: Public
- **Request Body**: `{ "token": "...", "password": "InitialPassword123!" }`

---

## 3. Institutional Colleges Module

### `GET /colleges`
Lists colleges with filtering, search, and pagination.
- **Access**: `super_admin`, `admin`, `ops`, `finance`, `support`
- **Query Params**: `search`, `status` (`Active`|`Suspended`|`Pending`), `page`, `limit`

### `GET /colleges/:id`
Retrieves detailed college profile including quota and service toggles.
- **Access**: `super_admin`, `admin`, `ops`, `finance`, `support`

### `POST /colleges`
Onboards a new institution.
- **Access**: `super_admin`, `admin`
- **Request Body**:
  ```json
  {
    "name": "Coimbatore Institute of Technology",
    "code": "CIT",
    "domain": "cit.edu.in",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "contactPerson": "Dr. A. Ramesh",
    "contactEmail": "admin@cit.edu.in",
    "contactPhone": "+91 98401 99887",
    "quotaAllocated": 2000
  }
  ```
- **Responses**: `201 Created` or `409 Conflict` (Duplicate college code)

### `PUT /colleges/:id`
Updates institutional metadata.
- **Access**: `super_admin`, `admin`

### `POST /colleges/:id/suspend`
Suspends college access across platform while preserving data.
- **Access**: `super_admin`, `admin`
- **Request Body**: `{ "reason": "Agreement review pending." }`

### `POST /colleges/:id/reactivate`
Reinstates a suspended college.
- **Access**: `super_admin`, `admin`

### `POST /colleges/:id/quota`
Adjusts student quota with automated ledger record.
- **Access**: `super_admin`, `admin`, `ops`
- **Request Body**:
  ```json
  {
    "quotaAllocated": 2500,
    "reason": "Mid-term batch expansion"
  }
  ```
- **Responses**: `200 OK` or `400 Bad Request` (Quota cannot be lower than currently utilized quota)

### `GET /colleges/:id/quota-history`
Lists all historical quota modifications for a college.
- **Access**: `super_admin`, `admin`, `ops`, `finance`

### `POST /colleges/:id/services/:serviceId/toggle`
Toggles an individual platform feature on or off for a college.
- **Access**: `super_admin`, `admin`, `ops`

---

## 4. Student Management Module

### `GET /students`
Directory of enrolled students across all or specific colleges.
- **Access**: `super_admin`, `admin`, `ops`, `support`
- **Query Params**: `collegeId`, `search`, `status` (`Active`|`Suspended`|`Pending`), `page`, `limit`

### `GET /students/:id`
Student profile including active entitlement modules.
- **Access**: `super_admin`, `admin`, `ops`, `support`

### `POST /students`
Manually registers a single student.
- **Access**: `super_admin`, `admin`, `ops`
- **Validation**: Enforces college quota ceiling and uniqueness of college + roll number.

### `POST /students/:id/revoke`
Revokes platform access for a student.
- **Access**: `super_admin`, `admin`, `ops`, `support`

### `POST /students/:id/reactivate`
Restores student platform access.
- **Access**: `super_admin`, `admin`, `ops`, `support`

---

## 5. Staff Users Module

### `GET /users/staff`
Lists all corporate staff members.
- **Access**: `super_admin`, `admin`

### `POST /users/staff`
Creates a corporate staff account directly.
- **Access**: `super_admin`, `admin`

### `PUT /users/staff/:id`
Updates staff name, phone, role, designation, department, or active status.
- **Access**: `super_admin`, `admin`
- **Security Guard**: Only `super_admin` can grant or revoke `super_admin` role.

### `DELETE /users/staff/:id`
Deactivates a staff user account.
- **Access**: `super_admin`, `admin`
- **Security Guard**: Users cannot delete or deactivate their own account.

---

## 6. Staff Invitations Module

### `GET /invitations`
Lists pending corporate staff invitations.
- **Access**: `super_admin`, `admin`

### `POST /invitations`
Dispatches an invitation email with a cryptographic token.
- **Access**: `super_admin`, `admin`
- **Request Body**:
  ```json
  {
    "email": "priya.new@atbexo.com",
    "fullName": "Priya Sharma",
    "role": "finance",
    "designation": "Billing Specialist"
  }
  ```

### `POST /invitations/:id/resend`
Regenerates token and dispatches fresh invitation email.
- **Access**: `super_admin`, `admin`

### `POST /invitations/:id/revoke`
Revokes a pending invitation.
- **Access**: `super_admin`, `admin`

---

## 7. Multi-Stage Approvals Module

### `GET /approvals`
Lists approval tickets with status filter (`Pending`|`Approved`|`Rejected`).
- **Access**: `super_admin`, `admin`, `ops`, `finance`, `support`

### `POST /approvals`
Submits an approval request for executive sign-off.
- **Access**: `super_admin`, `admin`, `ops`, `finance`, `support`
- **Types**: `Quota Increase`, `Agreement Renewal`, `Access Provisioning`, `Role Elevation`

### `POST /approvals/:id/approve`
Approves request. For `Quota Increase` requests, atomically increments college quota in database.
- **Access**: `super_admin`, `admin`
- **Idempotency Guard**: Cannot re-approve already decided tickets.

### `POST /approvals/:id/reject`
Rejects request with mandatory review note.
- **Access**: `super_admin`, `admin`

---

## 8. Bulk Provisioning Engine

### `GET /provisioning/jobs` (or `GET /provisioning`)
Lists recent batch student provisioning jobs.
- **Access**: `super_admin`, `admin`, `ops`

### `GET /provisioning/jobs/:id` (or `GET /provisioning/:id`)
Detailed provisioning job status, metrics, and list of failed records with failure reasons.
- **Access**: `super_admin`, `admin`, `ops`

### `POST /provisioning/batch`
Triggers an automated student provisioning run for a college roll range.
- **Access**: `super_admin`, `admin`, `ops`
- **Request Body**:
  ```json
  {
    "collegeId": "clg-psg-01",
    "batchSize": 250,
    "rollNumberRange": "24CS001 - 24CS250",
    "department": "Computer Science and Engineering",
    "academicYear": "2024-2028"
  }
  ```
- **Responses**:
  - `201 Created`: Complete or partial batch run. If quota is insufficient, provisions up to available quota, marks remaining records as failed, and marks job as `Partially Completed`.
  - `400 Bad Request`: When college is currently suspended.

---

## 9. Platform Services Catalog

### `GET /services`
Lists platform service micro-features and their global enabled status.
- **Access**: `super_admin`, `admin`, `ops`, `finance`, `support`

### `POST /services/:id/toggle-global`
Globally activates or deactivates a service across the ecosystem.
- **Access**: `super_admin`, `admin`

---

## 10. Invoicing & Payments Module

### `GET /payments`
Lists institutional invoices and payment receipts.
- **Access**: `super_admin`, `admin`, `finance`

### `POST /payments`
Records an institutional payment transaction.
- **Access**: `super_admin`, `admin`, `finance`
- **Responses**: `201 Created` or `409 Conflict` (Duplicate invoice number)

---

## 11. Notifications Module

### `GET /notifications`
Retrieves user's corporate notifications and system alerts.
- **Access**: Authenticated

### `POST /notifications/:id/read`
Marks single notification as read.
- **Access**: Authenticated

### `POST /notifications/mark-all-read`
Marks all notifications as read for current user.
- **Access**: Authenticated

### `DELETE /notifications/:id`
Dismisses a notification.
- **Access**: Authenticated

---

## 12. Audit Ledger Module

### `GET /audit/logs`
Queries immutable administrative audit history.
- **Access**: `super_admin`, `admin`
- **Query Params**: `action`, `actorId`, `targetId`, `limit`

### `POST /audit/logs`
Records a custom administrative event (Server enforces actor ID from token).
- **Access**: `super_admin`, `admin`

---

## 13. App Templates Module

### `GET /templates`
Lists reusable institutional portal templates.
- **Access**: `super_admin`, `admin`, `ops`

### `POST /templates`
Creates a new template.
- **Access**: `super_admin`, `admin`

### `PUT /templates/:id`
Updates template configuration.
- **Access**: `super_admin`, `admin`

### `DELETE /templates/:id`
Deletes an unpublished template.
- **Access**: `super_admin`, `admin`

### `POST /templates/:id/toggle-publish`
Toggles publication status.
- **Access**: `super_admin`, `admin`

### `POST /templates/:id/toggle-featured`
Toggles featured showcase flag.
- **Access**: `super_admin`, `admin`

---

## 14. System Telemetry & Liveness Probes

### `GET /health`
Lightweight, unauthenticated container liveness probe.
- **Access**: Public
- **Response**: `{ "status": "pass", "service": "bexo-admin-panel-backend", "checks": { "database": "healthy" } }`

### `GET /system/health`
Corporate telemetry endpoint providing uptime, memory usage, and component status.
- **Access**: `super_admin`, `admin`, `ops`
