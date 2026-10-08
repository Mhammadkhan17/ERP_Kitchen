# Changelog

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

- ESLint 9 + Prettier added (`npm run lint`, `npm run format`)
- Vitest suite added: utils, API client, composable, component (`npm test`)

### Removed

- Unused dependencies: Pinia, chart.js, vue-chartjs
- Dead files: `SalesChart.vue`, `useDebounce.ts`

## Before 0.3.0

Pre-Vue-3/TypeScript history lives in `docs/legacy/CHANGELOG.md`.
