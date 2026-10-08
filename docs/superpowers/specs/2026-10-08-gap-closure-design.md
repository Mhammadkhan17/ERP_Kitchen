# Gap Closure Design — ERP_Kitchen (Phases 0–3)

**Date:** 2026-10-08
**Status:** Approved (design gate)
**Scope:** Close every gap identified in the codebase exploration report — logic bugs, type/seed drift, dead code, tooling vacuum, stale docs — on the current mock backend.

## Decisions (confirmed with user)

| Decision | Choice |
|---|---|
| Execution approach | Sequential phases, phase-per-commit, verified gates |
| Phases included | 0–3 only (no backend hardening, no epics) |
| Stock `reason` fix | Minimal: persist `lastAdjustReason` / `lastAdjustedAt` on the ingredient |
| Analytics period toggle | Wire it up properly (client-side aggregation) |
| Type/seed drift | Backfill seeds + keep types strict; `phone: string` |
| Dead code | Remove everything (Pinia, chart.js, vue-chartjs, SalesChart.vue, useDebounce.ts) |
| Stale docs | Archive to `docs/legacy/` with banner README |
| Lint/format | ESLint 9 flat config + typescript-eslint + eslint-plugin-vue + Prettier |

## Out of scope

- Atomic stock adjustment (needs real server route) — deferred to backend epic
- Auth, DB migration, customer-portal CRUD, `/admin/*` restructure — separate design cycles
- Period-aware wastage KPI (wastage logs have no useful range semantics this pass)
- Chart.js adoption (charts stay hand-rolled SVG)

## Phase 0 — Hygiene

1. **Untrack build output**: add `dist/` to `.gitignore`; `git rm -r --cached dist`.
2. **Type fixes** (`src/types/index.ts`): `Order.phone: string`, `Customer.phone: string` (matches string phones in `db.json`). Audit callers during implementation.
3. **Seed backfill** (`db.json`):
   - every `ingredient`: `isLowStock: false` (informational parity; UI keeps deriving live status from `currentStock` vs `reorderLevel`)
   - every `menuItem`: `popularity` integer 1–5
   - every `recipe`: `version: 1`
   - every `wastage_log`: `cost` (derive `unitCost × quantity` from linked ingredient) and `ingredientName` (from linked ingredient)
4. **Dead weight**: `npm uninstall pinia chart.js vue-chartjs`; delete `src/modules/analytics/components/SalesChart.vue` and `src/composables/useDebounce.ts`; remove Pinia registration from `src/main.ts`.

## Phase 1 — Logic fixes

### 1.1 Reactive inventory filters
`useIngredients` accepts `MaybeRefOrGetter<IngredientFilters | undefined>`; internally `unref` into Vue Query `queryKey: ['ingredients', filters]` (vue-query v5 deep-unwraps refs in keys). `InventoryList.vue` passes the existing `computed` directly instead of evaluating `filters.value` once. **Audit all `useIngredients` callers** (e.g., AnalyticsDashboard, LowStockBanner) for signature compatibility — no-arg calls must keep working.

### 1.2 Persist stock-adjustment reason
`api.ingredients.adjustStock` PATCH body gains `lastAdjustReason: reason` and `lastAdjustedAt: new Date().toISOString()`. `Ingredient` type gains both as optional strings. No UI display this pass. Atomicity deferred (documented limitation).

### 1.3 Top-selling item names
`TopSellingTable` fetches menu items via the existing menu composable, builds `Map<id, name>`, and replaces the raw `field="menuItemId"` column with a body template showing name with `menuItemId` fallback.

### 1.4 Analytics period wiring (client-side aggregation)
- New pure util `src/utils/aggregateSales.ts`:
  `aggregateSales(sales: DailySales[], period: 'daily' | 'weekly' | 'monthly'): AggregatedPeriod[]`
  where `AggregatedPeriod = { label, revenue, orderCount, itemsSold: {menuItemId, units}[] }`.
  Buckets: per-day rows; ISO-week (`YYYY-Www`); calendar month (`YYYY-MM`). Total over empty input; never throws.
- `useKpiMetrics` and consumers switch to the aggregated series driven by `activePeriod`.
- `DailyRevenueGraph` props generalize to `{ label, revenue }` points.
- `TopSellingTable` aggregates `itemsSold` within the selected period window.
- **Amendment (sequential review):** `BrandPerformance` also follows the period window — brand revenue split computed from sales filtered to the selected period.
- Wastage KPI stays period-independent (explicit limitation).
- Unit tests for `aggregateSales` land with this phase (vitest already runs with default include; only files were missing).

### 1.5 RecipeBuilder resilience
After successful upsert: write the response into the local `recipeData` map (no stale UI) and `invalidateQueries(['recipes', menuItemId])`. On failure: `snackbar.error` and keep the form open (currently the catch swallows errors).

### 1.6 DRY constants
- `src/constants/nav.ts`: single `NAV_ITEMS` consumed by `AppDrawer` and `AppHeader`.
- `src/constants/orderStatus.ts`: canonical `ORDER_STATUS_COLORS` / severity maps, replacing the ≥5 duplicated maps across kds + order-status modules and `formatters`. Update all importers; re-export from `formatters` only if a compatibility shim is cheaper (prefer updating importers).

### 1.7 Convention compliance
Extract the inline `useQuery` / search / socket-feed wiring from `OrderDashboard.vue` into `modules/kds/composables/useOrderDashboard.ts`. View becomes template + composable. Behavior unchanged.

## Phase 2 — Quality gates

1. **ESLint 9 flat config** + `typescript-eslint` (strict-type-checked) + `eslint-plugin-vue` + `eslint-config-prettier`; **Prettier** + `@prettier/plugin-vue`. Scripts: `lint`, `lint:fix`, `format`, `format:check`. First lint/format run is its own commit so Phase 1 diffs stay reviewable. **Triage rule:** legitimate findings get fixed; blanket disables are not acceptable (vue-tsc already passes, so findings should be minor — e.g., attribute-casing drift like `strippedRows`).
2. **Vitest formalization**: explicit `test` block in `vite.config.ts` (jsdom, globals). Remaining tests beyond the Phase 1 `aggregateSales` suite:
   - `formatters`, `validators` unit tests
   - `client.adjustStock` with mocked axios — assert PATCH payload includes `lastAdjustReason`/`lastAdjustedAt`
   - `useIngredients` reactive-key smoke test (filters change → new query key)
   - `KpiCard` component render test
   Gate: `npm test` exits 0.

## Phase 3 — Docs truth

1. `git mv CHANGELOG.md todo.txt plan.md solution.a.md solution.b.md solution.c.md → docs/legacy/` + `docs/legacy/README.md` banner ("retired JS/Pinia/SSE architecture — historical only").
2. Changelog: the old `CHANGELOG.md` is archived by step 1; create a fresh root `CHANGELOG.md` with a current-architecture entry covering this remediation (Vue 3 + TS + PrimeVue + Vue Query + Socket.IO stack; gap-closure phases).
3. Fix `README.md`: remove the false Chart.js claim (charts are hand-rolled SVG), document `npm run lint` / `npm run test` reality.
4. `.env.example`: align to `VITE_WS_URL=http://localhost:3001` (README contract) while keeping `VITE_WS_PORT` fallback in code.
5. Root `AGENTS.md`: short pointer — conventions summary, "read docs/ONBOARDING.md", verification commands (`npm run build`, `npm test`, `npm run lint`).

## Error handling

Existing patterns preserved: mutations → `useSnackbar` success/error; public pages keep retry states; `client.ts` interceptor unchanged. `aggregateSales` is pure and total.

## Verification

- After every phase: `npm run build` (vue-tsc gate).
- After Phase 2+: `npm test` + `npm run lint`.
- Manual smoke (`npm start`): KDS live updates; inventory search filters reactively; stock adjust persists reason; analytics toggle changes graph/table/brand split; recipe save reflects immediately.
- Close with `requesting-code-review`.

## Skills mapping

| Phase | Skills |
|---|---|
| 0 | `vue`, `verification-before-completion` |
| 1 | `systematic-debugging`, `vue`, `tdd`, `codebase-design` |
| 2 | `test-driven-development`, `vue` |
| 3 | `documentation` |
| All | `verification-before-completion`; close with `requesting-code-review`; execution via `executing-plans` |

## Known limitations (accepted)

- Stock adjustment remains non-atomic (GET-then-PATCH race) until a real backend exists.
- No auth; public tracking pages remain trivially bypassable.
- Wastage KPI ignores the period toggle.
