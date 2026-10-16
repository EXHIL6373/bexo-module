# BEXO College Panel — Staging Deployment Runbook

**Document Purpose**: Operational runbook for deploying, configuring, verifying, and maintaining the BEXO College Admin Control Panel in a dedicated staging environment.  
**Target Repository**: `https://github.com/EXHIL6373/clg-panel`  
**Current Baseline Commit**: `76dbc31`  
**Target Environments**: Staging (`NODE_ENV=staging`)  
**Document Status**: Prepared for Staging Deployment Execution  

---

## 1. Prerequisites

Before initiating the staging deployment, verify the following prerequisites are met:
- **Node.js**: v20.x LTS or v22.x LTS installed on build agents and container runners.
- **Package Manager**: `npm` v10+ (using `package-lock.json` for reproducible builds).
- **Staging Database**: A dedicated, isolated PostgreSQL 15+ database instance (e.g., Neon Staging project, Supabase Staging, or AWS RDS PostgreSQL).
  > [!IMPORTANT]
  > Never point a staging deployment to the production database or copy unmasked institutional student records into staging.
- **DNS & Domains**:
  - Frontend Staging: `https://staging-college.bexo.edu`
  - Backend Staging API: `https://staging-college-api.bexo.edu`
- **TLS / SSL Certificates**: Active TLS certificates with HTTPS redirection.
- **SMTP Gateway**: Staging transactional email credentials (e.g., SendGrid, Mailtrap, or AWS SES sandbox).

---

## 2. Recommended Hosting Architecture

### Architecture Comparison

| Hosting Component | Recommended Option (PaaS / Rapid Deployment) | Alternative Enterprise Option (AWS Cloud) | Free / Low-Cost Tier Limits |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Cloudflare Pages / Vercel** | AWS S3 + CloudFront CDN + ACM | 100 GB/mo edge bandwidth (Free) |
| **Backend** | **Render Web Service / Railway** | AWS ECS Fargate or App Runner + ALB | 512 MB RAM, 0.5 vCPU (~$7/mo or Free) |
| **Database** | **Neon Isolated Staging Branch** | AWS RDS PostgreSQL (`db.t4g.micro`) | 0.5 GB storage, serverless compute pool |
| **Email Service** | **SendGrid / Resend / Mailtrap** | AWS SES (Sandbox mode for staging) | 100 emails/day free tier |
| **Region Co-location** | Frankfurt (`eu-central-1`) or Mumbai (`ap-south-1`) | Same AWS VPC Subnet | **Mandatory**: Backend and DB must be in same region (<2ms latency) |

### Architecture Diagram
```
                       [ Institutional Browser ]
                                   │
                                   │ HTTPS
                                   ▼
                       [ Edge CDN / CloudFront ]
                       (Frontend SPA: React/Vite)
                                   │
                                   │ API Requests (/api/v1/*)
                                   ▼
                       [ Reverse Proxy / ALB ]
                 (SSL Termination, Rate Limiting, CORS)
                                   │
                                   │ HTTP (X-Forwarded-For, TRUST_PROXY=1)
                                   ▼
                     [ Node.js Backend Container ]
                     (Express 5, Drizzle ORM, TSX)
                                   │
                                   │ TLS verify-full (< 2ms LAN VPC)
                                   ▼
                   [ Dedicated Staging PostgreSQL ]
                   (Isolated Schema, 16 Public Tables)
```

---

## 3. Environment Variable Checklist

Configure these environment variables in your hosting provider's Secret Manager / Environment dashboard.

> [!CAUTION]
> Never commit real secrets or `.env` files to Git. Enter secrets directly via provider consoles or CI/CD secrets.

### 3.1 Backend Staging Variables (`backend`)

| Variable Name | Required | Staging Format / Example | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **YES** | `staging` | Enforces production-grade security, error masking, and TLS. |
| `PORT` | **YES** | `8000` | Internal listening port for Node.js server. |
| `API_PREFIX` | **YES** | `/api/v1` | Common prefix for versioned API routes. |
| `TRUST_PROXY` | **YES** | `1` | Enables reverse-proxy IP tracking behind ALB/Cloudflare. |
| `FRONTEND_ORIGIN` | **YES** | `https://staging-college.bexo.edu` | Comma-separated list of allowed CORS origins. |
| `ALLOW_LOCALHOST_CORS`| NO | `false` | Block arbitrary local origins in staging. |
| `DATABASE_URL` | **YES** | `postgresql://<user>:<secret>@<host>:5432/<db>?sslmode=verify-full` | Dedicated staging PostgreSQL connection URL. |
| `DB_SSL` | **YES** | `true` | Enforces TLS hostname & certificate verification. |
| `DB_CONNECTION_TIMEOUT_MS` | NO | `10000` | Pool client timeout (10 seconds). |
| `USE_POSTGRES_STORE` | **YES** | `true` | Enforces live PostgreSQL; prohibits `MemoryStore`. |
| `JWT_SECRET` | **YES** | `[32+ character random string]` | Cryptographic signing key (e.g. `openssl rand -base64 32`). |
| `JWT_EXPIRES_IN` | NO | `24h` | Token expiration duration. |
| `EMAIL_PROVIDER` | **YES** | `smtp` | Set to `smtp` or `mock` (for headless staging tests). |
| `EMAIL_FROM` | NO | `"BEXO Staging" <no-reply@staging.bexo.edu>` | Sender address for invites and notifications. |
| `SMTP_HOST` | Cond. | `smtp.provider.com` | SMTP host for email dispatch. |
| `SMTP_PORT` | Cond. | `587` | Standard TLS port for SMTP. |
| `SMTP_USER` | Cond. | `<smtp_username>` | SMTP user / API key identifier. |
| `SMTP_PASSWORD` | Cond. | `<smtp_secret_password>` | SMTP password or secret API key. |
| `RATE_LIMIT_MAX` | NO | `1000` | Max requests per rate limit window. |
| `RATE_LIMIT_WINDOW_MS` | NO | `60000` | Rate limit window in milliseconds (1 minute). |
| `LOG_LEVEL` | NO | `info` | Structured logging verbosity level. |

### 3.2 Frontend Staging Variables (`frontend`)

| Variable Name | Required | Staging Format / Example | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | **YES** | `https://staging-college-api.bexo.edu/api/v1` | URL where frontend sends API calls. |
| `VITE_DEMO_MODE` | **YES** | `false` | Must remain `false` to communicate with real backend. |
| `VITE_ADMIN_PORTAL_URL`| NO | `https://staging-college.bexo.edu` | Canonical URL for deep-links and redirects. |

---

## 4. Database Provisioning and Migration Steps

### 4.1 Staging Database Isolation Check
1. Create a fresh PostgreSQL database instance or branch (e.g., `bexo_staging`).
2. Verify connectivity from a secure terminal:
   ```bash
   psql "$STAGING_DATABASE_URL" -c "SELECT current_database(), current_user, version();"
   ```
3. Ensure the connected database name matches the staging database, **not** production.

### 4.2 Execute Database Migrations (Proposed on Staging)
From the repository root or `backend` folder:
```bash
cd backend
npm run db:migrate
```
*Expected Output*:
```text
🚀 Starting database migration runner...
📁 Using migrations directory: /app/src/db/migrations
✅ Database migrations applied and synchronized successfully.
```

### 4.3 Seed Initial Staging Entities (Proposed One-Time Execution)
To populate baseline test institutions (PSG Tech, Kumaraguru) and platform catalog services:
```bash
ALLOW_STAGING_SEED=true npm run db:seed
```
*Note*: The seed script populates synthetic baseline institutions and platform services using `ON CONFLICT DO NOTHING`. It is strictly prohibited in production environments.

### 4.4 Verify Database Consistency (Proposed on Staging)
```bash
npm run db:verify
```
*Expected Result*: `38/38 PASSED` verifying all 16 tables, CRUD lifecycles, and tenant boundaries.

---

## 5. Build and Deployment Execution Commands

### 5.1 Local Verification Pre-Flight (Executed & Passed Locally)
The following commands were run locally on `main` (`76dbc31` + staging hardening):
```bash
# 1. Backend Typecheck
cd backend
npm run typecheck
# Result: 0 errors (Code 0) [EXECUTED]

# 2. Backend Build
npm run build
# Result: tsc compiled cleanly (Code 0) [EXECUTED]

# 3. Backend Test Suite
npm test
# Result: 91 passed across 9 test files (Code 0) [EXECUTED]

# 4. Frontend Security Suite
cd ../frontend
npm run test:security
# Result: 13 passed, 0 failed (Code 0) [EXECUTED]

# 5. Frontend Production Build
npm run build
# Result: Vite production bundle built in 920ms (Code 0) [EXECUTED]
```

### 5.2 Backend Deployment to Staging Container (Proposed Command)
On the staging hosting platform (or inside Dockerfile):
```dockerfile
# Staging Container Build
FROM node:20-alpine AS runner
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
ENV NODE_ENV=staging
EXPOSE 8000

CMD ["npm", "start"]
```
*Command executed on container startup*: `npm start` (executes `tsx src/server.ts`).

### 5.3 Frontend Deployment to Staging CDN (Proposed Command)
```bash
cd frontend
npm ci
npm run build
# Deploy 'dist/' directory to Cloudflare Pages, Vercel, or AWS S3 bucket.
```

---

## 6. Health-Check and Readiness Verification

> [!NOTE]
> The domain `https://staging-college-api.bexo.edu` is an example placeholder domain used for runbook documentation. It is not currently registered, provisioned, or live. Use your actual provisioned staging endpoint.

### 6.1 Readiness Probe (`GET /health`)
```bash
# Replace with your actual provisioned staging backend URL:
curl -i -X GET https://<your-staging-api-host>/health
```
*Expected Response*:
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
X-Request-Id: <uuid>

{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-10-14T21:40:00.000Z",
    "uptimeSeconds": 124,
    "database": "connected"
  }
}
```

### 6.2 CORS Restriction Probe
Verify that untrusted origins are blocked:
```bash
curl -i -X GET https://<your-staging-api-host>/health \
  -H "Origin: https://malicious-site.com"
```
*Expected Response*: Header `Access-Control-Allow-Origin` **must not** appear.

---

## 7. Staging End-to-End Acceptance Tests

Perform these synthetic user journeys on `https://staging-college.bexo.edu`:

| Journey ID | Test Workflow | Expected Result |
| :---: | :--- | :--- |
| **STG-ACC-01** | **College Coordinator Login** | Sign in with `venkatesh.r@psgtech.edu` + valid password. Redirected to College Overview with live institutional metrics. |
| **STG-ACC-02** | **Student Management (CRUD)** | Add synthetic student `STU-STG-001`, verify student appears in roster, update department, revoke account. |
| **STG-ACC-03** | **Staff Invitation Flow** | Invite synthetic coordinator `coord-staging@psgtech.edu`. Verify invitation email or mock log. Activate account using secure token. |
| **STG-ACC-04** | **Quota Expansion Request** | Submit request for +100 seats. Verify request status changes to `Pending`. |
| **STG-ACC-05** | **Multi-Tenant Boundary Guard** | Attempt to view student from College B while logged into College A. Confirm 403 Forbidden alert is rendered. |
| **STG-ACC-06** | **Corporate Role Lockdown** | Attempt to log in with corporate credentials (`kavinbalaji@atbexo.com`) at College Portal. Confirm gateway blocks corporate admins. |
| **STG-ACC-07** | **Graceful Backend Recovery** | Trigger container restart on staging backend. Refresh frontend; confirm data persists and sessions resume without data loss. |

---

## 8. Logs, Observability and Troubleshooting

### 8.1 Structured Log Analysis
All backend logs are output in NDJSON format via Pino. Search for errors using `pino-pretty` or CloudWatch/Datadog filters:
```bash
# Filter errors in staging logs
cat staging.log | grep '"level":50'
```

### 8.2 Common Staging Issues & Solutions
1. **Error**: `Persistent storage required but PostgreSQL connection failed. Server startup aborted.`
   - *Cause*: `DATABASE_URL` is incorrect, IP is not allowlisted, or TLS certificate validation failed.
   - *Fix*: Check connection string, verify `sslmode=verify-full`, and confirm database host is reachable.
2. **Error**: `CORS origin mismatch (blocked)`
   - *Cause*: `FRONTEND_ORIGIN` does not match the frontend domain in the browser.
   - *Fix*: Update `FRONTEND_ORIGIN` in backend secrets to match exact frontend URL with scheme (no trailing slash).
3. **Error**: `JWT secret does not meet staging security requirements`
   - *Cause*: `JWT_SECRET` is shorter than 32 characters or uses a known default key.
   - *Fix*: Generate a strong 32+ character key using `openssl rand -base64 32`.

---

## 9. Rollback and Disaster Recovery

If staging deployment experiences catastrophic regression:
1. **Frontend Rollback**:
   - In Cloudflare Pages / Vercel: Instantly promote preceding deployment build to active alias.
   - In AWS CloudFront: Invalidate cache (`/*`) after reverting S3 objects to previous version.
2. **Backend Rollback**:
   - Revert container image tag to previous stable build.
   - Container runner automatically restarts with prior working image.
3. **Database Rollback**:
   - Schema was designed with additive migrations. If table changes need reversal, apply reverse SQL script or restore from staging pre-migration snapshot:
     ```bash
     pg_restore --clean --if-exists -d "$STAGING_DATABASE_URL" pre_deployment_staging.dump
     ```

---

## 10. Production-Release Prerequisites

Before staging builds can be promoted to production:
- [ ] Staging acceptance tests (STG-ACC-01 through 07) passed with 100% success.
- [ ] Zero unhandled 500 exceptions in staging telemetry over 48 hours.
- [ ] Database backup and restore rehearsed against staging database.
- [ ] Institutional administrative sign-off obtained.
- [ ] Production secrets generated independently from staging secrets.
- [ ] Production database connection and VPC peering verified.

---

## 11. Staging Readiness Status

```
========================================================================
  STAGING DEPLOYMENT DECISION: READY TO DEPLOY TO STAGING
========================================================================
```
*All build artifacts, configuration templates, security controls, and non-destructive local regression tests have executed and passed. Proceed with the staging hosting setup following this runbook.*
