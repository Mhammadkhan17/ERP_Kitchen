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

# 3. Copy environment template (optional — defaults work fine)
cp .env.example .env

# 4. Start both servers
npm start
```

Open **http://localhost:5173** — you should see the KDS Dashboard with 15 sample orders.

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3001 already in use | `kill $(lsof -ti:3001)` then retry |
| Port 5173 already in use | `kill $(lsof -ti:5173)` then retry |
| Blank page | Make sure both `npm run server` AND `npm run dev` are running |
| Stale data | Delete `db.json` and restart `npm run server` to reset to seed data |

## How the Project is Organized

```
ERP_Kitchen/
├── db.json              ← The "database" (plain JSON file)
├── server.js            ← Backend (55 lines: JSON Server + Socket.IO)
├── src/
│   ├── api/client.ts    ← ONE place where HTTP calls happen
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
Component → Composable (useQuery) → api/client.ts → Axios → Vite Proxy → JSON Server → db.json
```

- **Never import Axios directly** in components — always go through `src/api/client.ts`
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
3. The API auto-handles it (JSON Server accepts any fields)

#### Add a new order status

1. Update `OrderStatus` type in `src/types/index.ts`
2. Add transition logic in `useOrderFlow.ts`
3. Add a new column in `OrderDashboard.vue`

#### Add a new analytics metric

1. Create or update the composable in `useAnalytics.ts`
2. Add a new `KpiCard` or component in `AnalyticsDashboard.vue`
3. Use `computed` for derived metrics (no API call needed)

#### Modify the API response

Edit `server.js`. For example, to add a new middleware:

```javascript
server.use((req, res, next) => {
  // Your logic here
  next()
})
```

## Useful Commands

```bash
# Development
npm start                    # Start both servers (recommended)
npm run dev                  # Frontend only
npm run server               # Backend only

# Build
npm run build                # Type-check + production build
npm run preview              # Preview production build

# Testing
npm test                     # Run all tests
npm run test:watch           # Watch mode

# Database
# Just edit db.json directly, or reset it:
git checkout db.json
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
| Modify the backend | `server.js` |
| Reset the database | Delete `db.json` and restart server |

## Design System

### UI Components (PrimeVue 4)

Most UI comes from PrimeVue. Key components used:

- `DataTable` — All list/table views
- `Dialog` — Modal forms
- `Button` — Actions
- `Tag` — Status badges
- `InputText`, `InputNumber`, `Select` — Form fields
- `Toast` — Notifications (via `useSnackbar` composable)
- `Accordion` — Expandable sections
- `Chip` — Brand labels

### Styling (UnoCSS)

Utility-first CSS (Tailwind-compatible). Custom shortcuts in `uno.config.ts`:

```html
<div class="card">          <!-- White card with shadow -->
<button class="btn-primary"> <!-- Orange primary button -->
<span class="chip">          <!-- Small label chip -->
<div class="skeleton">       <!-- Loading skeleton -->
```

### Color Palette

- **Brand orange:** `#f97316` (orange-500) — primary actions
- **Tandoori Express:** `#E65100` — brand-01
- **Wok On Fire:** `#D32F2F` — brand-02
- **Pizza Piazza:** `#2E7D32` — brand-03

## Architecture Decisions

Read `docs/ARCHITECTURE.md` for the full rationale behind key decisions. Summary:

1. **JSON Server** for rapid prototyping (will be replaced for production)
2. **TanStack Vue Query** for server state (not Pinia)
3. **Module-based** organization (not layer-based)
4. **Socket.IO** for real-time with singleton client pattern
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
