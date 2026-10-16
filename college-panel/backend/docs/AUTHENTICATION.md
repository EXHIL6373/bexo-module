# BEXO College Admin Backend — Authentication & Account Lifecycle

The College Admin portal employs cryptographic JWT tokens paired with server-side identity verification.

---

## 1. Authentication Lifecycle

### 1. Institutional Sign In (`POST /api/v1/auth/college-login`)
1. User provides `email` and `password`.
2. Corporate administrator accounts attempting authentication at this college gateway are rejected with HTTP 403:
   `"Institutional Access Restricted: This portal is exclusively for authorized college staff. Corporate administrators must sign in at the BEXO Corporate Admin Console."`
3. If the associated institution has been suspended (`status: 'Suspended'` or `dashboardAccess: false`), authentication is rejected with HTTP 403:
   `"Institutional Access Suspended: Your institution's dashboard access is currently suspended. Please contact BEXO Enterprise Support."`
4. Password verified using `bcryptjs.compare`.
5. Cryptographic JWT is signed with `userId`, `email`, `role`, and `collegeId`.

### 2. Staff Onboarding & Account Activation
1. College Admin invites staff (`POST /api/v1/college/staff/invite`).
2. Server generates a cryptographically random, 32-byte hexadecimal token with 72-hour expiration.
3. System sends onboarding invitation email with link `/activate-account?token=...`.
4. Invited user submits password (`POST /api/v1/auth/activate-account`).
5. Server sets `passwordHash`, marks invitation status `ACTIVE`, and issues session token.
6. Token replay attempts are blocked (`400 Bad Request`).

### 3. Password Reset
1. User submits email (`POST /api/v1/auth/forgot-password`).
2. Server issues 1-hour expiration token, persists record, and sends reset email.
3. Generic response prevents user enumeration.
4. User validates token and sets new password (`POST /api/v1/auth/reset-password`).
5. Token is marked `isUsed: true` immediately to prevent replay.

---

## 2. Role-Based Access Control (RBAC)

| Role | Category | Scope | Key Capabilities |
| :--- | :--- | :--- | :--- |
| `college_admin` | Institutional | Assigned College | Full institutional management, rosters, staff, quotas, billing |
| `college_coordinator` | Institutional | Assigned College | Manage students, bulk import, provisioning batches, view reports |
| `college_staff` | Institutional | Assigned College | Read-only inspection of students, jobs, services, audit activity |
| `super_admin` / `admin` | Corporate | Global | Corporate governance boundary only; blocked from college portal |
