# BEXO College Admin Backend — Integration Boundaries & Future Mobile Contract

---

## 1. Corporate Admin Integration Boundary

The College Admin backend is decoupled from corporate administrative consoles while preparing shared data surfaces for the central platform:

### Corporate Operations Prepared:
1. **Institution Onboarding & Approval**: `POST /corporate/colleges`
2. **Institutional Suspension & Lockout**: `POST /corporate/colleges/:id/suspend`
3. **Institutional Reactivation**: `POST /corporate/colleges/:id/reactivate`
4. **Quota Governance & Adjustment**: `PATCH /corporate/colleges/:id/quota`
5. **Operational Request Review**: `POST /corporate/requests/:id/review` (Approve / Reject)

---

## 2. Future Main BEXO Mobile Application Integration

When connecting the student-facing BEXO mobile app to this backend:

### 1. Canonical Student Identity
- Students enrolled through institutional rosters (`students` table) are assigned institutional identifiers (`id: stu-xxx`).
- The mobile app establishes consumer accounts through mobile OTP and email verification.
- Linkage rule: Link the student's mobile user ID (`bexo_user_id`) to the `students` record by matching verified institutional email or verified roll number.
- **Rule**: Do not create duplicate student profiles. An enrolled student linking their mobile account must retain the entitlements granted by their institution.

### 2. Entitlement Consumption by Mobile App
- The mobile app inspects active institutional entitlements via:
  ```http
  GET /api/v1/mobile/students/entitlements
  ```
- Entitlements (e.g. `BEXO Portfolio`, `ATS Resume Engine`) unlock premium features, custom subdomains, and NFC card linking directly in the student's mobile experience.
- When an institution is suspended or student access is revoked, active entitlements reflect `status: 'Revoked'` or `'Suspended'`, gracefully downgrading the mobile app experience to basic consumer tier without deleting portfolio data.

### 3. Step-by-Step Mobile Integration Checklist
1. Deploy shared PostgreSQL database cluster.
2. Maintain single canonical `users` table for mobile and corporate, referencing `students` via foreign key `user_id`.
3. Provide shared JWT signing secrets or asymmetric key pairs (RS256) for token verification across services.
4. Apply automated rollback plan preserving portfolio domains if student rosters change batches.
