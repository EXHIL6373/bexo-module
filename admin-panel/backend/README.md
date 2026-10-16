# BEXO Central Admin Panel — Production Backend Engine

> Enterprise Corporate Administration & Ecosystem Orchestration Platform for BEXO.

---

## 1. Overview & Architecture Summary

The **BEXO Admin Panel Backend** is a high-performance, strictly typed, modular Node.js/Express service built with TypeScript. It acts as the central corporate nervous system for BEXO, managing institutional onboarding, student quotas, staff access, bulk provisioning orchestration, invoice payments, and audit logs.

### Key Architectural Pillars
- **Strict Multi-Tenant Perimeter Guard**: Institutional college accounts (`college_admin`, `college_staff`, or any user with a non-null `collegeId`) are unconditionally blocked at login with HTTP `403 Forbidden`. Central administration is strictly reserved for corporate headquarters personnel.
- **Repository Pattern Abstraction**: A unified `AdminRepository` interface decouples business logic from storage. Supports both PostgreSQL (via Drizzle ORM with connection pooling) and an in-memory repository for zero-dependency local development and sub-second test execution.
- **Contract-Strict Response Envelope**: All API responses strictly follow the standardized envelope `{ success, data, message, meta }` and error envelope `{ success: false, statusCode, message, errors }`.
- **Zero Plaintext Secrets**: Passwords are securely hashed with `bcryptjs` (work factor 10), tokens are signed with HMAC-SHA256, and reset/invite tokens are hashed via SHA-256 before database storage.
- **Append-Only Audit Ledger**: Every mutation (quota alteration, service toggle, user deactivation, approval decision) records actor ID, IP address, timestamp, action, and JSON snapshot payload.

---

## 2. Directory Structure

```
backend/
├── src/
│   ├── config/             # Environment validation (Zod) & RBAC permission constants
│   ├── db/
│   │   ├── schema/         # Drizzle ORM PostgreSQL schemas (15 tables)
│   │   ├── repository/     # Repository pattern (types, MemoryRepository, DrizzleRepository)
│   │   ├── client.ts       # PostgreSQL connection pool & health probe
│   │   ├── migrate.ts      # Automated database migration runner
│   │   ├── seed.ts         # Safe development database seeder
│   │   └── seedData.ts     # Seed fixtures
│   ├── integrations/       # College Panel & Mobile App adapters + service auth
│   ├── middlewares/        # Auth, RBAC, Rate Limiting, Request Logging, Error Handling, Security
│   ├── modules/            # Feature modules (controller, service, routes, schema)
│   │   ├── approvals/      # Multi-stage corporate approvals & quota expansion
│   │   ├── audit/          # Immutable administrative audit ledger
│   │   ├── auth/           # Login, logout, session versioning, password reset
│   │   ├── colleges/       # Institutional directory, quotas, suspension & reactivation
│   │   ├── invitations/    # Corporate staff cryptographic invitation lifecycle
│   │   ├── notifications/  # Corporate alert dispatching & read receipts
│   │   ├── payments/       # Invoicing & payment reconciliation
│   │   ├── provisioning/   # Batch student entitlement provisioning engine
│   │   ├── services/       # Platform-wide feature toggles
│   │   ├── students/       # Student identity & entitlement directory
│   │   ├── system/         # Platform telemetry & system health metrics
│   │   ├── templates/      # App template catalog
│   │   └── users/          # Corporate staff user management
│   ├── routes/             # Central API routing (/api/v1)
│   ├── shared/             # Error classes, response envelopes, tokens, logger, email service
│   ├── app.ts              # Express application configuration & middleware pipeline
│   └── server.ts           # Server bootstrap, port binding, and graceful shutdown
├── docs/                   # Full documentation (Architecture, API, Database, Security, Integration)
├── tests/                  # Integration and security test suites (Vitest + Supertest)
├── .env.example            # Environment template with safe placeholders
├── drizzle.config.ts       # Drizzle Kit configuration
├── package.json            # Dependencies and npm run scripts
├── tsconfig.json           # TypeScript configuration
└── vitest.config.ts        # Vitest testing configuration
```

---

## 3. Quickstart & Local Setup

### Prerequisites
- **Node.js**: v20.0.0 or higher (v24 LTS recommended)
- **npm**: v10.0.0 or higher
- **PostgreSQL**: v14+ (optional for dev; in-memory store works out of the box)

### Installation
```bash
# Navigate to backend directory
cd admin-panel/backend

# Install dependencies
npm install
```

### Environment Configuration
```bash
# Copy template to .env
cp .env.example .env
```
For local development without PostgreSQL, leave `USE_POSTGRES_STORE=false`. The system will automatically use the high-performance in-memory repository pre-populated with BEXO seed data.

### Running the Development Server
```bash
npm run dev
```
The server will start at `http://localhost:8080`.
- **Liveness Probe**: `GET http://localhost:8080/health`
- **API Base**: `http://localhost:8080/api/v1`

---

## 4. Available NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts server in watch mode using `tsx` |
| `npm run build` | Compiles TypeScript into JavaScript in `dist/` |
| `npm start` | Runs compiled production server from `dist/server.js` |
| `npm test` | Runs complete Vitest test suite (integration & security) |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run typecheck` | Validates TypeScript types across the entire project |
| `npm run db:generate` | Generates SQL migrations from Drizzle schemas |
| `npm run db:migrate` | Runs pending SQL migrations against PostgreSQL |
| `npm run db:seed` | Safely seeds development database (blocked in production) |
| `npm run db:verify` | Verifies PostgreSQL connection and table existence |

---

## 5. Development Seed Accounts

The development store is pre-loaded with the following corporate accounts:

| Email | Password | Role | Designation |
|---|---|---|---|
| `kavinbalaji@atbexo.com` | `AdminPassword123!` | `super_admin` | Co-Founder & Chief Product Officer |
| `ezhil@atbexo.com` | `AdminPassword123!` | `super_admin` | Managing Director & Platform Architect |
| `rajesh.admin@atbexo.com` | `AdminPassword123!` | `admin` | Enterprise Success Lead |
| `suresh.ops@atbexo.com` | `AdminPassword123!` | `ops` | Lead Infrastructure Engineer |
| `priya.finance@atbexo.com` | `AdminPassword123!` | `finance` | Senior Billing Operations Manager |
| `anand.support@atbexo.com` | `AdminPassword123!` | `support` | Level-2 Tier Lead |

> [!NOTE]
> Attempting to log in with college accounts (e.g. `psg.admin@psgtech.ac.in`) will be immediately rejected with HTTP 403 Forbidden.

---

## 6. Documentation Index

- [System Architecture](file:///d:/ACEDIGITALS/admin-panel/backend/docs/ARCHITECTURE.md)
- [REST API Reference](file:///d:/ACEDIGITALS/admin-panel/backend/docs/API.md)
- [Database Schema & Migrations](file:///d:/ACEDIGITALS/admin-panel/backend/docs/DATABASE.md)
- [Security & RBAC Specification](file:///d:/ACEDIGITALS/admin-panel/backend/docs/SECURITY.md)
- [Future Integration Contract (College Panel & Mobile App)](file:///d:/ACEDIGITALS/admin-panel/backend/docs/INTEGRATION_CONTRACT.md)
