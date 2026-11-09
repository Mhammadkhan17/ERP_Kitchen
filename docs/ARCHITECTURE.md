# Architecture

## Context

Cloud Kitchen ERP is a single-page application for managing multi-brand cloud kitchen operations. It provides real-time order tracking, inventory management, recipe management, and analytics from a unified dashboard.

## Goals

- Real-time order flow management across multiple restaurant brands
- Ingredient inventory tracking with low-stock alerts
- Recipe-to-ingredient linkage for menu items
- Sales analytics and wastage tracking
- Customer-facing order status pages

## High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                            │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │   KDS    │  │Inventory │  │   Menu   │  │   Analytics    │  │
│  │ Module   │  │ Module   │  │  Module  │  │    Module      │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬────────┘  │
│       │              │              │                │           │
│       └──────────────┴──────┬───────┴────────────────┘           │
│                             │                                    │
│                    ┌────────┴────────┐                          │
│                    │ TanStack Vue    │                          │
│                    │ Query (cache +  │                          │
│                    │ server state)   │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│              ┌──────────────┴──────────────┐                    │
│              │                             │                    │
│     ┌────────┴────────┐          ┌────────┴────────┐           │
│     │   API Client    │          │  useSocket      │           │
│     │ (Supabase JS)   │          │ (Realtime sub)  │           │
│     └────────┬────────┘          └────────┬────────┘           │
└──────────────┼────────────────────────────┼─────────────────────┘
               │ HTTPS (PostgREST)          │ WSS (Realtime)
               ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase Project                             │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                    │
│  │  PostgREST API   │    │ Realtime         │                    │
│  │  (auto REST)     │    │ postgres_changes │                    │
│  └────────┬─────────┘    └────────┬─────────┘                    │
│           │                       │                              │
│           ▼                       │                              │
│  ┌──────────────────┐             │                              │
│  │  Postgres        │   broadcasts orders row changes            │
│  │  (8 tables, RLS) │                                            │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Order Lifecycle (Real-time)

```
Kitchen Staff clicks "Start" on OrderCard
  → useOrderFlow.startPreparing(orderId)
  → api.orders.updateStatus(id, 'preparing')    [PATCH via PostgREST]
  → client.ts throws-on-error, returns updated row
  → Supabase emits postgres_changes on orders   [row update]
  → useSocket adapter maps row → { id, status, orderNumber, customerId }
  → dispatches local 'order:update' listeners
  → useOrderFeed patches Vue Query cache        [in-memory update]
  → Vue reactivity re-renders affected components
  → KDS columns reorder instantly
  → Customer portal shows live status to customer
```

### Data Fetching Pattern

Every module follows the same pattern:

```
Vue Component
  → useXxx() composable (useQuery/useMutation)
  → api.xxx.method() (src/api/client.ts)
  → Supabase client (PostgREST HTTPS)
  → Response flows back up (error → throw → Vue Query error state)
  → Vue Query updates cache
  → Vue reactivity re-renders
```

### Real-time Update Pattern

```
Supabase postgres_changes (orders table)
  → src/composables/useSocket.ts adapter
  → 'order:update' listeners (useOrderFeed / useCustomerOrders)
  → off() on unmount (cleanup, refcounted channel)
  → patches Vue Query cache via setQueryData
  → No refetch needed — Vue reactivity handles UI
```

## Key Decisions

### 1. Supabase as Backend

**Decision:** Use Supabase (Postgres + PostgREST + Realtime) as the single backend, reached directly from the browser.

**Trade-offs:**
- (+) Database + REST + realtime in one service; no separate server to host
- (+) Schema constraints (CHECK, FK, NOT NULL) enforced in Postgres
- (+) Auth can be layered on later via RLS narrowing (policies are permissive today)
- (-) RLS policies are wide open for anon (MVP parity with json-server's zero auth)
- (-) Stock adjustments are still GET-then-PATCH (not atomic) — same as before
- (-) Free-tier projects pause after inactivity

**History:** Replaced json-server (`server.js` + `db.json`) when deploying to Vercel — static hosting has no Node process for the mock backend.

### 2. TanStack Vue Query over Pinia

**Decision:** Use Vue Query for all server state instead of Pinia stores.

**Trade-offs:**
- (+) Automatic caching, deduplication, and background refetch
- (+) Mutation invalidation is declarative
- (+) Loading/error states are built-in
- (-) Two data-fetching patterns (Query + realtime cache patching) adds complexity

### 3. Module-based Architecture

**Decision:** Organize by feature (inventory, kds, menu, analytics) not by layer.

**Trade-offs:**
- (+) Each module is self-contained with views, components, and composables
- (+) Easy to find related code
- (-) Some duplication across modules (e.g., similar table patterns)

### 4. Supabase Realtime behind the order:update contract

**Decision:** Subscribe to `postgres_changes` on `orders` once (singleton, refcounted), translate rows into the existing `{ id, status, orderNumber, customerId }` payload, and dispatch to `socket.on('order:update')` listeners.

**Trade-offs:**
- (+) Consumers (`useOrderFeed`, `useCustomerOrders`) unchanged from the Socket.IO era
- (+) Supabase manages reconnection and channel lifecycle
- (-) Cache patching logic is complex — must handle both existing and new orders
- (-) No message persistence — missed events are lost

### 5. Inline SVG Charts

**Decision:** Build a custom SVG line chart instead of a charting library.

**Trade-offs:**
- (+) Full control over tooltips, animations, and layout
- (+) Smaller bundle than Chart.js for simple charts
- (-) Hand-rolled maintenance burden as charts grow

## Component Hierarchy

```
App.vue
├── AppLayout.vue (authenticated routes)
│   ├── AppDrawer.vue (desktop sidebar)
│   ├── AppHeader.vue (mobile header)
│   └── <router-view>
│       ├── OrderDashboard.vue (KDS)
│       │   ├── KdsColumn.vue × 4
│       │   │   └── OrderCard.vue
│       │   │       └── OrderTimer.vue
│       │   └── OrderDetail dialog
│       ├── InventoryList.vue
│       │   ├── IngredientForm.vue (dialog)
│       │   ├── LowStockBanner.vue
│       │   └── StockAdjustment.vue
│       ├── MenuList.vue
│       │   ├── MenuItemForm.vue (dialog)
│       │   └── RecipeBuilder.vue
│       │       └── IngredientPicker.vue
│       └── AnalyticsDashboard.vue
│           ├── KpiCard.vue × 4
│           ├── DailyRevenueGraph.vue
│           ├── TopSellingTable.vue
│           ├── BrandPerformance.vue
│           └── WastageLog.vue
│
└── PublicLayout.vue (public routes)
    ├── OrderTracking.vue
    │   ├── OrderCardCompact.vue
    │   └── StatusTimeline.vue
    └── CustomerPortal.vue
        ├── OrderCardCompact.vue
        └── StatusTimeline.vue
```

## Data Models

Core entities and their relationships:

```
Brand (1) ──────< (many) MenuItem
                        │
                        ├── (1:1) Recipe
                        │         └── (many) RecipeIngredient
                        │                     └── references Ingredient
                        │
                        └── referenced by OrderItem
                                  └── belongs to Order
                                        └── references Customer

DailySales ── contains itemsSold[] referencing MenuItems
WastageLog ── references Ingredient
```

### ID Formats

| Entity | Format | Example |
|--------|--------|---------|
| Ingredient | `ing-NNN` | `ing-001` |
| Brand | `brand-NN` | `brand-01` |
| MenuItem | `item-NNN` | `item-001` |
| Recipe | `recipe-NNN` | `recipe-001` |
| Order | `ord-NNN` | `ord-001` |
| Sales | `sales-NNN` | `sales-001` |
| Wastage | `waste-NNN` | `waste-001` |
| Customer | numeric | `1` |

## Ports and Services

| Port | Service | Description |
|------|---------|-------------|
| 5173 | Vite Dev Server | Frontend SPA (talks directly to Supabase over HTTPS/WSS) |
| 4173 | Vite Preview | Production build preview |

## State Management

### Server State (Vue Query)

All API data is managed by TanStack Vue Query. Each module has composables that wrap `useQuery` and `useMutation`:

```typescript
// Pattern used across all modules
export function useIngredients() {
  return useQuery({
    queryKey: ['ingredients'],
    queryFn: () => api.ingredients.list(),
  })
}

export function useCreateIngredient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.ingredients.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ingredients'] }),
  })
}
```

### Client State (Reactive Refs)

UI-only state (search queries, expanded panels, form data) uses Vue `ref` and `reactive` directly in components.

### Real-time State (Supabase Realtime + Cache Patching)

Realtime events patch the Vue Query cache in-place without refetching:

```typescript
// src/composables/useSocket.ts maps postgres_changes rows
// to the 'order:update' payload, then:
socket.on('order:update', (update) => {
  queryClient.setQueryData(['orders'], (old) => {
    // Update existing order or append new one
  })
})
```

## Limitations

1. **No auth** — RLS policies allow anon full read/write (planned follow-up: narrow policies + Supabase Auth)
2. **Race conditions** — stock adjustments do GET-then-PATCH (not atomic)
3. **No pagination** — all records returned in single response
4. **Client-side business logic** — order status transitions, stock deduction happen in the browser
5. **Free-tier pause** — inactive Supabase projects suspend until woken
