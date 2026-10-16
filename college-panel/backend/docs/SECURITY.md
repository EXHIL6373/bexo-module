# BEXO College Admin Backend — Multi-Tenant Security & Defense Architecture

---

## 1. Zero Trust in Client-Supplied Identifiers

Client applications must never be trusted to dictate institutional data scoping.
1. The `collegeId` is extracted exclusively from cryptographically verified JWT tokens.
2. Even if a malicious request injects a `collegeId` query parameter, URL segment, or request body payload targeting another college, middleware automatically overwrites the identifier with the trusted session token identity.
3. Every repository and database query enforces scoping:
   ```sql
   SELECT * FROM students WHERE college_id = :authenticated_college_id;
   ```

---

## 2. Cross-Tenant Data Isolation

- Attempting to inspect or mutate records belonging to another institution (e.g., `GET /college/students/:id` where `:id` belongs to another college) triggers an immediate **HTTP 403 Forbidden** security gate.
- Every cross-tenant access attempt is recorded in the security audit log with actor identity, target record, timestamp, and client IP address.

---

## 3. Role Escalation Prevention

- College Administrators are strictly confined to institutional operations.
- Attempts to invite corporate accounts (`super_admin`, `admin`, `ops`, `finance`, `support`) are rejected with **HTTP 403**.
- Attempts to mutate existing staff roles to corporate administration are rejected with **HTTP 403**.
- College Administrators cannot access endpoints under `/api/v1/corporate/*`.

---

## 4. Quota Enforcement & Atomic Seat Accounting

- Client applications cannot claim seat availability.
- Before provisioning batches are executed, remaining quota (`allocated - used`) is validated on the server.
- Quota decrements are executed atomically.
- Exceeding quota immediately rejects the request with HTTP 400 without partial or phantom seat grants.

---

## 5. Security Headers & Defense In Depth

- **Helmet**: Enforces HTTP security headers.
- **CORS**: Strict origin whitelist matching `FRONTEND_ORIGIN`.
- **Rate Limiting**:
  - Global: 1,000 requests / 60 seconds.
  - Auth Gateway: 50 requests / 15 minutes.
- **Payload Sanitization**: Request bodies restricted to 10MB; validated against strict Zod schemas.
- **Password Security**: Passwords hashed with bcrypt (10 rounds).
