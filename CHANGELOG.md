# Changelog

## 0.4.0 — 2026-10-11

Full UI/UX redesign across all five modules.

### Added

- Shared UI kit (`src/components/ui/`): PageHeader, AppSkeleton, AppEmptyState, AppErrorState, AppSearchInput, AppDialog, NavList
- Design tokens (`src/constants/palette.ts`): single orange source, Tailwind gray ramp, banned legacy hexes
- Status constants (`src/constants/orderStatus.ts`): single source for status colors, CTA labels, timer thresholds, header classes
- Nav constants (`src/constants/nav.ts`): labels, paths, icons
- Utility modules: `aggregateSales.ts`, `formatters.ts`, `validators.ts`
- UnoCSS shortcuts: `card`, `chip`, `field`, `skeleton`
- Test suite for utils, API client, composables, and components (31 tests)

### Changed

- Typography: DM Sans (UI) + JetBrains Mono (code/timers)
- Base font size: `html { font-size: 14px }`
- Border radius: 0.5rem (sm) / 0.75rem (md) / full (pills)
- Cards: gray-200 border + shadow-sm (replaces shadow-heavy defaults)
- Status colors: amber-700 pending, blue-600 preparing, green-700 ready, gray-600 dispatched, red-600 cancelled
- Timer age escalation: green-700 (0–8 min), amber-700 (8–12 min), red-600 (12+ min)
- KDS: solid colored status header bars, PrimeVue VirtualScroller, fixed-height cards, detail dialog CTA
- All module views rebuilt on shared UI kit (PageHeader + state components)
- PrimeVue theme updated with KitchenPreset (orange primary from palette)

### Removed

- Legacy stripe/dot indicators on order cards
- Unused SalesChart component and useDebounce composable

## 0.3.0 — 2026-10-08

Gap-closure pass on the Vue 3 + TypeScript + PrimeVue + Vue Query + Socket.IO stack.

### Fixed

- Inventory search/unit filters now refetch reactively
- Stock adjustments persist `lastAdjustReason` / `lastAdjustedAt`
- Top-selling table shows menu item names
- Analytics daily/weekly/monthly toggle drives KPIs, revenue graph, top sellers, and brand split (client-side aggregation)
- Recipe builder surfaces load errors and reflects saved recipes immediately

### Changed

- Shared nav and order-status constants extracted (`src/constants/`)
- KDS dashboard logic moved to `useOrderDashboard` composable
- `Order.phone` / `Customer.phone` typed as `string`; seed data backfilled

### Tooling

- ESLint 10 + Prettier added (`npm run lint`, `npm run format`)
- Vitest suite added: utils, API client, composable, component (`npm test`)

### Removed

- Unused dependencies: Pinia, chart.js, vue-chartjs
- Dead files: `SalesChart.vue`, `useDebounce.ts`

## Before 0.3.0

Pre-Vue-3/TypeScript history lives in `docs/legacy/CHANGELOG.md`.
