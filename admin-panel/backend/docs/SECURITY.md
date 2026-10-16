# BEXO Admin Panel — Security Architecture & Hardening Specification

> Comprehensive security specifications for the BEXO Corporate Admin Backend.

---

## 1. Multi-Tenant Perimeter Guard

### Threat Model & Defense Rationale
The BEXO ecosystem contains three distinct software surfaces:
1. **Central Corporate Admin Panel**: Enterprise management, financial reconciliation, and cross-institutional governance.
2. **College Management Portal**: Institutional staff managing their specific campus operations.
3. **BEXO Mobile App**: Student access to curriculum, campus updates, and learning entitlements.

Allowing a college-level staff user or student into the central admin portal poses a critical privilege escalation and data spill vulnerability.

### Enforced Perimeter Defense
In `src/middlewares/auth.ts`, `src/middlewares/rbac.ts`, and `src/modules/auth/auth.service.ts`:
1. **At Login (`POST /api/v1/auth/login`)**:
   If an account with `role.startsWith('college_')` or a non-null `collegeId` attempts authentication, the backend immediately halts processing and responds with:
   - **HTTP Status**: `403 Forbidden`
   - **Body**:
     ```json
     {
       "success": false,
       "statusCode": 403,
       "message": "Institutional Access Restricted: This portal is for central BEXO corporate administrators. College staff must access via the dedicated College Portal."
     }
     ```
2. **At Every Authenticated Route (`requireCorporateStaff`)**:
   Even if a token is presented, `requireCorporateStaff` validates that `req.user.collegeId === null` and `!req.user.role.startsWith('college_')`. Violations trigger an immediate 403.

---

## 2. Authentication & Session Security

### Password Hashing
- **Algorithm**: `bcryptjs` with salt round factor `10`.
- **Timing-Safe Comparison**: Utilizes standard bcrypt constant-time comparison to prevent timing side-channel attacks.
- **Account Enumeration Resistance**: `POST /api/v1/auth/login` returns the identical message `"Invalid corporate credentials."` for both nonexistent emails and wrong passwords.

### JSON Web Tokens (JWT)
- **Algorithm**: HMAC-SHA256 (`HS256`).
- **Signature Secret**: Enforced minimum length of 32 characters in staging and production environments.
- **Expiration**: Standard TTL of 24 hours (`24h`).
- **Payload Sanitization**: Tokens carry only minimal identity claims (`userId`, `email`, `role`, `sessionVersion`). Passwords, hashes, and internal metadata are never embedded.

### Session Versioning & Instant Invalidation
- Each staff user record contains an integer `sessionVersion`.
- On password reset, account deactivation, or administrative revocation, `sessionVersion` is bumped.
- In `requireAuth`, the token's `sessionVersion` is validated against the active user's `sessionVersion`. If the token version is stale, access is rejected with `401 Unauthorized`, revoking all active sessions instantly.

---

## 3. Token Integrity for Resets & Invitations

### Cryptographic Workflow
To protect against database breach token misuse:
1. **Generation**: A high-entropy 32-byte cryptographic hex token is generated (`crypto.randomBytes(32).toString('hex')`).
2. **Storage**: The SHA-256 hash of the token (`crypto.createHash('sha256').update(raw).digest('hex')`) is stored in `password_reset_tokens` or `invitations`.
3. **Dispatch**: The raw token is sent to the recipient via email/link.
4. **Validation & Consumption**: When presented at `/reset-password` or `/activate-account`, the incoming raw token is hashed and matched. Once consumed, `is_used` is set to `true`, preventing token reuse or replay attacks.

---

## 4. Role-Based Access Control (RBAC) Matrix

### System Roles
- **`super_admin`**: Full platform authority (Managing Directors, Platform Architects, Co-Founders).
- **`admin`** / **`platform_admin`**: Enterprise operations, onboarding, service toggles, approvals.
- **`ops`**: Bulk provisioning execution, quota adjustments, infrastructure monitoring.
- **`finance`**: Billing reconciliation, invoice records, payment reports.
- **`support`**: Read-only directory access, student access revocation/reactivation.

### Comprehensive Permission Matrix

| Module & Operation | Permission Key | `super_admin` | `admin` | `ops` | `finance` | `support` |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **Colleges** | | | | | | |
| View Colleges | `VIEW_COLLEGES` | Yes | Yes | Yes | Yes | Yes |
| Create College | `CREATE_COLLEGE` | Yes | Yes | No | No | No |
| Update College | `UPDATE_COLLEGE` | Yes | Yes | No | No | No |
| Suspend College | `SUSPEND_COLLEGE` | Yes | Yes | No | No | No |
| Reactivate College | `REACTIVATE_COLLEGE` | Yes | Yes | No | No | No |
| Adjust Quota | `ADJUST_QUOTA` | Yes | Yes | Yes | No | No |
| Toggle College Service | `TOGGLE_SERVICES` | Yes | Yes | Yes | No | No |
| **Students** | | | | | | |
| View Students | `VIEW_STUDENTS` | Yes | Yes | Yes | No | Yes |
| Add Student | `ADD_STUDENT` | Yes | Yes | Yes | No | No |
| Revoke Access | `REVOKE_STUDENT` | Yes | Yes | Yes | No | Yes |
| Reactivate Access | `REACTIVATE_STUDENT` | Yes | Yes | Yes | No | Yes |
| **Provisioning** | | | | | | |
| View Provisioning Jobs | `VIEW_PROVISIONING` | Yes | Yes | Yes | No | No |
| Trigger Provisioning | `TRIGGER_PROVISIONING` | Yes | Yes | Yes | No | No |
| **Approvals** | | | | | | |
| View Approvals | `VIEW_APPROVALS` | Yes | Yes | Yes | Yes | Yes |
| Submit Request | `SUBMIT_APPROVAL` | Yes | Yes | Yes | Yes | Yes |
| Decide Request | `DECIDE_APPROVAL` | Yes | Yes | No | No | No |
| **Finance** | | | | | | |
| View Payments | `VIEW_FINANCE` | Yes | Yes | No | Yes | No |
| Record Payment | `MANAGE_FINANCE` | Yes | Yes | No | Yes | No |
| **Platform Services** | | | | | | |
| Toggle Global Feature | `MANAGE_SERVICES` | Yes | Yes | No | No | No |
| **User Administration** | | | | | | |
| View Corporate Staff | `VIEW_USERS` | Yes | Yes | No | No | No |
| Manage Staff & Invites | `MANAGE_USERS` | Yes | Yes | No | No | No |
| Delete Staff Account | `DELETE_USER` | Yes | Yes | No | No | No |
| **Audit Logs** | | | | | | |
| View Immutable Logs | `VIEW_AUDIT` | Yes | Yes | No | No | No |

### RBAC Safety Invariants
1. **Self-Deletion Guard**: A logged-in administrator is prevented from deleting or deactivating their own account (`req.user.userId === targetUserId` throws `ForbiddenError`).
2. **Privilege Escalation Prevention**: An `admin` cannot grant the `super_admin` role to any user or elevate themselves.
3. **Immutable Actor Attribution**: On audit log recording, the actor ID, name, and role are populated strictly from `req.user`, preventing client-side actor spoofing.

---

## 5. Network Hardening & Attack Defenses

### Helmet Security Headers
Standard security headers applied to all responses:
- `Content-Security-Policy`: Default `'self'` with frame-ancestors `'none'` to prevent clickjacking.
- `Strict-Transport-Security` (HSTS): Enabled in staging/production for 1 year with preload.
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0` (modern standard per OWASP guidelines)

### Cross-Origin Resource Sharing (CORS)
Origin allowlist parsed from `FRONTEND_ORIGIN` (defaulting to `http://localhost:5173`, `http://localhost:3000`). Localhost development ports are optionally allowed via `ALLOW_LOCALHOST_CORS=true`.

### Rate Limiting
- **API Limiter**: 1000 requests per minute per IP address.
- **Auth Limiter**: 20 requests per minute per IP address on sensitive authentication paths (`/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/activate-account`).

### Sensitive Data Redaction
The structured logger (`Pino`) automatically redacts:
- Passwords and password hashes
- Plaintext and hashed tokens
- `Authorization` headers
- Database connection URLs containing credentials
