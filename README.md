# Cafeteria Management System

> A full-stack cafeteria management platform that pairs a Next.js 16 dashboard with an Express/MongoDB backend and a horizontal fragmentation strategy for scalable ordering.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technologies Used](#technologies-used)
3. [Core Code Explanation](#core-code-explanation)
4. [Project Structure](#project-structure)
5. [Database Design & Fragmentation](#database-design--fragmentation)
6. [Setup & Installation](#setup--installation)
7. [Dependencies](#dependencies)
8. [How the Project Works (Flow Explanation)](#how-the-project-works-flow-explanation)
9. [Code-Level Highlights](#code-level-highlights)
10. [Common Errors & Fixes](#common-errors--fixes)
11. [Developer Guide](#developer-guide)
12. [Credits & License](#credits--license)

---

## Project Overview

### What this project delivers
- A self-service **ordering portal** focused on Bengali cuisine with menu filtering by time slot (morning, day, evening).
- A role-aware **admin control center** for approvals, menu management, order fulfillment, and operational metrics.
- A **multi-database MongoDB architecture** that shards users, orders, and notifications across three fragments while centralizing the menu catalog.

### End-to-end workflow
1. Users sign up, log in, and browse menu cards tailored to each time period.
2. Orders originate in the Next.js App Router UI, flow through proxy handlers, and reach the Express API.
3. The backend determines which MongoDB fragment should store the data, persists the order along with a product snapshot, and generates notifications.
4. Admins review pending orders, manage inventory, and monitor analytics via the admin-only dashboard.

### Feature highlights
- **Authentication & approvals**: JWT-based login, role-based redirects, and manual review for teacher/staff accounts.
- **Menu management**: CRUD, availability toggles, file uploads, and time-slot classification.
- **Order lifecycle**: Pending → accepted/rejected → served → completed, with real-time notifications.
- **Analytics dashboard**: Aggregates counts across all fragments for admins while serving self-service stats to end users.
- **Fragment-aware persistence**: Distributes heavy read/write collections to optimize load and future growth.

---

## Technologies Used

### Frontend Stack
- **Next.js 16 (App Router)** – Server-first React framework, handles routing and API proxies.
- **React 19** – Declarative UI components.
- **TypeScript 5** – Static typing for safer refactors.
- **Tailwind CSS 4 + tailwindcss-animate** – Utility styling with animation primitives.
- **Radix UI + shadcn/ui** – Accessible component primitives and prebuilt form/layout elements.
- **React Hook Form + Zod** – Declarative form handling with schema validation.
- **Lucide React + date-fns** – Iconography and date formatting helpers.

### Backend Stack
- **Node.js 18 / Express 4.18** – REST API server with middleware pipeline.
- **MongoDB + Mongoose 7** – Document database with schema enforcement.
- **bcryptjs + jsonwebtoken** – Secure password hashing and stateless auth tokens.
- **multer** – Handles multipart uploads for menu images.
- **cors + dotenv** – CORS headers and environment configuration.

### Tooling & Utilities
- **pnpm** – Monorepo-friendly package manager.
- **concurrently** – Starts both app servers from one command.
- **nodemon** – Auto-restart the Express server in dev mode.
- **ESLint / TypeScript** – Linting and type safety in the App Router.

Each technology supports rapid iteration while protecting production concerns: Next.js App Router enables full-stack rendering, Express keeps APIs extensible, and MongoDB fragmentation sustains high-volume ordering during peak meal times.

---

## Core Code Explanation

### Authentication and session proxying
- `app/api/auth/login/route.ts` forwards login credentials from the App Router to the Express API so cookies and tokens stay within the Next.js domain:

```1:20:app/api/auth/login/route.ts
const response = await fetch(`${EXPRESS_BACKEND_URL}/api/auth/login`, { method: "POST", ... })
```

- `backend/middleware/authMiddleware.js` verifies JWTs and exposes `req.user` (including the user’s fragment key) to downstream routes. `adminOnly` guards administrative endpoints.

### Fragmentation orchestration
- `backend/config/dbManager.js` decides which MongoDB fragment to use based on role, department, email hash, or order timestamp. It builds fragment-specific URIs and caches connections.

```8:52:backend/config/dbManager.js
if (role === "teacher" || department.includes("teacher")) { return "db2" }
```

- `backend/utils/modelFactory.js` instantiates per-fragment Mongoose models (e.g., `User_Frag2`, `Order_Frag3`) and provides helpers like `queryAllDatabases` for admin reports.

### Ordering & notifications
- `backend/routes/orderRoutes.js` creates orders, computes totals, persists menu snapshots, and emits notifications for both admins (stored in db1) and customers (stored in their fragment). Admin routes iterate over fragments to list or mutate orders.
- `app/orders/page.tsx` fetches `/api/orders/my-orders`, rehydrates product snapshots, and renders responsive cards with status badges sourced from `components/status-badge.tsx`.

### Admin console
- `app/admin/food-items/page.tsx` manages menu items with search, time-slot filtering, and optimistic UI feedback.
- `app/admin/users/page.tsx`, `app/admin/orders/page.tsx`, and `app/admin/notifications/page.tsx` wrap approval flows, lifecycle actions, and real-time alert handling.

### Shared utilities
- `lib/api.ts` injects the JWT, normalizes base URLs, and disables caching for every client-side fetch.
- `hooks/use-toast.ts` and `components/ui/toaster.tsx` deliver consistent toast notifications after key actions.

---

## Project Structure

```
.
├── app/                        # Next.js App Router entrypoint
│   ├── admin/                  # Admin-only sections (users, orders, menu, notifications)
│   ├── api/                    # Edge functions that proxy to Express endpoints
│   ├── dashboard/              # Authenticated user analytics
│   ├── department/             # Department landing content
│   ├── login/, signup/         # Auth flows
│   ├── orders/, products/      # Ordering experiences
│   ├── profile/                # User profile & password updates
│   ├── globals.css             # Global styles
│   └── layout.tsx              # Root layout with providers and Toaster
│
├── backend/                    # Express API service
│   ├── config/dbManager.js     # Fragment-aware connection & routing logic
│   ├── middleware/authMiddleware.js
│   ├── models/schemas.js       # Shared Mongoose schemas (User, Product, Order, Notification)
│   ├── routes/*.js             # REST endpoints (auth, users, products, orders, dashboard, notifications)
│   ├── utils/modelFactory.js   # Dynamic model creation + cross-fragment querying
│   ├── scripts/                # `createAdmin.js`, `seedBengaliFoods.js`
│   └── server.js               # Express bootstrap and route mounting
│
├── components/                 # Reusable React components (sidebar, navbar, shadcn UI)
├── hooks/                      # Custom hooks (debounce, toast)
├── lib/                        # Client utilities (API helper, misc functions)
├── public/                     # Static assets and placeholders
├── styles/                     # Tailwind override files
├── frontend/                   # Legacy CRA-style frontend kept for reference
├── FRAGMENTATION_SUMMARY.md    # Standalone shard reference
└── PROJECT_REPORT.md           # Extended architecture report
```

**Communication flow:** The App Router makes calls via `lib/api.ts` to `/app/api/*` endpoints, which proxy to `backend/server.js`. Responses return through Next.js, allowing consistent headers, cookies, and middleware execution.

---

## Database Design & Fragmentation

### Distribution matrix
| Collection              | db1 (`cafeteria-db1`)      | db2 (`cafeteria-db2`)            | db3 (`cafeteria-db3`)            |
|-------------------------|----------------------------|----------------------------------|----------------------------------|
| Users – admins/students | ✅ 100%                    | ❌                                | ❌                                |
| Users – teachers        | ❌                          | ✅ 100%                           | ❌                                |
| Users – staff/regular   | ❌                          | ⚖️ ~50% (email hash even)         | ⚖️ ~50% (email hash odd)          |
| Products (menu)         | ✅ 100% (source of truth)  | ❌                                | ❌                                |
| Orders                  | ✅ referenced for analytics| ✅ time-slot & user fragment      | ✅ time-slot & user fragment      |
| Notifications           | ✅ admin feed               | ✅ user-specific                  | ✅ user-specific                  |

### Fragmentation rules
- **User placement:** Role and department decide the fragment. Regular users hash by email to spread across db2/db3. Admins and staff default to db3; students stay in db1 for quicker verification.
- **Menu placement:** Menu items live exclusively in db1 so every order references a canonical product.
- **Order placement:** Orders shard by the local creation time using `getDatabaseForOrder`:
  - Morning (< 11:00) → db1
  - Day (11:00–15:00) → db2
  - Evening (> 15:00) → db3
- **Notifications:** Persisted beside the owning user to minimize cross-fragment queries.

### Relationships
- **Users ↔ Orders:** One-to-many. Orders carry both a foreign key (`userId`) and a snapshot of product data to avoid inconsistent receipts.
- **Orders ↔ Products:** Reference plus cached fields (`foodName`, `price`, `image`, `timeSlot`).
- **Users ↔ Notifications:** One-to-many per fragment; read status powers dashboard indicators.

This layout keeps user workloads balanced, menus consistent, and administrative reporting fast by fanning out queries through `queryAllDatabases`.

---

## Setup & Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd <project-folder>
```

### 2. Install dependencies (root command installs both apps)
```bash
pnpm install
```

### 3. Configure environment variables
Create `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/cafeteria      # or your Atlas URI
# Optional fragment overrides:
# MONGODB_URI_DB1=...
# MONGODB_URI_DB2=...
# MONGODB_URI_DB3=...
JWT_SECRET=change-me-super-secret
PORT=5000
```

Create `.env.local` in the project root:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### 4. Start MongoDB (local examples)
- Windows service: `net start MongoDB`
- macOS (Homebrew): `brew services start mongodb-community`
- Ubuntu: `sudo systemctl start mongod`

### 5. Run the application
- **Frontend & backend together:**
  ```bash
  pnpm run dev:all
  ```
- **Frontend only:**
  ```bash
  pnpm run dev:client
  ```
- **Backend only:**
  ```bash
  pnpm run dev:server
  ```

The combined command uses `concurrently` to start both servers. Next.js runs on `http://localhost:3000`, Express on `http://localhost:5000`.

### 6. Seed data (optional)
```bash
cd backend
node scripts/createAdmin.js        # interactive admin bootstrap
node scripts/seedBengaliFoods.js   # seed Bengali dishes by time slot
```

---

## Dependencies

### Frontend (root `package.json`)
- `next@16.0.0` – App Router framework.
- `react@19.2.0`, `react-dom@19.x` – Core UI runtime.
- `@radix-ui/*` (accordion, dialog, toast, etc.) – Accessible primitives relied on by shadcn/ui components.
- `@hookform/resolvers@3.10.0`, `react-hook-form@7.60.0`, `zod@3.25.76` – Form validation stack.
- `tailwindcss@4.1.9`, `@tailwindcss/postcss@4.1.9`, `autoprefixer@10.4.20` – Styling pipeline.
- `lucide-react@0.454.0`, `date-fns@4.1.0` – Icons and date utilities.
- `axios@latest` – Retained for the legacy `frontend/` client.

### Backend (`backend/package.json`)
- `express@4.18.2` – REST framework.
- `mongoose@7.0.0` – ODM with schema enforcement.
- `bcryptjs@2.4.3` – Password hashing.
- `jsonwebtoken@9.0.0` – Token issuing and verification.
- `cors@2.8.5` – CORS headers.
- `dotenv@16.0.3` – Environment configuration.
- `nodemon@2.0.20` (dev) – Hot reloading for development.

These libraries were selected to keep the codebase approachable for students while offering modern tooling for production-readiness.

---

## How the Project Works (Flow Explanation)

### Data flow ladder
1. **User action:** A logged-in user submits an order from `app/products/page.tsx`.
2. **Client request:** `lib/api.ts` posts to `/api/orders` (App Router API route).
3. **Proxy hop:** Next.js forwards the request to `http://localhost:5000/api/orders`.
4. **Backend processing:**
   - `protect` middleware verifies the JWT.
   - `getDatabaseForOrder` picks the fragment by local order time.
   - Fragment-specific `Order` model persists the order and product snapshot.
   - Notifications are inserted for admins (db1) and the ordering user (their fragment).
5. **Database write:** Order lands in `Order_FragX`, referencing `Menu_Frag1`.
6. **Response:** Express returns JSON → Next.js replies → React updates state and shows a toast.

```
[Next.js UI] → [App Router API Proxy] → [Express Router] → [dbManager/modelFactory]
       ↑                                                ↓
 [React state refresh] ← [JSON payload] ← [MongoDB fragment]
```

### Other key flows
- **Admin approvals:** `/api/admin/users/:id/approve` updates the user’s fragment record, unlocks dashboard access, and triggers notification entries.
- **Order lifecycle updates:** Admin endpoints mutate order status across fragments; `createNotification` publishes alerts for each transition.
- **Dashboard analytics:** `/api/dashboard/stats` aggregates counts from all fragments using `queryAllDatabases`.

---

## Code-Level Highlights

- **Dynamic fragment selection:** `getDatabaseForUser` keeps related roles together and uses hashing to load-balance generic accounts.
- **Cross-fragment querying:** `queryAllDatabases` fans out read operations for the admin dashboard without blocking the entire request if one fragment is down.
- **Snapshot-first orders:** Orders store current menu metadata (`foodName`, `price`, `image`, `timeSlot`) so receipts stay accurate even if the menu changes later.
- **Centralized middleware:** JWT auth and admin gating stay in one place thanks to `protect` and `adminOnly`, reducing repetition.
- **Reusable UI primitives:** The dashboard uses shared components (`Sidebar`, `Topbar`, `StatusBadge`) and shadcn UI patterns for consistent styling.

---

## Common Errors & Fixes

| Error | Likely Cause | Fix |
|-------|--------------|-----|
| `pnpm: command not found` | pnpm not installed globally | `npm install -g pnpm`, then retry |
| `Error: listen EADDRINUSE: 5000` | Port already in use | Identify and kill process (`netstat -ano | findstr :5000` on Windows) or change `PORT` in `.env` |
| `MongooseError: connect ECONNREFUSED` | MongoDB service stopped or URI incorrect | Start MongoDB (`net start MongoDB`, `brew services start mongodb-community`, etc.) or verify Atlas credentials |
| `Invalid token` / 401 responses | Missing or stale JWT | Re-log, clear `localStorage`, confirm backend `JWT_SECRET` matches |
| `NEXT_PUBLIC_API_BASE_URL undefined` | `.env.local` missing | Create `.env.local` in project root, restart Next.js |
| Image upload failures | Upload directory missing or file too large | Ensure `backend/server/uploads/` exists (auto-created) and file <5MB |
| Fragment mismatch logs | Role/department inconsistent with expectations | Check user role, department, and system clock; verify custom fragment overrides |

If an issue persists, inspect backend console output—fragment helpers log routing decisions to simplify debugging.

---

## Developer Guide

- **Orientation:** Read `PROJECT_REPORT.md` for a narrative overview, then explore `backend/routes` and `app/admin` for implementation patterns.
- **Adding APIs:** Create a router under `backend/routes`, export it, and mount it in `backend/server.js`. Use `getDatabaseForUser` or `getOrderModel` to stay fragment-aware.
- **Adding pages/components:** Create a folder under `app/` with `page.tsx`, reuse `Sidebar`, `Topbar`, and shadcn UI primitives for coherence.
- **Shared utilities:** Frontend helpers live in `lib/`, backend helpers in `backend/utils/`. Always use `lib/api.ts` to ensure tokens and base URLs are handled automatically.
- **Testing changes:** Run `pnpm run dev:all` for an integrated experience or `pnpm run dev:client` / `pnpm run dev:server` for focused debugging.
- **Coding conventions:** Functional components with hooks, Tailwind utility classes, shadcn naming (`text-muted-foreground`), and descriptive toast messages.

---

## Credits & License

- **Contributors:** Built by the Cafeteria Management team with gratitude to the Vercel, shadcn/ui, and Radix UI communities.
- **License:** MIT License (see repository metadata or include your own `LICENSE` file).

---

Happy building! Clone, run, and tailor the cafeteria experience to your campus. 🚀
