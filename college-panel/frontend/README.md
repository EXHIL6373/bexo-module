# BEXO College Panel — Institutional Operations Center

The independent frontend module for **BEXO Institutional College Administration** (`bexo-clg-admin`).
This portal is designed exclusively for approved higher-education academic institutions to manage student digital identities, bulk student enrollment, service entitlements, quota allocations, and day-to-day college operations under strict institutional isolation.

---

## 🏛️ Module Architecture & Separation

- **Scope**: Dedicated strictly to **College Operations** for approved institutions (`bexo-clg-admin`).
- **Corporate Admin Panel**: Corporate administration, company-wide management, global billing, and central control are maintained in the separate `bexo-admin` module.
- **Zero Administrative Bleed**: All company-wide administrative controls, admin dashboards, admin sidebars, admin modals, and cross-college navigation have been completely excised from this repository.
- **Corporate Admin Rejection**: Central BEXO corporate staff attempting to log into this portal are automatically rejected with a `403 Forbidden` Institutional Access Restriction.

---

## 🚀 Key Institutional Features

1. **College Operations Dashboard (`/college/dashboard`)**:
   - Institutional KPIs: active enrolled students, total roster count, seat quota remaining, and percentage quota consumed.
   - Quota warnings and agreement expiry alerts.
   - Recent provisioning jobs and quick action workflows.
2. **Student Directory & Detail View (`/college/students`, `/college/students/:id`)**:
   - Searchable, filterable directory of enrolled students.
   - Comprehensive student drilldown with service entitlements and activity logs.
   - Immediate `403 Access Denied` tenant isolation protection against foreign student inspection.
3. **Bulk Student Onboarding Wizard (`/college/students/import`)**:
   - 3-step high-throughput CSV / XLSX ingestion engine.
   - Pre-submission validation, schema verification, and file/roster duplicate roll-number detection.
   - Downloadable CSV error reports and official CSV schema templates.
4. **Service Provisioning Engine (`/college/give-access`, `/college/provisioning`)**:
   - Multi-path provisioning workflow: individual student picker, roll number range, or batch.
   - Seamless quota check before issuing BEXO Portfolio or ATS Smart Resume entitlements.
   - Background job tracker with failed record inspection and single-click retry capabilities.
5. **Entitlements & Visibility (`/college/entitlements`, `/college/services`)**:
   - Real-time audit view of active student service licenses.
   - Institutional quota usage and department limits.
6. **Staff & Access Governance (`/college/staff`)**:
   - Role-Based Access Control (RBAC) supporting `College Admin`, `Department Coordinator`, and `College Staff`.
   - Single-use invite token generation and account activation workflow.
   - Strict role escalation prevention (cannot create or assign corporate admin roles).
7. **Desk & Requests Ledger (`/college/requests`)**:
   - Structured submission workflows for quota expansions, service additions, and MOU renewals.
8. **MOU & Institutional Agreements (`/college/agreement`)**:
   - Contract validity status, start/end dates, renewal countdown, and formal renewal requests.
9. **Notifications, Announcements & Tasks (`/college/notifications`, `/college/announcements`, `/college/tasks`)**:
   - Real-time operational communications, platform alerts, and deadline tracking.
10. **Institutional Settings & Profile (`/college/settings`, `/college/profile`, `/college/support`)**:
    - Permitted institutional profile maintenance, contact information, and security settings.

---

## 🛡️ Multi-Tenant Isolation & Security Guarantees

All state mutations, queries, and API operations derive tenant context exclusively from the verified server session:

1. **Zero Client Trust**: Client-supplied `collegeId` parameters are never trusted. All queries are bound to the authenticated user's `token.collegeId`.
2. **Cross-Tenant Isolation Gate**: Attempting to query, inspect, or modify another college's student or staff immediately triggers a `403 Forbidden` barrier.
3. **Suspension Lockdown**: When an institution is suspended by BEXO central authorities, the portal automatically enters read-only mode, and student provisioning is locked. Student portfolios and historical resumes remain permanently preserved.
4. **Role Escalation Protection**: College administrators are strictly restricted to institutional roles (`college_coordinator`, `college_staff`) and cannot elevate any user to corporate privileges (`super_admin`, `admin`).
5. **Secure Session Management**: Credentials and fake password hashes are never written to `localStorage`. Logout invalidates the active server session and clears in-memory tokens without destructive `localStorage.clear()` operations.

---

## 💻 Tech Stack

- **Framework**: React 19 + TypeScript (ES2022)
- **Bundler**: Vite 8 with HMR
- **Linter**: Oxlint
- **Icons**: Lucide React
- **Styling**: Vanilla CSS Design Tokens (Enterprise Institutional UI)

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
| `VITE_ADMIN_PORTAL_URL` | Reference URL for the Corporate Admin Console | `http://localhost:5173` |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The portal will be available at `http://localhost:5173/` (or `5174` if port 5173 is occupied).

### 3. Type Checking
```bash
npm run build
```

### 4. Code Linting
```bash
npm run lint
```

### 5. Automated Multi-Tenant Security Verification Suite
```bash
npm run test:security
```

---

## 📖 Backend Integration & API Specification

The application communicates through a centralized API client with typed services located in `src/services/`.
The complete REST API contract, request/response payloads, and status codes are documented in:

📄 [`docs/COLLEGE_API_CONTRACT.md`](docs/COLLEGE_API_CONTRACT.md)
