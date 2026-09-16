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
│                    ┌────────┴────────┐                          │
│                    │   API Client    │◄──── Socket.IO Client    │
│                    │   (Axios)       │      (real-time)         │
│                    └────────┬────────┘                          │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTP (/api/*)
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Node.js Server (port 3001)                    │
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   JSON Server    │    │    Socket.IO     │                   │
│  │  (REST API)      │    │   (WebSocket)    │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                             │
│           ▼                       │                             │
│  ┌──────────────────┐             │                             │
│  │     db.json      │    Broadcasts on order mutations         │
│  │  (flat file DB)  │                                         │
│  └──────────────────┘                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Order Lifecycle (Real-time)

```
Kitchen Staff clicks "Start" on OrderCard
  → useOrderFlow.startPreparing(orderId)
  → api.orders.updateStatus(id, 'preparing')    [PATCH /api/orders/:id]
  → server.js intercepts response
  → io.emit('order:update', { id, status, ... }) [Socket.IO broadcast]
  → ALL connected clients receive event
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
  → Axios HTTP request
  → Vite proxy (/api/* → localhost:3001)
  → JSON Server (reads/writes db.json)
  → Response flows back up
  → Vue Query updates cache
  → Vue reactivity re-renders
```

### Real-time Update Pattern

```
Socket.IO 'order:update' event
  → useOrderFeed / useCustomerOrders composable
  → socket.off() on unmount (cleanup)
  → patches Vue Query cache via setQueryData
  → No refetch needed — Vue reactivity handles UI
```

## Key Decisions

### 1. JSON Server as Mock Backend

**Decision:** Use `json-server` for rapid prototyping instead of building a real API.

**Trade-offs:**
- (+) Zero backend code — instant REST API from a JSON file
- (+) Great for UI development and testing
- (-) No real business logic (stock deduction is client-side, race conditions possible)
- (-) No authentication or authorization
- (-) Flat file storage — no relational integrity

**Future:** Replace with Express + PostgreSQL (Neon) or Supabase when moving to production.

### 2. TanStack Vue Query over Pinia

**Decision:** Use Vue Query for all server state instead of Pinia stores.

**Trade-offs:**
- (+) Automatic caching, deduplication, and background refetch
- (+) Mutation invalidation is declarative
- (+) Loading/error states are built-in
- (-) Pinia is imported but unused — potential confusion
- (-) Two data-fetching patterns (Query + Socket.IO cache patching) adds complexity

### 3. Module-based Architecture

**Decision:** Organize by feature (inventory, kds, menu, analytics) not by layer.

**Trade-offs:**
- (+) Each module is self-contained with views, components, and composables
- (+) Easy to find related code
- (-) Some duplication across modules (e.g., similar table patterns)

### 4. Socket.IO for Real-time

**Decision:** Use Socket.IO with a singleton client pattern.

**Trade-offs:**
- (+) Auto-reconnection, fallback to polling
- (+) Reference-counted connections (shared across components)
- (-) Cache patching logic is complex — must handle both existing and new orders
- (-) No message persistence — missed events are lost

### 5. Inline SVG Charts

**Decision:** Build a custom SVG line chart instead of using Chart.js everywhere.

**Trade-offs:**
- (+) Full control over tooltips, animations, and layout
- (+) Smaller bundle than Chart.js for simple charts
- (-) Chart.js is still in dependencies (used in SalesChart.vue)
- (-) Two charting approaches in the same dashboard

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
| 5173 | Vite Dev Server | Frontend SPA, proxies `/api/*` to 3001 |
| 3001 | JSON Server + Socket.IO | REST API + WebSocket |
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

### Real-time State (Socket.IO + Cache Patching)

WebSocket events patch the Vue Query cache in-place without refetching:

```typescript
socket.on('order:update', (update) => {
  queryClient.setQueryData(['orders'], (old) => {
    // Update existing order or append new one
  })
})
```

## Limitations

1. **No persistence** — `db.json` resets on server restart
2. **No auth** — all endpoints are publicly accessible
3. **Race conditions** — stock adjustments do GET-then-PATCH (not atomic)
4. **No pagination** — all records returned in single response
5. **No validation** — JSON Server doesn't enforce schema constraints
6. **Client-side business logic** — order status transitions, stock deduction happen in the browser
