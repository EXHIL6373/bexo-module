# BEXO College Admin Control Panel & Enterprise Backend

Production-grade, multi-tenant administrative portal and high-performance API for institutional governance, student onboarding, service provisioning, and quota operations across BEXO partner academic institutions.

---

## 🏛️ Architecture Overview

The system consists of two primary layers designed for high security and multi-tenant isolation:

```
clg-panel/
├── backend/            # Express 5 + TypeScript + PostgreSQL + Drizzle ORM
│   ├── src/
│   │   ├── modules/    # Domain modules (auth, college, students, staff, provisioning, requests, notifications, activity)
│   │   ├── db/         # Drizzle schemas, migrations, Neon connection client, and seeds
│   │   ├── middlewares/# Rate limiting, JWT auth, tenant isolation guards, request logging
│   │   ├── shared/     # Response envelopes, AppError hierarchy, Zod validators
│   │   └── docs/       # OpenAPI 3.0 / Swagger specifications
│   └── tests/          # Integration, security, and tenant boundary test suites (Vitest)
│
└── frontend/           # React 18 + TypeScript + Vite + Tailwind CSS / Lucide UI
    ├── src/
    │   ├── components/ # Institutional UI widgets, gauges, data tables, modals
    │   ├── context/    # CollegeContext with real-time sync and audit logging
    │   ├── pages/      # Dashboard, Students, Provisioning, Staff, Requests, Agreements
    │   └── services/   # Centralized ApiClient with JWT lifecycle and session recovery
```

---

## 🚀 Key Features

* **Multi-Tenant Isolation**: Strict cross-tenant boundary validation ensuring college administrators and staff can only access their own institution's students, staff, and quotas.
* **Dual-Specification API Parity**:
  * Frontend Routes: `/api/v1/college/*`, `/api/v1/corporate/*`, `/api/v1/auth/*`
  * Platform Spec Routes: `/api/college/*`, `/api/admin/*`, `/api/college/auth/*`
* **Live Neon Serverless PostgreSQL**: Powered by Drizzle ORM with connection pooling, SSL encryption, and automated migration management.
* **Granular Role-Based Access Control (RBAC)**:
  * `college_admin`: Full institutional management, quota expansion requests, staff invitation.
  * `college_coordinator`: Student roster management and service batch provisioning.
  * `college_staff`: Read-only roster and reports access.
  * Corporate administrators (`super_admin`, `admin`, `ops`) are strictly blocked at the college gateway.
* **Interactive API Documentation**: Embedded Swagger UI accessible at `/docs`.

---

## 🛠️ Quick Start

### Prerequisites
* Node.js v18+ (Node.js v20+ or v22+ recommended)
* PostgreSQL 16+ or Neon Serverless PostgreSQL instance

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your DATABASE_URL in .env
npm run dev
```
Backend runs on `http://localhost:8000`. Health check: `http://localhost:8000/health`. Swagger docs: `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Frontend runs on `http://localhost:5173` (or `http://localhost:5174`).

---

## 🧪 Testing & Verification

Run the comprehensive 40-test automated security and integration suite:
```bash
cd backend
npm test
```

Includes:
- Multi-tenant boundary isolation and foreign student access denial.
- Corporate administrative role escalation blocks.
- Quota threshold enforcement and provisioning locks.
- Complete invitation token and activation lifecycle.

---

## 🔒 Security & Compliance

- **Password Hashing**: Bcrypt with salted rounds.
- **Tokens**: Cryptographically signed HMAC-SHA256 JWTs with embedded institutional claim scopes.
- **Session Revocation**: `sessionVersion` increments trigger instant invalidation across all distributed nodes.
- **Audit Trails**: Every institutional mutation records actor identity, IP, action, and before/after states.

---

## 📄 License
Enterprise Proprietary — BEXO Institutional Solutions.
