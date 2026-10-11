# Cloud Kitchen ERP

A web-based ERP application for cloud kitchens (dark kitchens) that manage multiple restaurant brands from a single kitchen. Provides real-time order management, inventory tracking, recipe management, and sales analytics.

## Quick Start

```bash
# Install dependencies
npm install

# Start both frontend and backend
npm start
```

Open **http://localhost:5173** in your browser.

| Service   | URL                   | Purpose                     |
| --------- | --------------------- | --------------------------- |
| Frontend  | http://localhost:5173 | Vue 3 SPA                   |
| API       | http://localhost:3001 | JSON Server REST API        |
| WebSocket | ws://localhost:3001   | Socket.IO real-time updates |

## What's Included

- **Kitchen Display System (KDS)** — Kanban board for managing order flow: Pending → Preparing → Ready → Dispatched
- **Inventory Management** — Track 25+ ingredients with stock levels, low-stock alerts, and supplier info
- **Menu & Recipe Management** — 12 menu items across 3 brands with ingredient-level recipes
- **Analytics Dashboard** — Revenue graphs, KPIs, top-selling items, brand performance, and wastage tracking
- **Customer Order Tracking** — Public pages for customers to track order status in real-time

## Tech Stack

| Layer     | Technology                                |
| --------- | ----------------------------------------- |
| Frontend  | Vue 3, TypeScript, PrimeVue 4, UnoCSS     |
| State     | TanStack Vue Query                        |
| Real-time | Socket.IO                                 |
| Backend   | JSON Server (mock REST API)               |
| Build     | Vite 6                                    |
| Charts    | Hand-rolled SVG (`DailyRevenueGraph.vue`) |

## Design System

- **Fonts**: DM Sans (UI) + JetBrains Mono (code/timers)
- **Brand color**: Single orange source in `src/constants/palette.ts` (Tailwind scale, primary = orange-700)
- **Status colors**: amber-700 pending, blue-600 preparing, green-700 ready, gray-600 dispatched, red-600 cancelled
- **Timer escalation**: green-700 (0–8 min) → amber-700 (8–12 min) → red-600 (12+ min)
- **Cards**: gray-200 border + shadow-sm
- **Radius**: 0.5rem (sm) / 0.75rem (md) / full (pills)
- **Shared kit**: PageHeader, AppSkeleton, AppEmptyState, AppErrorState, AppSearchInput, AppDialog, NavList (`src/components/ui/`)

## Architecture at a glance

- Mock API = json-server on :3001 (`server.js`, seeded by `db.json`)
- Reset seed data with `git checkout db.json`
- API contract = `src/types/api.ts` (swap backend by changing Vite proxy only)
- Status/colors = `src/constants/orderStatus.ts` (single source)

## Project Structure

```
src/
├── api/client.ts          # Typed API client (Axios)
├── components/ui/         # Shared UI kit (PageHeader, states, inputs)
├── components/layout/     # App shell, sidebar, header
├── composables/           # Shared composables (socket, timer, snackbar)
├── constants/             # Palette, order status, nav
├── modules/
│   ├── kds/               # Kitchen Display System
│   ├── inventory/         # Ingredient & stock management
│   ├── menu/              # Menu items & recipe builder
│   ├── analytics/         # Dashboard, charts, KPIs
│   └── order-status/      # Customer-facing order tracking
├── router/                # Vue Router config
├── styles/                # Global CSS, transitions
├── types/                 # TypeScript interfaces
├── utils/                 # Formatters, validators, aggregation
└── plugins/               # PrimeVue theme config
```

## Commands

| Command              | Description                                |
| -------------------- | ------------------------------------------ |
| `npm start`          | Start dev server + API server concurrently |
| `npm run dev`        | Start Vite dev server only                 |
| `npm run server`     | Start JSON Server only                     |
| `npm run build`      | Type-check and build for production        |
| `npm run preview`    | Preview production build                   |
| `npm test`           | Run tests                                  |
| `npm run test:watch` | Run tests in watch mode                    |
| `npm run lint`       | Run ESLint                                 |
| `npm run format`     | Format with Prettier                       |

## Environment Variables

Copy `.env.example` to `.env`:

```bash
VITE_WS_URL=http://localhost:3001
```

## Data

The `db.json` file serves as the database, pre-seeded with:

- 25 ingredients (protein, grain, dairy, vegetable, spice)
- 3 restaurant brands (Tandoori Express, Wok On Fire, Pizza Piazza)
- 12 menu items with 12 recipes
- 15 orders with various statuses
- 10 customers
- 6 days of sales analytics
- 4 wastage log entries

## Contributing

1. Create a feature branch from `main`
2. Make changes following the existing code patterns
3. Ensure `npm run build` passes without errors
4. Run `npm test` to verify tests pass
5. Submit a pull request

### Code Patterns

- **Components** use `<script setup lang="ts">` with Vue 3 Composition API
- **Server state** is managed via TanStack Vue Query composables (one per module)
- **API calls** go through `src/api/client.ts` — never import Axios directly in components
- **UI components** are from PrimeVue 4 — check existing components before adding new ones
- **Shared UI** (PageHeader, states, inputs) lives in `src/components/ui/` — use these instead of ad-hoc layouts
- **Status/colors** come from `src/constants/orderStatus.ts` — never hardcode status hex values
- **Styling** uses UnoCSS utility classes (Tailwind-compatible)

## License

Private project.
