# BEXO College Admin Backend — API Specification

The BEXO College Admin Backend provides an enterprise RESTful API served under `/api/v1`.

Interactive Swagger / OpenAPI UI is accessible locally at `http://localhost:8000/docs` and `http://localhost:8000/api/v1/docs`.

---

## 1. Request & Response Envelopes

### Request Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json
X-Request-Id: <optional_uuid>
```

### Standard Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Human readable confirmation message",
  "meta": {
    "total": 450,
    "page": 1,
    "limit": 50
  }
}
```

### Standard Error Response
```json
{
  "success": false,
  "statusCode": 403,
  "message": "403 Forbidden: Institutional Access Denied or Cross-Tenant Boundary Violation.",
  "errors": {
    "rollNumber": ["Roll number already enrolled in this institution."]
  },
  "requestId": "correlation-uuid"
}
```

---

## 2. API Endpoints Catalog

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Request Body | Access |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/college-login` | Sign in institutional staff | `{ email, password }` | Public |
| `GET` | `/auth/me` | Fetch active user identity & college profile | None | Authenticated |
| `POST` | `/auth/logout` | Terminate session & invalidate token | None | Authenticated |
| `GET` | `/auth/invitations/validate` | Validate single-use invite token | `?token=...` | Public |
| `POST` | `/auth/activate-account` | Set password & activate account | `{ token, password }` | Public |
| `POST` | `/auth/forgot-password` | Request password reset instructions | `{ email }` | Public |
| `GET` | `/auth/reset-password/validate` | Validate password reset token | `?token=...` | Public |
| `POST` | `/auth/reset-password` | Reset password using token | `{ token, newPassword }` | Public |

### Institutional College Profile (`/api/v1/college`)
| Method | Endpoint | Description | Request Body | Permission |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/college/profile` | Institutional profile, quota, & services | None | Authenticated |
| `PATCH` | `/college/settings` | Update allowed institutional settings | `{ address, city, district, state, pincode, primaryContact }` | `EDIT_COLLEGE_SETTINGS` |
| `GET` | `/college/agreement` | View institutional MOU / agreement | None | `VIEW_AGREEMENT` |
| `GET` | `/college/billing` | View invoices and fee payment history | None | `VIEW_BILLING` |

### Student Roster & Onboarding (`/api/v1/college`)
| Method | Endpoint | Description | Request Body | Permission |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/college/students` | List students (search, filter, page) | Query: `search`, `department`, `status`, `batch`, `page`, `limit` | `VIEW_STUDENTS` |
| `GET` | `/college/students/:id` | Student drilldown (403 for cross-college) | None | `VIEW_STUDENTS` |
| `POST` | `/college/students` | Enroll single student | `{ name, rollNumber, email, department, course, batch, phone }` | `CREATE_STUDENT` |
| `PATCH` | `/college/students/:id` | Update student profile | `{ name, email, phone, department, course, batch }` | `UPDATE_STUDENT` |
| `POST` | `/college/students/:id/revoke` | Revoke service access | `{ reason: string }` | `UPDATE_STUDENT` |
| `POST` | `/college/students/:id/reactivate` | Reactivate access | None | `UPDATE_STUDENT` |
| `POST` | `/college/students/bulk-import` | Bulk ingest student array | `{ students: Array<BulkImportRow> }` | `IMPORT_STUDENTS` |

### Student Provisioning & Entitlements (`/api/v1/college`)
| Method | Endpoint | Description | Request Body | Permission |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/college/provisioning/jobs` | List batch provisioning jobs | None | `VIEW_PROVISIONING` |
| `GET` | `/college/provisioning/jobs/:id` | Inspect job details & failed rows | None | `VIEW_PROVISIONING` |
| `POST` | `/college/provisioning/jobs` | Trigger batch service grant | `{ studentIds: string[], serviceName: string }` | `GRANT_STUDENT_ACCESS` |
| `POST` | `/college/provisioning/jobs/:id/retry` | Retry failed records | None | `RETRY_FAILED_RECORDS` |
| `GET` | `/college/entitlements` | List active student entitlements | None | `VIEW_SERVICES` |

### College Staff Management (`/api/v1/college`)
| Method | Endpoint | Description | Request Body | Permission |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/college/staff` | List authorized college staff | None | `MANAGE_STAFF` |
| `POST` | `/college/staff/invite` | Send onboarding invitation (72h token) | `{ name, email, role, department, designation, mobile }` | `INVITE_STAFF` |
| `POST` | `/college/staff/invitations/:id/resend` | Resend invitation email | None | `INVITE_STAFF` |
| `POST` | `/college/staff/invitations/:id/revoke` | Revoke pending invitation | `{ reason?: string }` | `INVITE_STAFF` |
| `PATCH` | `/college/staff/:id/role` | Change role (`coordinator` or `staff`) | `{ role: Role }` | `MANAGE_STAFF` |
| `POST` | `/college/staff/:id/suspend` | Suspend staff member | `{ reason?: string }` | `MANAGE_STAFF` |
| `POST` | `/college/staff/:id/activate` | Restore staff member | None | `MANAGE_STAFF` |
| `PATCH` | `/college/staff/me` | Update active user profile | `{ name, phone, designation, department }` | Authenticated |
| `POST` | `/college/staff/change-password` | Update account password | `{ currentPassword, newPassword }` | Authenticated |

### Requests & Approvals (`/api/v1/college`)
| Method | Endpoint | Description | Request Body | Permission |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/college/requests` | List institutional requests | None | Authenticated |
| `POST` | `/college/requests` | Submit request to BEXO Administration | `{ type, requester, requesterEmail, requesterRole, details, priority }` | `SUBMIT_REQUESTS` |

### Notifications, Announcements & Tasks (`/api/v1/college`)
| Method | Endpoint | Description | Request Body | Permission |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/college/notifications` | List notifications | None | Authenticated |
| `PATCH` | `/college/notifications/:id/read` | Mark notification read | None | Authenticated |
| `POST` | `/college/notifications/read-all` | Mark all notifications read | None | Authenticated |
| `GET` | `/college/announcements` | Institutional announcements | None | Authenticated |
| `GET` | `/college/tasks` | Operational tasks & deadlines | None | Authenticated |
| `PATCH` | `/college/tasks/:id/toggle` | Toggle task completion | None | Authenticated |
| `GET` | `/college/activity` | Institutional audit log trail | None | `VIEW_ACTIVITY` |
| `GET` | `/college/reports/export` | Export CSV report | `?type=students|provisioning|entitlements` | `EXPORT_REPORTS` |

### Corporate Governance Boundary (`/api/v1/corporate`)
| Method | Endpoint | Description | Request Body | Role Required |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/corporate/colleges` | Global institution inspection | None | `super_admin`, `admin`, `ops` |
| `POST` | `/corporate/colleges/:id/suspend` | Suspend institutional access | `{ reason: string }` | `super_admin`, `admin` |
| `POST` | `/corporate/colleges/:id/reactivate` | Restore institutional access | None | `super_admin`, `admin` |
| `PATCH` | `/corporate/colleges/:id/quota` | Adjust institutional quota | `{ allocated: number, reason: string }` | `super_admin`, `admin` |
| `POST` | `/corporate/requests/:id/review` | Approve/Reject operational request | `{ status, decisionReason }` | `super_admin`, `admin` |
