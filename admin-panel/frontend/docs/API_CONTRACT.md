# BEXO Admin Panel — API Specification & Integration Contract

## 1. Overview & Architecture

The **BEXO Admin Panel Frontend** (`bexo-admin`) is an independent module designed to manage central corporate operations across all colleges, students, licenses, services, payments, approvals, and system telemetry.

This contract defines the REST API requirements for the BEXO backend team. The frontend interacts with these endpoints via the centralized `apiClient` (`src/services/apiClient.ts`).

### Environment Configuration
- Base URL is configured via `VITE_API_BASE_URL` (e.g., `https://api.bexo.example.com/api/v1` or `http://localhost:8000/api/v1`).
- Fallback in-memory simulation is governed by `VITE_DEMO_MODE=true` (must be `false` in production).
- College portal URL is configured via `VITE_COLLEGE_PORTAL_URL`.

---

## 2. Authentication & Security Headers

### Request Headers
Every authenticated request from `bexo-admin` includes:
```http
Authorization: Bearer <jwt_or_session_token>
Content-Type: application/json
Accept: application/json
```
For cookie-based architectures, `credentials: 'include'` is enabled so that secure HttpOnly cookies are transmitted automatically.

### Response Envelopes
All successful responses must follow the standard envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation message",
  "meta": {
    "total": 120,
    "page": 1,
    "limit": 20
  }
}
```

### Error Envelopes
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Session expired or unauthorized.",
  "errors": {
    "field": ["Validation error description"]
  }
}
```

### Standard HTTP Status Codes
- `200 OK` — Successful query or state mutation.
- `201 Created` — Resource successfully created (college, user, job).
- `400 Bad Request` — Invalid input, malformed syntax, or business logic rule violation.
- `401 Unauthorized` — Token missing, expired, or invalid. Frontend immediately triggers session expiration and routes to `/login`.
- `403 Forbidden` — Authenticated identity lacks corporate administration permissions (e.g., college user attempting admin operations).
- `404 Not Found` — Resource not found.
- `409 Conflict` — Duplicate entity (e.g., college code or email already in use).
- `422 Unprocessable Entity` — Quota violation or unmet prerequisites.
- `500 Internal Server Error` — Server-side exception.

---

## 3. API Endpoints Specification

### 3.1 Authentication & Profile
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticate admin staff | `{ email, password }` |
| `POST` | `/auth/logout` | Invalidate active session/token | None |
| `GET` | `/auth/me` | Fetch active user identity & role | None |
| `POST` | `/auth/forgot-password` | Initiate password reset link | `{ email }` |
| `GET` | `/auth/reset-password/validate` | Validate reset token | Query: `?token=...` |
| `POST` | `/auth/reset-password` | Complete password reset | `{ token, newPassword }` |
| `GET` | `/auth/invitations/validate` | Validate onboarding invitation | Query: `?token=...` |
| `POST` | `/auth/activate-account` | Set password & activate account | `{ token, password }` |

**Multi-Tenant Guard Rule**: If a user with `collegeId` or role `college_*` logs in via `/auth/login`, the backend MUST reject the authentication with `403 Forbidden` and message:
`"Institutional Access Restricted: This portal is for central BEXO corporate administrators. College staff must access via the dedicated College Portal."`

---

### 3.2 College Directory & Lifecycle
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/colleges` | List all colleges (search/status/type filter) | Query params: `search`, `status`, `type` |
| `GET` | `/colleges/:id` | Fetch complete college profile | None |
| `POST` | `/colleges` | Register & onboard new college | Full `College` payload |
| `PATCH` | `/colleges/:id` | Update college details | Partial `College` updates |
| `POST` | `/colleges/:id/suspend` | Place college on suspension | `{ reason: string }` |
| `POST` | `/colleges/:id/reactivate` | Clear suspension and reactivate | `{ reason?: string }` |
| `POST` | `/colleges/:id/quota` | Adjust seat quota allocation | `{ allocated: number, reason: string }` |
| `GET` | `/colleges/:id/quota-history` | View quota change audit history | None |
| `POST` | `/colleges/:id/services/:serviceId/toggle` | Enable or disable platform service | `{ enabled: boolean }` |

**Suspension Business Rule**:
When a college is suspended, the backend must disable dashboard access and services for that college, but MUST NOT delete students, portfolios, or historical records.

---

### 3.3 Student Oversight
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/students` | List students across colleges | Query: `collegeId`, `department`, `status`, `search` |
| `GET` | `/students/:id` | Fetch student details | None |
| `POST` | `/students` | Register student record | Student payload |
| `POST` | `/students/:id/revoke` | Revoke student platform access | `{ reason: string }` |
| `POST` | `/students/:id/reactivate` | Re-enable revoked student access | None |

---

### 3.4 Bulk Provisioning
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/provisioning/jobs` | List provisioning batch jobs | Query: `collegeId` |
| `GET` | `/provisioning/jobs/:id` | Job details and failed records | None |
| `POST` | `/provisioning/batch` | Trigger async provisioning batch | `{ collegeId, source, startRoll, endRoll, batchSize }` |

---

### 3.5 Approval Center & Requests Ledger
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/approvals` | List approval requests | Query: `status` |
| `POST` | `/approvals/:id/approve` | Approve operational request | `{ decisionReason: string }` |
| `POST` | `/approvals/:id/reject` | Reject operational request | `{ decisionReason: string }` |
| `POST` | `/approvals` | Submit operational request | Approval request payload |

---

### 3.6 Platform Services Catalog
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/services` | List all platform services | None |
| `POST` | `/services/:id/toggle-global` | Globally enable/disable service | None |

---

### 3.7 Payments & Finance
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/payments` | List invoices and transactions | Query: `collegeId` |
| `POST` | `/payments` | Record payment transaction | PaymentInvoice payload |

---

### 3.8 Notifications Center
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | List admin notifications | None |
| `POST` | `/notifications/:id/read` | Mark notification as read | None |
| `POST` | `/notifications/mark-all-read`| Mark all notifications read | None |
| `DELETE` | `/notifications/:id` | Dismiss notification | None |

---

### 3.9 Audit & Compliance Security Center
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/audit/logs` | Query immutable audit ledger | Query: `entity`, `page`, `limit` |
| `POST` | `/audit/logs` | Record administrative audit item | Audit log payload |

---

### 3.10 System Health & Operations
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/system/health` | Live cluster & service latency metrics | None |

---

### 3.11 Users, Staff & Invitations
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/staff` | List corporate staff & admins | Query: `collegeId` |
| `POST` | `/users/staff` | Create staff user | Staff payload |
| `PATCH` | `/users/staff/:id` | Update staff details / role | Partial staff updates |
| `DELETE` | `/users/staff/:id` | Revoke staff user | None |
| `POST` | `/invitations` | Issue cryptographic invitation | `{ email, fullName, role, collegeId, designation }` |
| `POST` | `/invitations/:id/resend` | Re-send invitation email | None |
| `POST` | `/invitations/:id/revoke` | Revoke invitation token | `{ reason: string }` |

---

### 3.12 App Templates Catalog
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/templates` | List design & portfolio templates | None |
| `POST` | `/templates` | Create template | AppTemplate payload |
| `PATCH` | `/templates/:id` | Update template | Partial template updates |
| `DELETE` | `/templates/:id` | Remove template | None |
| `POST` | `/templates/:id/toggle-publish` | Toggle published / draft state | None |
| `POST` | `/templates/:id/toggle-featured`| Toggle featured flag | None |

---

## 4. Backend Implementation Checklist

The frontend is fully built, typed, and wired with service interfaces. When standing up the backend, implement the above routes in priority order:
1. `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` (Core security).
2. `GET /colleges`, `POST /colleges`, `POST /colleges/:id/suspend`, `POST /colleges/:id/reactivate`, `POST /colleges/:id/quota` (College management).
3. `GET /students`, `POST /students/:id/revoke`, `POST /students/:id/reactivate` (Student oversight).
4. `GET /approvals`, `POST /approvals/:id/approve`, `POST /approvals/:id/reject` (Approvals & governance).
5. `GET /provisioning/jobs`, `POST /provisioning/batch` (Provisioning engine).
6. `GET /audit/logs`, `POST /audit/logs` (Audit ledger).
7. `GET /services`, `GET /payments`, `GET /system/health`, `GET /templates`, `GET /notifications`.
