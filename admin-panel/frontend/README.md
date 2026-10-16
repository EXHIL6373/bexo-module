# BEXO Admin Panel — Central Control Center

The independent frontend module for **BEXO Corporate Administration**. This application provides centralized governance, institutional lifecycle management, quota allocations, platform service entitlement, batch provisioning monitoring, approval adjudication, financial oversight, and system telemetry across the entire BEXO college ecosystem.

---

## 🏛️ Module Separation Architecture

- **Scope**: Company-Wide Administration only (`bexo-admin`).
- **College Portal**: The Institutional College Panel has been separated and is maintained in a dedicated independent repository.
- **Multi-Tenant Protection**: Non-corporate accounts (such as college administrators or departmental staff) are strictly forbidden from accessing administrative functions or internal corporate routes. When unauthenticated or college-scoped accounts attempt access, the gate rejects entry and provides navigation to the external College Portal (`VITE_COLLEGE_PORTAL_URL`).

---

## 🚀 Key Administrative Features

1. **Executive Dashboard**: Real-time cross-institutional KPIs, active seats, license thresholds, and failed batch provisioning monitors.
2. **College Lifecycle Management**: Onboard new academic institutions, update configurations, and issue administrative suspensions with non-destructive state retention (student history and portfolios remain intact).
3. **Seat Quota & Entitlement Governance**: Enforce server-side seat limits, track historical adjustments, and inspect department allocations.
4. **Platform Services Catalog**: Centrally enable, disable, or assign service entitlements (e.g. Portfolio Builder, ATS Resume Engine, Recruiter Suite).
5. **Batch Provisioning Monitor**: Track asynchronous ingestion jobs, inspect failed roll-number records, and trigger batch retries.
6. **Approval Center & Requests Ledger**: Multi-tiered review workflow for quota increases, service activations, and contract extensions.
7. **Commercial Billing & Invoices**: Monitor institutional invoice states (Paid, Pending, Overdue).
8. **Audit & Compliance Security Center**: Structured immutable telemetry for all administrative actions, permissions changes, and quota updates.
9. **Role-Based Access Control**: Zero-trust authentication supporting Super Admin, Platform Admin, Operations, Finance, and Support staff.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript (ES2022)
- **Build Tool**: Vite 8 with HMR
- **Linter**: Oxlint
- **Icons**: Lucide React
- **Styling**: Vanilla CSS Design Tokens (Dark / Enterprise Glassmorphism)

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL for the BEXO REST API backend | `http://localhost:8000/api/v1` |
| `VITE_DEMO_MODE` | Set to `false` for production; `true` for local mock simulation | `false` |
| `VITE_COLLEGE_PORTAL_URL` | URL of the standalone College Portal | `http://localhost:5174` |

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
```bash
npm run dev
```

### 3. Type Checking
```bash
npx tsc -b
```

### 4. Linting
```bash
npm run lint
```

### 5. Production Build
```bash
npm run build
```
Production assets are generated in `dist/`.

---

## 🔌 Backend Integration & API Contract

The application uses a centralized API client with typed services located in `src/services/`.
Detailed request/response schemas, HTTP status codes, error payloads, and integration requirements are documented in:

👉 [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)

---

## 🔒 Security & Session Management

- **Zero Credential Storage**: Passwords and fake credential hashes are never stored in `localStorage` or browser storage.
- **Session Tokens**: Auth tokens are stored securely in memory with sessionStorage session fallback, and transmitted via Bearer Authorization headers or secure HttpOnly cookies (`credentials: 'include'`).
- **401 Unauthorized Interceptor**: When a token expires, the client automatically terminates active state, dispatches an alert, and redirects to `/login`.
- **Safe Reset**: Demo data reset operates strictly in memory and does not execute destructive `localStorage.clear()` commands.
