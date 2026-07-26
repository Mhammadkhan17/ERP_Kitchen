# Cloud Kitchen MVP ERP — Technical Blueprint

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| UI Library | Vuetify0 (`@vuetify/v0`) — headless composables + components |
| Styling | UnoCSS with `@unocss/preset-wind` |
| State Management | Pinia (modular stores, setup function style) |
| Routing | Vue Router 4 |
| HTTP Client | Axios |
| Mock Backend | JSON Server (`typicode/json-server`) |
| Charts | Chart.js + `vue-chartjs` |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Vue 3 SPA (Vite)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Inventory  │  │   KDS    │  │   Menu   │  │Analytics │  │
│  │  Module   │  │  Module  │  │  Module  │  │  Module  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │             │             │         │
│  ┌────┴─────────────┴─────────────┴─────────────┴────┐    │
│  │                Pinia Stores                        │    │
│  │  useInventoryStore  useOrdersStore                  │    │
│  │  useMenuStore       useAnalyticsStore               │    │
│  └────────────────────────┬──────────────────────────┘    │
│                           │                                │
│  ┌────────────────────────┴──────────────────────────┐    │
│  │            API Service Layer (axios)               │    │
│  │    GET/POST/PUT/DELETE -> http://localhost:3001    │    │
│  └────────────────────────┬──────────────────────────┘    │
└───────────────────────────┼──────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               │     JSON Server         │
               │     (db.json)           │
               │  /ingredients           │
               │  /orders                │
               │  /menuItems             │
               │  /recipes               │
               │  /analytics             │
               └─────────────────────────┘
```

---

## 2. Folder Structure

```
erp-cloud-kitchen/
├── db.json                          # JSON Server mock data
├── server.js                        # Custom JSON Server with middleware hooks
├── package.json
├── vite.config.js                   # Vite config with UnoCSS + proxy
├── uno.config.ts                    # UnoCSS config with v0 theme vars
├── index.html
│
└── src/
    ├── main.js                      # App bootstrap (Pinia, Router, Vuetify0)
    ├── App.vue                      # Root shell with theme provider
    │
    ├── api/
    │   ├── client.js                # Axios instance with baseURL + interceptors
    │   ├── modules/
    │   │   ├── inventory.js         # getIngredients, updateStock, ...
    │   │   ├── orders.js            # getOrders, updateStatus, ...
    │   │   ├── menu.js              # getMenuItems, createRecipe, ...
    │   │   └── analytics.js         # getDailySales, logWastage, ...
    │   └── index.js                 # Re-export all modules
    │
    ├── stores/                      # Pinia stores (setup function style)
    │   ├── inventory.js             # useInventoryStore
    │   ├── orders.js                # useOrdersStore (+ cross-store deduction)
    │   ├── menu.js                  # useMenuStore
    │   └── analytics.js             # useAnalyticsStore
    │
    ├── router/
    │   └── index.js                 # Route definitions per module
    │
    ├── plugins/
    │   └── vuetify0.js              # Vuetify0 createThemePlugin config
    │
    ├── components/
    │   ├── ui/                      # Styled UI primitives (built on v0)
    │   │   ├── VDataTable.vue       # createDataTable + styled <table>
    │   │   ├── VDialog.vue          # Dialog.Root wrapper
    │   │   ├── VBanner.vue          # Banner/alert notification
    │   │   ├── VCard.vue            # Card with surface bg
    │   │   ├── VBadge.vue           # Count badge
    │   │   ├── VChip.vue            # Status chip
    │   │   ├── VStatusDot.vue       # Colored status dot
    │   │   ├── VSearchBar.vue       # Search input
    │   │   ├── VPageHeader.vue      # Page title + actions
    │   │   └── VConfirmDialog.vue   # Confirmation dialog wrapper
    │   │
    │   ├── layout/
    │   │   ├── AppLayout.vue        # Shell: sidebar + header + router-view
    │   │   ├── AppDrawer.vue        # Navigation drawer
    │   │   └── AppHeader.vue        # Top bar with branding
    │   │
    │   └── common/
    │       ├── EmptyState.vue
    │       ├── LoadingSkeleton.vue
    │       └── StatusTimeline.vue
    │
    ├── modules/
    │   ├── inventory/
    │   │   ├── views/
    │   │   │   ├── InventoryList.vue        # v-for table, search, filter
    │   │   │   └── StockAdjustment.vue      # Adjust stock in/out
    │   │   └── components/
    │   │       ├── IngredientForm.vue       # createForm + fields
    │   │       └── LowStockBanner.vue       # Alert banner
    │   │
    │   ├── kds/
    │   │   ├── views/
    │   │   │   ├── OrderDashboard.vue       # 4-column Kanban layout
    │   │   │   └── OrderDetail.vue          # Dialog with timeline
    │   │   └── components/
    │   │       ├── OrderCard.vue            # Order card with status actions
    │   │       ├── KdsColumn.vue            # Kanban column shell
    │   │       └── OrderTimer.vue           # Elapsed time display
    │   │
    │   ├── menu/
    │   │   ├── views/
    │   │   │   ├── MenuList.vue             # Menu items table + brand toggles
    │   │   │   └── RecipeBuilder.vue        # ExpansionPanel recipe editor
    │   │   └── components/
    │   │       ├── MenuItemForm.vue         # createForm for menu item
    │   │       └── IngredientPicker.vue     # createCombobox ingredient search
    │   │
    │   └── analytics/
    │       ├── views/
    │       │   └── AnalyticsDashboard.vue   # KPI cards + charts + tables
    │       └── components/
    │           ├── KpiCard.vue
    │           ├── SalesChart.vue           # Chart.js line/bar chart
    │           ├── TopSellingTable.vue
    │           └── WastageLog.vue
    │
    ├── composables/
    │   ├── useSnackbar.js
    │   ├── useConfirm.js
    │   ├── useTimer.js
    │   └── useDebounce.js
    │
    ├── utils/
    │   ├── formatters.js            # Currency, date, status label fns
    │   └── validators.js            # Form validation rules
    │
    └── styles/
        └── main.css                 # @import "unocss" + v0 theme var mappings
```

---

## 3. Vuetify0 Primitives per Module

### 3.1 Inventory Module

| Component | Vuetify0 Primitives |
|-----------|-------------------|
| `InventoryList.vue` | `createDataTable` — sort/filter/paginate; `createFilter` — search; `createPagination` — pages; `Popover` — row actions; `VDialog` (wraps `Dialog.Root`) — add/edit modal |
| `LowStockBanner.vue` | Unstyled `<div>` with UnoCSS `bg-error/10` class |
| `IngredientForm.vue` | `createForm` — validation state; native `<input>`/`<select>` + UnoCSS |

### 3.2 KDS Module

| Component | Vuetify0 Primitives |
|-----------|-------------------|
| `OrderDashboard.vue` | Flexbox grid with `v-for` cards; `useWindowEventListener` — polling; `createKanban` — cross-column transfer |
| `OrderCard.vue` | `Popover` — status change options; native `<button>` with UnoCSS |
| `OrderDetail.vue` | `VDialog` (wraps `Dialog.Root`) |
| `OrderTimer.vue` | `useTimer` composable |

### 3.3 Menu Module

| Component | Vuetify0 Primitives |
|-----------|-------------------|
| `MenuList.vue` | `createDataTable`; `createFilter`; `createPagination`; `Single` — brand filter tabs; `VDialog` |
| `RecipeBuilder.vue` | `ExpansionPanel` — one per menu item; `Group` — checkbox selections; `Checkbox` (headless) |
| `IngredientPicker.vue` | `Popover` + `createFilter` — searchable dropdown |

### 3.4 Analytics Module

| Component | Vuetify0 Primitives |
|-----------|-------------------|
| `AnalyticsDashboard.vue` | `Single` — period selector buttons |
| `KpiCard.vue` | Unstyled `<div>` with `bg-surface` |
| `SalesChart.vue` | Chart.js via `vue-chartjs` |
| `WastageLog.vue` | `createDataTable`; `createFilter` |

---

## 4. Pinia Store Schemas

### stores/inventory.js — useInventoryStore

```
STATE
  ingredients: ref([])        -> Ingredient[]
  loading: ref(false)
  error: ref(null)
  filters: ref({ search: '', unit: '' })

GETTERS
  lowStockIngredients          -> ingredients where currentStock <= reorderLevel
  ingredientsByUnit            -> grouped by unit of measure
  stockStatus(ingredient)      -> 'ok' | 'low' | 'critical'

ACTIONS
  fetchIngredients()
  createIngredient(payload)
  updateIngredient(id, payload)
  deleteIngredient(id)
  adjustStock(ingredientId, delta, reason)
  deductRecipeIngredients(menuItemId, quantity)   <- called by ordersStore
  checkLowStock()
```

### stores/orders.js — useOrdersStore

```
STATE
  orders: ref([])              -> Order[]
  loading: ref(false)
  error: ref(null)
  activeStatusFilter: ref('all')
  newOrderAlert: ref(false)

GETTERS
  ordersByStatus(status)       -> filtered orders
  pendingOrders                -> count for badge
  activeOrders                 -> pending + preparing
  orderCountsByStatus          -> { pending: N, preparing: N, ... }

ACTIONS
  fetchOrders()
  createOrder(payload)
  updateOrderStatus(orderId, newStatus)
    // status -> 'preparing' : calls inventoryStore.deductRecipeIngredients()
    // status -> 'cancelled' : calls inventoryStore.refundRecipeIngredients()
  markAsPreparing(orderId)
  markAsReady(orderId)
  markAsDispatched(orderId)
  pollForNewOrders()           -> periodic fetch
```

### stores/menu.js — useMenuStore

```
STATE
  menuItems: ref([])           -> MenuItem[]
  brands: ref([])              -> string[]
  loading: ref(false)
  error: ref(null)

GETTERS
  activeMenuItems              -> isActive === true
  itemsByBrand(brand)          -> grouped
  getRecipeFor(itemId)         -> resolved recipe with ingredient details

ACTIONS
  fetchMenuItems()
  createMenuItem(payload)
  updateMenuItem(id, payload)
  toggleBrandActive(menuItemId)
  addIngredientToRecipe(menuItemId, ingredientId, quantity)
  removeIngredientFromRecipe(menuItemId, ingredientId)
```

### stores/analytics.js — useAnalyticsStore

```
STATE
  dailySales: ref([])
  topItems: ref([])
  wastageLogs: ref([])
  dateRange: ref({ start, end })
  period: ref('daily')
  loading: ref(false)

GETTERS
  totalRevenue
  totalWastageCost
  averageOrderValue

ACTIONS
  fetchDailySales(range)
  fetchTopItems(range)
  fetchWastageLogs(range)
  logWastage(payload)
  logCompletedOrder(order)     <- called by ordersStore at 'dispatched'
```

---

## 5. Critical Cross-Store Flow: Order -> Inventory Deduction

```
[Chef taps "Start Preparing" on KDS]
        |
        v
ordersStore.updateOrderStatus(orderId, 'preparing')
        |
        |-- API: PATCH /orders/:id { status: 'preparing' }
        |
        |-- for each item in order.items:
        |     recipe = menuStore.getRecipeFor(item.menuItemId)
        |     for each ingredient in recipe:
        |       deduction = ingredient.quantity * item.quantity
        |       inventoryStore.adjustStock(ingredient.id, -deduction, 'order_deduction')
        |
        |-- inventoryStore.checkLowStock()
        |     if currentStock <= reorderLevel:
        |       set isLowStock = true, trigger UI alert
        |
        v
KDS card moves to "Preparing" column
```

Reverse flow on cancellation refunds stock. Analytics logs at "dispatched".

---

## 6. Mock Data Models (db.json)

```json
{
  "ingredients": [
    {
      "id": "ing-001",
      "name": "Chicken Breast",
      "unit": "kg",
      "currentStock": 12.5,
      "reorderLevel": 5.0,
      "reorderQty": 10.0,
      "unitCost": 4.50,
      "supplier": "FarmFresh Co.",
      "category": "protein",
      "isLowStock": false,
      "updatedAt": "2026-07-13T08:00:00Z"
    }
  ],
  "menuItems": [
    {
      "id": "item-001",
      "name": "Butter Chicken Bowl",
      "brandId": "brand-01",
      "brandName": "Tandoori Express",
      "price": 12.99,
      "category": "mains",
      "isActive": true,
      "popularity": 4.5
    }
  ],
  "recipes": [
    {
      "id": "recipe-001",
      "menuItemId": "item-001",
      "ingredients": [
        { "ingredientId": "ing-001", "quantity": 0.2 },
        { "ingredientId": "ing-002", "quantity": 0.15 }
      ],
      "servings": 1,
      "version": 1
    }
  ],
  "orders": [
    {
      "id": "ord-001",
      "orderNumber": 1042,
      "source": "uber-eats",
      "customerName": "John D.",
      "items": [
        {
          "menuItemId": "item-001",
          "name": "Butter Chicken Bowl",
          "quantity": 2,
          "unitPrice": 12.99,
          "specialInstructions": "extra spicy"
        }
      ],
      "totalAmount": 25.98,
      "status": "pending",
      "brandId": "brand-01",
      "timestamps": {
        "placedAt": "2026-07-13T18:30:00Z",
        "startedAt": null,
        "readyAt": null,
        "dispatchedAt": null
      },
      "prepTimeTarget": 15
    }
  ],
  "brands": [
    { "id": "brand-01", "name": "Tandoori Express", "color": "#E65100" }
  ],
  "analytics_sales": [
    {
      "id": "sales-001",
      "date": "2026-07-13",
      "totalRevenue": 1245.50,
      "orderCount": 38,
      "itemsSold": [
        { "menuItemId": "item-001", "units": 22 }
      ]
    }
  ],
  "wastage_logs": [
    {
      "id": "waste-001",
      "date": "2026-07-13",
      "ingredientId": "ing-002",
      "quantity": 0.5,
      "unit": "kg",
      "reason": "overcooked"
    }
  ]
}
```

---

## 7. Router Structure

```js
const routes = [
  {
    path: '/',
    component: AppLayout,
    redirect: '/kds',
    children: [
      { path: 'kds',              name: 'kds.dashboard',  component: () => import('@/modules/kds/views/OrderDashboard.vue') },
      { path: 'kds/:id',         name: 'kds.detail',     component: () => import('@/modules/kds/views/OrderDetail.vue') },
      { path: 'inventory',        name: 'inventory.list', component: () => import('@/modules/inventory/views/InventoryList.vue') },
      { path: 'inventory/adjust', name: 'inventory.adjust', component: () => import('@/modules/inventory/views/StockAdjustment.vue') },
      { path: 'menu',             name: 'menu.list',      component: () => import('@/modules/menu/views/MenuList.vue') },
      { path: 'menu/recipes',     name: 'menu.recipes',   component: () => import('@/modules/menu/views/RecipeBuilder.vue') },
      { path: 'analytics',        name: 'analytics.dashboard', component: () => import('@/modules/analytics/views/AnalyticsDashboard.vue') },
    ],
  },
]
```

**Navigation Drawer:**

| Icon | Label | Route |
|------|-------|-------|
| `mdi-chef-hat` | KDS Dashboard | `/kds` |
| `mdi-package-variant` | Inventory | `/inventory` |
| `mdi-food` | Menu & Recipes | `/menu` |
| `mdi-chart-bar` | Analytics | `/analytics` |

---

## 8. Dependencies

```json
{
  "dependencies": {
    "vue": "^3.5",
    "@vuetify/v0": "^1.0.0-beta",
    "pinia": "^2",
    "vue-router": "^4",
    "axios": "^1",
    "chart.js": "^4",
    "vue-chartjs": "^5"
  },
  "devDependencies": {
    "vite": "^6",
    "unocss": "^0.65",
    "@unocss/preset-wind": "^0.65",
    "json-server": "^0.17",
    "@vue/test-utils": "^2",
    "vitest": "^2"
  }
}
```

---

## 9. Implementation Roadmap

### Phase 0 — Project Scaffolding
- [ ] `npm create vue@latest` (Vite + Vue 3, no TypeScript, no Router, no Pinia via CLI — add manually)
- [ ] Install all dependencies
- [ ] Create `uno.config.ts` with `presetWind()` + v0 theme color mappings
- [ ] Create `src/plugins/vuetify0.js` with `createThemePlugin` (kitchen brand colors)
- [ ] Create `src/styles/main.css`: `@import "unocss"` + v0 CSS variable overrides
- [ ] Configure `vite.config.ts` with UnoCSS plugin + JSON Server proxy
- [ ] Create `db.json` with seed data (10 ingredients, 5 menu items, 2 brands, 5 orders, recipes)
- [ ] Create `server.js` with JSON Server + timestamp middleware
- [ ] Build `AppLayout.vue`, `AppDrawer.vue`, `AppHeader.vue` shell
- [ ] Set up `src/router/index.js` with all routes

### Phase 1a — Build UI Primitives
- [ ] `VDataTable.vue` — wrapper around `createDataTable` + styled `<table>`
- [ ] `VDialog.vue` — wrapper around `Dialog.Root`
- [ ] `VChip.vue`, `VBadge.vue`, `VStatusDot.vue`
- [ ] `VPageHeader.vue`, `VSearchBar.vue`, `VConfirmDialog.vue`
- [ ] `VCard.vue`, `VBanner.vue`
- [ ] `LoadingSkeleton.vue`, `EmptyState.vue`

### Phase 1b — Inventory Module
- [ ] Create `useInventoryStore` with full CRUD + stock adjustment
- [ ] Build `api/modules/inventory.js`
- [ ] Build `InventoryList.vue` with search, filter, pagination
- [ ] Build `IngredientForm.vue` (dialog form with validation)
- [ ] Build `StockAdjustment.vue`
- [ ] Build `LowStockBanner.vue`

### Phase 2 — Menu & Recipe Module
- [ ] Create `useMenuStore` with CRUD + recipe management
- [ ] Build `api/modules/menu.js`
- [ ] Build `MenuList.vue` with brand toggle switches
- [ ] Build `MenuItemForm.vue`
- [ ] Build `RecipeBuilder.vue` with expansion panels
- [ ] Build `IngredientPicker.vue` (autocomplete via `createCombobox`)

### Phase 3 — KDS & Order Management (HIGHEST COMPLEXITY)
- [ ] Create `useOrdersStore` with status management + cross-store deduction
- [ ] Build `api/modules/orders.js`
- [ ] Build `KdsColumn.vue` (Kanban column)
- [ ] Build `OrderCard.vue` (with chip, timer, status buttons)
- [ ] Build `OrderTimer.vue`
- [ ] Build `OrderDashboard.vue` (4-column grid with `createKanban`)
- [ ] Build `OrderDetail.vue` (dialog with timeline)
- [ ] Implement critical deduction flow: `updateOrderStatus -> deductRecipeIngredients -> checkLowStock`
- [ ] Add polling for new orders (30s interval)

### Phase 4 — Analytics Module
- [ ] Create `useAnalyticsStore`
- [ ] Build `api/modules/analytics.js`
- [ ] Build `KpiCard.vue`
- [ ] Build `SalesChart.vue` (Chart.js)
- [ ] Build `TopSellingTable.vue`
- [ ] Build `WastageLog.vue`
- [ ] Wire `logCompletedOrder` hook at "dispatched" transition

### Phase 5 — Polish
- [ ] Confirm dialog for destructive actions
- [ ] Loading skeletons on data tables
- [ ] Error boundaries + snackbar notifications
- [ ] Mobile responsiveness (single-column KDS at <960px, fullscreen dialogs at <600px)
- [ ] KDS new-order alert (banner + sound)
- [ ] `v-data-table` pagination limits for large datasets
