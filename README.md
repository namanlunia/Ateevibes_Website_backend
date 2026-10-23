# Ateevibes E-Commerce Platform

A production-ready e-commerce platform and management suite built specifically for **Ateevibes** — a contemporary luxury menswear and streetwear brand.

The system adheres strictly to the Ateevibes brand identity:
- **Matte Black** (`#111111`) & **Deep Charcoal** (`#191919`)
- **Champagne Gold** (`#C9A45C`) & **Light Champagne** (`#E2CB97`)
- **Warm Ivory** (`#F5F1E8`) & **Warm Sandstone** (`#D8D2C7`)
- **Strict Policy Accuracy**: Zero false 7-day return claims.

---

## Architecture Overview

This monorepo houses the complete backend services, shared type libraries, and admin management web application:

```
ateevibes-backend/
├── apps/
│   ├── api/                  # NestJS 10 REST API service
│   │   ├── prisma/           # PostgreSQL schema (22 models), migrations, seed scripts
│   │   ├── src/              # Modular enterprise architecture
│   │   │   ├── common/       # RBAC guards, JWT decorators, Prisma service
│   │   │   ├── modules/      # Auth, Users, Products, Categories, Collections,
│   │   │   │                 # Inventory, Checkout, Orders, Payments, Shipments,
│   │   │   │                 # Customers, Support, Analytics, Settings, Homepage CMS
│   │   │   └── main.ts       # Global validation pipes, CORS, Swagger OpenAPI setup
│   │   └── test/             # Vitest automated test suite (Auth, Checkout, Inventory, Orders, Payments)
│   │
│   └── admin/                # Ateevibes Command Center (React 18 + Vite + Tailwind CSS)
│       ├── public/brand/     # High-resolution brand logo & assets
│       ├── src/
│       │   ├── api/          # TanStack Query hooks & Axios client
│       │   ├── components/   # Modern luxury UI (Revenue charts, status badges, modal dialogs)
│       │   ├── pages/        # Login, Overview, Products, Inventory, Orders,
│       │   │                 # Collections, Customers, Support Desk, Settings
│       │   └── store/        # Zustand authentication & session management
│       └── tailwind.config.js# Custom Ateevibes luxury color tokens & typography
│
├── packages/
│   └── shared/               # Shared TypeScript types, enums, DTO interfaces
│
├── docker-compose.yml        # PostgreSQL 16 development stack
├── package.json              # NPM workspaces orchestration
└── tsconfig.base.json        # Unified TypeScript configuration
```

---

## Key Features

### 1. Concurrency-Safe Inventory Reservations
- **Atomic Stock Locks**: When a shopper starts checkout, variant inventory is reserved for 15 minutes (`status: active`).
- **Payment Commit**: Upon valid Razorpay webhook / HMAC signature verification, reserved stock is converted into permanent inventory deduction (`InventoryMovementType: sale`).
- **Auto-Release**: Abandoned or cancelled orders trigger reservation release back to available stock.

### 2. State-Machine Driven Order Lifecycle
Orders flow through validated transitions:
`placed` ➔ `packed` ➔ `shipped` ➔ `out_for_delivery` ➔ `delivered` (or `cancelled`).
Customers can look up orders publicly using order ID and phone/email without requiring authentication.

### 3. Payment Verification
- Supports Razorpay integration with server-side HMAC SHA-256 signature verification (`crypto.timingSafeEqual`).
- Graceful offline and mock verification modes for sandbox testing and local demonstration.

### 4. Admin Management Center
- Refined luxury dashboard matching the black & champagne gold brand aesthetic.
- Interactive SVG metrics charts (Gross Revenue, Net Revenue, Orders, Average Order Value).
- Real-time catalog editor, inventory restocking triggers, order status update actions, customer profiles, and support ticket triage.

---

## Quick Start Guide

### Prerequisites
- Node.js 18+ (Node 20 LTS recommended)
- Docker & Docker Compose (for local PostgreSQL)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/namanlunia/Ateevibes_Website_backend.git
cd Ateevibes_Website_backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` inside `apps/api`:
```bash
cp .env.example apps/api/.env
```
Default configuration:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ateevibes_db?schema=public"
JWT_SECRET="ateevibes_super_secret_jwt_key_2026"
JWT_EXPIRATION="7d"
CORS_ORIGIN="http://localhost:5173,http://localhost:5174,http://localhost:3001"
```

### 3. Start Database Stack
```bash
docker-compose up -d
```

### 4. Run Migrations & Seed Data
```bash
# Generate Prisma Client
npm --workspace=apps/api run prisma:generate

# Apply migrations
npm --workspace=apps/api run prisma:migrate

# Seed demo categories, products, inventory, and settings
npm --workspace=apps/api run seed

# Bootstrap initial super-admin account (admin@ateevibes.com / Ateevibes@Admin2026!)
npm --workspace=apps/api run bootstrap:admin
```

### 5. Launch Development Servers
```bash
# Run all services concurrently (API on port 3000, Admin on port 5174)
npm run dev

# Or run services individually:
npm --workspace=apps/api run dev      # API -> http://localhost:3000
npm --workspace=apps/admin run dev    # Admin -> http://localhost:5174
```

---

## API Documentation (Swagger)
Once the backend API is running, access interactive OpenAPI documentation and test endpoints at:
👉 **`http://localhost:3000/api/docs`**

---

## Automated Test Suite
Run the backend automated Vitest test suite:
```bash
npm --workspace=apps/api run test
```
**Test Coverage Includes**:
- `auth.spec.ts`: Password hashing, token generation, role guards
- `checkout.spec.ts`: Server-side pricing verification, fee calculations, stock reservation
- `inventory.spec.ts`: Atomic stock reservation, concurrent holds, movement logs
- `orders.spec.ts`: State machine validation, illegal transition rejection
- `payments.spec.ts`: Genuine vs tampered HMAC SHA-256 signature verification

---

## Storefront API Surface
The authoritative contract lives in packages/shared/src/contract.ts (API_ROUTES, PROMO_CODES, SHOPPING_MODEL, computeShippingAndTotals, and checkout DTOs):
- **Auth**: `POST /auth/customer/login`, `POST /auth/customer/signup`, `POST /auth/refresh`, `GET /auth/me`
- **Products**: `GET /products`, `GET /products/:slug`, `GET /products/pno/:pno`, `GET /products/:id/related`, `GET /products/curated/bestsellers`, `GET /products/curated/new-arrivals`
- **Checkout**: `POST /checkout/quote`, `POST /checkout/create-order`
- **Payments**: `POST /payments/create-order`, `POST /payments/verify`
- **Orders**: `GET /orders/lookup?contact=...`, `GET /orders/my-orders`, `GET /orders/:id`

> **Warning: Mock / Demo Mode is Dev-Only**
> Mock fallbacks (disconnected Prisma database simulation, placeholder Razorpay signatures `demo_verified`, unsigned webhooks) operate **strictly** when `NODE_ENV !== "production"`. In production, real PostgreSQL persistence, genuine Razorpay HMAC SHA-256 signatures, and production JWT secrets are strictly enforced fail-fast.

---

## License
Proprietary © 2026 Ateevibes. All rights reserved.
