# Cloud Kitchen ERP — CHANGELOG & Handoff Document

## Project Overview

Cloud Kitchen MVP ERP built with Vue 3 (Composition API, `<script setup>`) + UnoCSS (`presetWind`) + Pinia (setup stores) + JSON Server mock API. UI primitives use `@vuetify/v0` headless components (Dialog, Snackbar, Tooltip) styled with UnoCSS utility classes. Reference docs consumed: Vue 3 official (from `llms-full.txt`) and Vuetify0 headless composables (from `llms_full.txt`).

---

## What Was Completed (Phase 0)

### Scaffolding & Config
- **`package.json`** — Vue 3.5, Pinia, Vue Router 4, Axios, UnoCSS 0.65, json-server 0.17, concurrently, Vite 6
- **`vite.config.js`** — Vue plugin, UnoCSS plugin, `@/` alias, `/api` proxy → `localhost:3001`, Vitest config (globals, jsdom, test file pattern)
- **`uno.config.js`** — `presetWind()`, brand colors (`orange-600` primary), shortcuts (`btn`, `btn-primary`, `card`, `badge`, `chip`, `input`, `page-header`, etc.)
- **`index.html`** — Root HTML with MDI icon CDN
- **`server.js`** — JSON Server with timestamp middleware + SSE `/events` endpoint on port 3001
- **`db.json`** — Seed data: 10 ingredients, 2 brands, 5 menu items, 2 recipes, 5 orders (mixed statuses), 3 days sales analytics, 2 wastage logs

### Bootstrap & Plugins
- **`src/main.js`** — App bootstrap: Pinia, Router, Vuetify0 theme plugin, UnoCSS reset + base
- **`src/App.vue`** — Shell that renders `<AppLayout />`
- **`src/plugins/vuetify0.js`** — Placeholder Vuetify0 theme plugin (sets primary/secondary colors as global properties)
- **`src/styles/main.css`** — CSS custom properties for brand colors, font smoothing, mobile utility

### Routing (src/router/index.js)
| Path | Name | View |
|------|------|------|
| `/` | — | Redirect → `/kds` |
| `/kds` | `kds.dashboard` | `OrderDashboard.vue` |
| `/kds/:id` | `kds.detail` | `OrderDetail.vue` |
| `/inventory` | `inventory.list` | `InventoryList.vue` |
| `/inventory/adjust` | `inventory.adjust` | `StockAdjustment.vue` |
| `/menu` | `menu.list` | `MenuList.vue` |
| `/menu/recipes` | `menu.recipes` | `RecipeBuilder.vue` |
| `/analytics` | `analytics.dashboard` | `AnalyticsDashboard.vue` |

### API Layer (src/api/)
- **`client.js`** — Axios instance with `/api` base URL and response error interceptor
- **`modules/inventory.js`** — CRUD for `/ingredients`
- **`modules/orders.js`** — GET all, GET by id, POST, PATCH status
- **`modules/menu.js`** — CRUD for menuItems, recipes, brands
- **`modules/analytics.js`** — GET sales, GET/POST wastage logs
- **`index.js`** — Re-exports all API modules

### Layout Components (src/components/layout/)
- **`AppLayout.vue`** — Flex container: sidebar (desktop) + header + `<router-view>`
- **`AppDrawer.vue`** — Fixed 240px sidebar with nav links, active state highlighting, hidden on mobile (`<md`)
- **`AppHeader.vue`** — Top bar with mobile nav toggle, horizontal nav links, mobile overlay menu

### UI Primitives (src/components/ui/) — All hand-rolled, no Vuetify0 components
| Component | Props | Description |
|-----------|-------|-------------|
| `VDataTable.vue` | `columns`, `rows`, `loading`, `emptyMessage`, `sortable`, `pageSize` + slots per cell | Styled `<table>` with loading/empty states, column sorting with indicators, pagination controls, row click event |
| `VDialog.vue` | `modelValue`, `title`, `maxWidth` | Teleported modal with backdrop, close, footer slot, focus trap, ESC to close |
| `VCard.vue` | `padding` | White card with shadow + border + rounded |
| `VChip.vue` | `color`, `dot` | Colored label chip (orange/green/red/blue/gray/yellow/purple) |
| `VBadge.vue` | `count`, `color` | Circular count badge (99+ overflow) |
| `VStatusDot.vue` | `status` | Small colored dot for order status |
| `VPageHeader.vue` | `title`, `subtitle` + `actions` slot | Page title + actions bar |
| `VSearchBar.vue` | `modelValue`, `placeholder` | Search input with magnifier icon |
| `VConfirmDialog.vue` | `modelValue`, `title`, `message`, `confirmText`, `danger` | Confirmation modal |
| `VBanner.vue` | `type` (info/warning/error/success), `dismissible` | Alert banner with icon + dismiss |
| `VToast.vue` | — (uses `useSnackbar` composable) | Teleported snackbar toast with animated enter/leave |
| `VTooltip.vue` | `text` | Hover tooltip with arrow |

### Common Components (src/components/common/)
- **`EmptyState.vue`** — Icon + message + optional action button
- **`LoadingSkeleton.vue`** — Animated pulse skeleton rows
- **`StatusTimeline.vue`** — Vertical timeline for order status transitions

### Composables (src/composables/)
- **`useSnackbar.js`** — Global snackbar state (ref-based, no provider needed)
- **`useTimer.js`** — Elapsed seconds counter with start/stop/reset/format (mm:ss)
- **`useConfirm.js`** — Promise-based confirm dialog state
- **`useDebounce.js`** — Watch-based debounce wrapper (clears previous timeout, cleanup on unmount)
- **`useSSE.js`** — Server-Sent Events composable with auto-reconnect

### Utils (src/utils/)
- **`formatters.js`** — `formatCurrency`, `formatDate`, `formatTime`, `statusLabel`, `statusColor`
- **`validators.js`** — `required`, `minLength`, `positiveNumber`, `maxDecimals`

### Pinia Stores (src/stores/)
- **`inventory.js`** — Full CRUD, search/unit filter, low stock detection, stock adjustment, recipe-based bulk deduction
- **`orders.js`** — Status filter, pending count, orders by status grouping, cross-store deduction flow (`pending → preparing` triggers `inventoryStore.deductRecipeIngredients`)
- **`menu.js`** — Menu items + recipes + brands loaded in parallel, recipe lookup by menuItemId
- **`analytics.js`** — Computed totals/revenue/AOV/wastage, parallel refresh

### KDS Module (src/modules/kds/)
- **`OrderDashboard.vue`** — 4-column Kanban (Pending / Preparing / Ready / Dispatched), 30s polling, new order alert banners
- **`OrderDetail.vue`** — Dialog with item breakdown, total, special instructions, status timeline
- **`OrderCard.vue`** — Order card with source badge, item summary, timer, contextual action button (Start Preparing → Mark Ready → Mark Dispatched)
- **`KdsColumn.vue`** — Kanban column with colored header + count badge + scrollable card list
- **`OrderTimer.vue`** — Live elapsed time display (mm:ss) since `placedAt`

### Inventory Module (src/modules/inventory/)
- **`InventoryList.vue`** — Full data table with search, status chips (ok/low/critical), edit/delete actions, low stock banner
- **`StockAdjustment.vue`** — Select ingredient → choose in/out → enter quantity → submit
- **`IngredientForm.vue`** — Dialog form with name, unit, stock, reorder, cost, supplier, category
- **`LowStockBanner.vue`** — Warning banner listing ingredients at/below reorder level

### Menu Module (src/modules/menu/)
- **`MenuList.vue`** — Data table with brand name, price, active toggle switch, edit action
- **`RecipeBuilder.vue`** — Accordion per menu item with ingredient picker (searchable checkboxes + quantity inputs) and save
- **`MenuItemForm.vue`** — Dialog form with name, brand, price, category, active toggle
- **`IngredientPicker.vue`** — Searchable checkbox list with quantity input per ingredient

### Analytics Module (src/modules/analytics/)
- **`AnalyticsDashboard.vue`** — 4 KPI cards (Revenue, AOV, Orders, Wastage), bar chart, top-selling table, wastage log table, period toggle (daily/weekly/monthly)
- **`KpiCard.vue`** — Icon + label + big number + optional trend indicator
- **`SalesChart.vue`** — Pure CSS bar chart (no Chart.js dependency needed)
- **`TopSellingTable.vue`** — Ranked list with units sold
- **`WastageLog.vue`** — Data table of wastage records

---

## Verified Working

- `npm run build` — **Passes with 0 errors** (180 modules, 43 from `@vuetify/v0`)
- `npm test` — **63 tests pass** across 7 test files
- All 4 route modules lazy-load correctly
- Cross-store deduction flow wired: `ordersStore.updateOrderStatus('preparing')` → `inventoryStore.deductRecipeIngredients()`
- JSON Server `db.json` has realistic seed data with cross-referenced IDs

---

## Remaining Work (TODOs)

### Phase 1a — UI Primitive Polish (Low Priority)
- [x] VDataTable: add sort indicators + column sorting logic
- [x] VDataTable: add pagination controls (page size, prev/next)
- [x] VDataTable: add row click event
- [x] VDialog: add focus trap and ESC to close
- [x] VConfirmDialog: add destructive action styling polish
- [x] Add `VToast` / snackbar UI component for `useSnackbar`
- [x] Add `VTooltip` primitive

### Phase 1b — Inventory Enhancements (Medium Priority)
- [x] InventoryList: add column sorting by clicking headers
- [x] InventoryList: add pagination
- [x] InventoryList: add unit filter dropdown
- [x] StockAdjustment: add success confirmation toast
- [x] StockAdjustment: show current stock before/after preview
- [x] IngredientForm: add client-side validation with `validators.js`

### Phase 2 — Menu & Recipe Enhancements
- [x] MenuList: add search filter
- [x] MenuList: add category filter tabs
- [x] RecipeBuilder: add ingredient quantity validation
- [x] RecipeBuilder: add serving size multiplier
- [x] RecipeBuilder: add drag-and-drop ingredient reordering

### Phase 3 — KDS Enhancements
- [x] OrderTimer: add color transitions (>10min yellow, >15min red)
- [x] OrderDashboard: add sound notification on new order poll
- [x] OrderDashboard: add auto-scroll to new orders
- [x] OrderDashboard: add confirmation dialog before status changes
- [x] OrderDashboard: add cancelled column support
- [x] OrderDetail: add action buttons (start/ready/dispatch) inside dialog
- [x] Add drag-and-drop between Kanban columns (HTML5 Drag & Drop API)

### Phase 4 — Analytics Enhancements
- [x] SalesChart: replace CSS bars with Chart.js (`vue-chartjs`) for proper axes/tooltips
- [x] SalesChart: add period-based data aggregation
- [x] TopSellingTable: show revenue contribution per item
- [x] WastageLog: add date range filter
- [x] AnalyticsDashboard: add export CSV button
- [x] AnalyticsDashboard: add comparison period toggle (period wired to store/API)

### Phase 5 — Polish & Mobile (High Priority)
- [x] Mobile: KDS columns stack vertically at `<768px`
- [x] Mobile: VDialog goes fullscreen at `<640px`
- [x] Mobile: AppDrawer becomes off-canvas overlay at `<768px`
- [x] Mobile: VDataTable horizontal scroll on all tables
- [x] Error handling: global error boundary component (`ErrorBoundary.vue`)
- [x] Loading states: skeleton on initial page loads (InventoryList, MenuList)
- [x] Snackbar: global toast component (`VToast.vue`) for success/error feedback
- [x] KDS: real-time via SSE (EventSource) — server broadcasts `new-order` and `order-updated` events; Orders Store subscribes with auto-reconnect; no polling
- [ ] Auth: login page + route guards (future scope)

### Phase 6 — Testing
- [x] Set up Vitest + @vue/test-utils + jsdom
- [x] Unit tests for stores (inventory: 13, orders: 11) — 24 tests
- [x] Unit tests for utils (formatters: 13, validators: 13) — 26 tests
- [x] Component tests for UI primitives (VDataTable: 7, VDialog: 3) — 10 tests
- [x] Integration test for Order → Inventory deduction flow — 2 tests
- Total: **63 tests, 7 files, all passing ✓**

### Vuetify0 Migration
- [x] Installed `@vuetify/v0` (40 headless components, 71 composables)
- [x] **VDialog** → `Dialog.Root`/`Dialog.Content`/`Dialog.Title`/`Dialog.Close` — native focus trap, ESC dismiss, WAI-ARIA semantics
- [x] **VToast** → `Snackbar.Root`/`Snackbar.Portal`/`Snackbar.Content`/`Snackbar.Close` — portal to body with proper queue support
- [x] **VTooltip** → `Tooltip.Root`/`Tooltip.Activator`/`Tooltip.Content` — hover/focus activation built-in
- [x] **VDataTable** → `createPagination` from `@vuetify/v0` for page navigation, sorting kept as custom logic
- [x] All wrapper components preserve their original prop/event APIs — consumers unchanged
- [x] Test setup: `setup.js` mocks `HTMLDialogElement.showModal`/`close` for jsdom compatibility

---

## Key Architecture Decisions

1. **No Vuetify0/v3** — All UI primitives are custom HTML + UnoCSS utilities. Vuetify0 composables (`createDataTable`, `createKanban`, `createDialog`) are **not** implemented. The `vuetify0.js` plugin is a placeholder shell. If the team wants to add Vuetify0 later, the component structure accommodates it.

2. **Cross-Store Communication** — `ordersStore.updateOrderStatus()` directly calls `inventoryStore.deductRecipeIngredients()` and `menuStore.getRecipeFor()`. This is intentional for MVP simplicity. For scale, extract into a service/event bus.

3. **No TypeScript** — All JS for MVP speed. Easy to migrate later with `*.ts` rename + type annotations.

4. **No Chart.js installed** — Bar chart is pure CSS to avoid dependency. The `plan.md` mentions Chart.js but the current `SalesChart.vue` is a zero-dependency CSS bar chart. Install `chart.js` + `vue-chartjs` if proper charts are needed.

5. **JSON Server** — Runs on port 3001. Vite proxies `/api/*` → `http://localhost:3001`. Start with `npm run server` or both with `npm start`.

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run server` | Start JSON Server (port 3001) |
| `npm start` | Run both concurrently |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm test` | Run all tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

---

## File Inventory (66 files)

```
erp-cloud-kitchen/
├── db.json
├── server.js
├── package.json
├── vite.config.js
├── uno.config.js
├── index.html
└── src/
    ├── main.js
    ├── App.vue
    ├── api/
    │   ├── client.js
    │   ├── index.js
    │   └── modules/
    │       ├── inventory.js
    │       ├── orders.js
    │       ├── menu.js
    │       └── analytics.js
    ├── stores/
    │   ├── inventory.js
    │   ├── orders.js
    │   ├── menu.js
    │   └── analytics.js
    ├── router/index.js
    ├── plugins/vuetify0.js
    ├── styles/main.css
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.vue
    │   │   ├── AppDrawer.vue
    │   │   └── AppHeader.vue
    │   ├── ui/
    │   │   ├── VDataTable.vue
    │   │   ├── VDialog.vue
    │   │   ├── VCard.vue
    │   │   ├── VChip.vue
    │   │   ├── VBadge.vue
    │   │   ├── VStatusDot.vue
    │   │   ├── VPageHeader.vue
    │   │   ├── VSearchBar.vue
│   │   ├── VConfirmDialog.vue
│   │   ├── VBanner.vue
│   │   ├── VToast.vue
│   │   └── VTooltip.vue
    │   └── common/
    │       ├── EmptyState.vue
    │       ├── LoadingSkeleton.vue
    │       ├── StatusTimeline.vue
    │       └── ErrorBoundary.vue
    ├── composables/
    │   ├── useSnackbar.js
    │   ├── useTimer.js
    │   ├── useConfirm.js
    │   └── useDebounce.js
    ├── utils/
    │   ├── formatters.js
    │   └── validators.js
    ├── modules/
    │   ├── inventory/
    │   │   ├── views/InventoryList.vue
    │   │   ├── views/StockAdjustment.vue
    │   │   ├── components/IngredientForm.vue
    │   │   └── components/LowStockBanner.vue
    │   ├── kds/
    │   │   ├── views/OrderDashboard.vue
    │   │   ├── views/OrderDetail.vue
    │   │   ├── components/OrderCard.vue
    │   │   ├── components/KdsColumn.vue
    │   │   └── components/OrderTimer.vue
    │   ├── menu/
    │   │   ├── views/MenuList.vue
    │   │   ├── views/RecipeBuilder.vue
    │   │   ├── components/MenuItemForm.vue
    │   │   └── components/IngredientPicker.vue
    │   └── analytics/
    │       ├── views/AnalyticsDashboard.vue
    │       ├── components/KpiCard.vue
    │       ├── components/SalesChart.vue
    │       ├── components/TopSellingTable.vue
    │       └── components/WastageLog.vue
    └── plan.md
```
