# NEXUS — Inventory, Procurement & Warehouse Intelligence Platform

> **Operations-grade supply-chain intelligence for medium and large organizations.**
> Tells you what will run out, when, why, and what to do — every recommendation explained, every action human-approved.

---

## Architecture

```
nexus/
├── apps/
│   ├── api/          Express + TypeScript + Mongoose (Node.js backend)
│   └── web/          React 18 + Vite + TypeScript + Tailwind CSS
├── packages/
│   └── shared/       Zod schemas + TypeScript types (zero runtime deps)
├── infrastructure/   Docker Compose (Redis)
├── scripts/seed/     Deterministic seed data (500 SKUs, 5 warehouses)
└── docs/             Architecture, DB, API, Forecasting docs
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Radix UI, TanStack Query, Zustand, React Router v7 |
| Backend | Node.js, Express, TypeScript, Mongoose, Zod, Socket.IO, BullMQ |
| Database | MongoDB Atlas |
| Cache / Jobs | Redis (Docker), BullMQ |
| Auth | JWT (15min access) + rotating refresh token in httpOnly cookie, argon2id |
| Charts | D3 (custom, minimal, directly labeled) |
| Animation | Framer Motion (restrained) |
| Icons | Lucide |

---

## Quick Start

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)
- Docker Desktop (for Redis)

### 1. Clone and install
```bash
git clone <repo>
cd nexus
pnpm install
```

### 2. Start Redis
```bash
cd infrastructure
docker-compose up -d
```

### 3. Configure environment
```bash
cp .env.example apps/api/.env
# .env is already pre-configured with Atlas credentials for dev
```

### 4. Start development servers
```bash
# Start both API and Web concurrently
pnpm dev

# Or individually:
pnpm --filter @nexus/api dev        # API: http://localhost:4000
pnpm --filter @nexus/web dev        # Web: http://localhost:5173
```

### 5. API documentation
Swagger UI available at: **http://localhost:4000/api/docs**

---

## Sample Accounts (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@nexus.demo | Demo@12345 |
| Procurement Manager | procure@nexus.demo | Demo@12345 |
| Warehouse Manager | warehouse@nexus.demo | Demo@12345 |
| Finance | finance@nexus.demo | Demo@12345 |
| Auditor | auditor@nexus.demo | Demo@12345 |

---

## Environment Variables

See [`.env.example`](.env.example) for full documentation. Required vars:
- `MONGODB_URI` — MongoDB Atlas connection string
- `REDIS_URL` — Redis URL (default: `redis://localhost:6379`)
- `ACCESS_TOKEN_SECRET` — min 32 chars
- `REFRESH_TOKEN_SECRET` — min 32 chars

---

## Phase Status

| Phase | Status | Contents |
|---|---|---|
| **Phase 1** | ✅ Complete | Monorepo, auth, RBAC, design system, app shell |
| **Phase 2** | ✅ Complete | Products, warehouses, stock ledger, inventory table |
| **Phase 3** | ✅ Complete | Suppliers, PO lifecycle, goods receipts, 3-way match |
| **Phase 4** | ✅ Complete | Forecasting, reorder engine, runway, auto-draft POs |
| **Phase 5** | ✅ Complete | Supplier reliability, simulator, warehouse map |
| **Phase 6** | ✅ Complete | Anomalies, alerts, morning brief, NL search, PWA |
| **Phase 7** | ✅ Complete | Seed scenarios, landing page, tests, docs |

---

## Commands

```bash
pnpm dev              # Start all in dev mode
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Lint all packages
pnpm format           # Format with Prettier

# Per-package
pnpm --filter @nexus/api test
pnpm --filter @nexus/web build
```

---

## Design Principles

- **Editorial + industrial**: warm off-white paper (#F6F4EF), signal orange accent (#E05C28), dense information-rich layout
- **Typography**: Fraunces (display) + Inter Tight (UI) + JetBrains Mono (numbers, SKUs)
- **No lorem ipsum, no placeholder analytics** — every number is computed from data
- **Every recommendation has WHAT / WHY / EVIDENCE / IMPACT / ACTION** and requires human approval
- **Intelligence appears naturally** — no "AI says..." phrasing

---

## Security

- Argon2id password hashing (64MiB memory, 3 iterations)
- JWT: 15-minute access tokens, 7-day rotating refresh tokens (SHA-256 hashed in DB)
- httpOnly cookies for refresh tokens
- RBAC enforced server-side on every route (permission matrix in `/apps/api/src/permissions.ts`)
- Rate limiting: 100 req/15min globally, 20 req/15min for auth endpoints
- helmet, CORS, input sanitization (Zod on all inputs)
- Multi-tenant: every document carries `organizationId`, enforced in query layer
- Audit log: append-only, records every mutation

---

## Currency & Locale

- Default currency: **INR (₹)**
- Number formatting: Indian locale (lakh/crore)
- GST-ready: GST rate per product, GSTIN stored on suppliers
- Fiscal year: April start (configurable)
- Timezone: Asia/Kolkata (configurable)
