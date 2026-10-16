# BEXO College Admin Backend

Production-ready, multi-tenant backend for the BEXO College Admin Control Panel built with Express 5, TypeScript, PostgreSQL, Drizzle ORM, Zod, and JWT authentication.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```
Server starts on `http://localhost:8000` with API prefix `/api/v1`.

### 4. Interactive OpenAPI Docs
Open `http://localhost:8000/docs` in your browser.

---

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server with file watch (`tsx`) |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm run start` | Run compiled production bundle |
| `npm run typecheck` | Run TypeScript type checks (`tsc --noEmit`) |
| `npm test` | Run all automated Vitest tests (unit + integration + security) |
| `npm run test:security` | Run multi-tenant security verification test suite |
| `npm run db:generate` | Generate SQL migrations using Drizzle Kit |
| `npm run db:migrate` | Apply migrations to PostgreSQL |

---

## Architecture & Documentation

- [API Specification](docs/API.md)
- [Database Schema & Migrations](docs/DATABASE.md)
- [Authentication & Account Lifecycle](docs/AUTHENTICATION.md)
- [Multi-Tenant Security Controls](docs/SECURITY.md)
- [Corporate & Mobile App Integration Plan](docs/INTEGRATION.md)
