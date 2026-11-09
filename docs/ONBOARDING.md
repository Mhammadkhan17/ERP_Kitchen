# Onboarding Guide

Welcome to the Cloud Kitchen ERP project. This guide will get you from zero to productive in under 30 minutes.

## Prerequisites

- **Node.js 18+** (LTS recommended)
- **npm** (comes with Node)
- **Git**

## Environment Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd ERP_Kitchen

# 2. Install dependencies
npm install

# 3. Environment (your Supabase project URL + publishable key)
cp .env.example .env.local   # then fill in real values

# 4. Start the dev server
npm start
```

Open **http://localhost:5173** — you should see the KDS Dashboard with 15 sample orders.

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 5173 already in use | `kill $(lsof -ti:5173)` then retry |
| Blank page / 401 errors | Check `.env.local` has valid `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Stale data | Re-run `npm run seed` (drops nothing; insert fails on existing IDs — clear tables in Supabase first if you want a fresh seed) |
| Realtime not firing | Confirm the `orders` table is in the `supabase_realtime` publication |

## How the Project is Organized

```
ERP_Kitchen/
├── supabase/migrations/  ← Postgres schema (tables, RLS, realtime)
├── scripts/seed.mjs      ← Seed/wipe Supabase from the original fixture (kept in git history)
├── src/
│   ├── api/client.ts    ← ONE place where HTTP calls happen (Supabase client)
│   ├── api/supabase.ts  ← Shared Supabase client instance
│   ├── types/           ← TypeScript interfaces (your source of truth)
│   ├── composables/     ← Shared hooks (socket, timer, snackbar)
│   ├── components/      ← Layout shell (sidebar, header)
│   └── modules/         ← Feature modules (5 total)
│       ├── kds/         ← Kitchen Display System (order Kanban board)
│       ├── inventory/   ← Ingredient & stock management
│       ├── menu/        ← Menu items & recipe builder
│       ├── analytics/   ← Dashboard, charts, KPIs
│       └── order-status/ ← Customer-facing order tracking
```

Each module follows the same internal structure:
```
module/
├── views/          # Page-level components (routed)
├── components/     # Reusable UI components
└── composables/    # Vue Query hooks (data fetching)
```

## Key Concepts

### Data Flow

```
Component → Composable (useQuery) → api/client.ts → Supabase (PostgREST / Realtime)
```

- **Never call fetch or supabase-js directly** in components — always go through `src/api/client.ts`
- **Never fetch data in components** — use composables from `src/modules/<name>/composables/`

### Adding a New Feature

1. **Define types** in `src/types/index.ts`
2. **Add API method** in `src/api/client.ts` and `src/types/api.ts`
3. **Create composable** in `src/modules/<name>/composables/useXxx.ts`
4. **Build components** in `src/modules/<name>/components/`
5. **Create view** in `src/modules/<name>/views/`
6. **Add route** in `src/router/index.ts`

### Common Tasks

#### Add a new inventory field

1. Update the `Ingredient` interface in `src/types/index.ts`
2. Update `IngredientForm.vue` to include the new field
3. Add the column in Supabase (migration in `supabase/migrations/`)

#### Add a new order status

1. Update `OrderStatus` type in `src/types/index.ts`
2. Add transition logic in `useOrderFlow.ts`
3. Add a new column in `OrderDashboard.vue`

#### Add a new analytics metric

1. Create or update the composable in `useAnalytics.ts`
2. Add a new `KpiCard` or component in `AnalyticsDashboard.vue`
3. Use `computed` for derived metrics (no API call needed)

#### Modify backend behavior

Schema changes go in `supabase/migrations/` (new SQL file) and are applied via the Supabase dashboard or MCP. Row-level access is governed by RLS policies in the same migration.

## Useful Commands

```bash
# Development
npm start                    # Vite dev server (recommended)
npm run dev                  # Same as start

# Build
npm run build                # Type-check + production build
npm run preview              # Preview production build

# Testing
npm test                     # Run all tests
npm run test:watch           # Watch mode

# Database
npm run seed                 # Wipe + re-seed Supabase from the original fixture
```

## Where to Look for What

| I want to... | Look at |
|--------------|---------|
| Understand the data models | `src/types/index.ts` |
| See all API endpoints | `src/api/client.ts` |
| Add a new page/route | `src/router/index.ts` |
| Change the sidebar nav | `src/components/layout/AppDrawer.vue` |
| Modify the KDS board | `src/modules/kds/views/OrderDashboard.vue` |
| Add inventory features | `src/modules/inventory/` |
| Change menu management | `src/modules/menu/` |
| Update analytics charts | `src/modules/analytics/components/` |
| Modify order tracking | `src/modules/order-status/` |
| Change the color theme | `src/plugins/primevue.ts` |
| Add CSS shortcuts | `uno.config.ts` |
| Modify the backend | `supabase/migrations/` + Supabase dashboard |
| Reset the database | Clear tables in Supabase, then `npm run seed` |

## Design system (2026-10-09)

Tokens live in two files only:

- `src/constants/palette.ts` - the orange ramp (single source for Uno `primary-*` and PrimeVue)
- `src/constants/orderStatus.ts` - status labels, severities, tint/spine/text/CTA classes, timer tiers, chart hexes

Rules:

- Action fills: `orange-700` (white text). Graphics/accents: `orange-600`. Never `orange-500` for small graphics on white.
- Status text uses the -700 step (blue uses -600). Status graphics use the -600 step.
- Type: DM Sans for UI, JetBrains Mono + `tabular-nums` for data. No Inter. No `text-[9px]/[10px]/[11px]`.
- Radius: controls `rounded-lg`, cards/dialogs `rounded-xl`, pills full. `html` font-size is 14px.
- Elevation: cards = gray-200 border + shadow-sm; overlays shadow-lg.
- Page chrome: every page uses `src/components/ui/PageHeader.vue`.
- Data surfaces render exactly one of loading (`AppSkeleton`), error (`AppErrorState`), empty (`AppEmptyState`), content.
- Buttons are always PrimeVue `Button` with severity props. Do not reintroduce Uno `btn-*` classes.
- KDS CTAs are at least 44px tall. Respect `prefers-reduced-motion`.

## Architecture Decisions

Read `docs/ARCHITECTURE.md` for the full rationale behind key decisions. Summary:

1. **Supabase** for database + REST + realtime (replaced json-server for deployment)
2. **TanStack Vue Query** for server state (not Pinia)
3. **Module-based** organization (not layer-based)
4. **Supabase Realtime** (`postgres_changes` on `orders`) with a singleton channel, exposed through the same `socket.on('order:update')` contract
5. **ApiClient interface** as the abstraction boundary between frontend and backend

## Useful Links

- [API Documentation](docs/API.md) — Full endpoint reference
- [Architecture](docs/ARCHITECTURE.md) — System design and decisions
- [README](README.md) — Project overview
- [CHANGELOG](CHANGELOG.md) — Development history

## Getting Help

- Check the `CHANGELOG.md` for recent changes and context
- Look at `.specs/` for design documents and research
- Search for existing patterns before adding new code
- When in doubt, match the patterns in the nearest sibling component
