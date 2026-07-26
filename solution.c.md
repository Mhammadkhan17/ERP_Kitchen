# Solution C — Route Prefix Restructure + Cart Module

## 1. Overview

This document details the implementation of **Approach B-1** — moving admin routes under `/admin`, placing the customer portal at `/`, and introducing a `modules/customer/` module with UUID session-based cart composable, menu browser, checkout flow, and order management.

**Core insight:** UUID sessions eliminate the phone-gate barrier, enabling Socket.IO real-time updates for every visitor immediately. No login required.

---

## 2. Judge Feedback Addressed

### 2.1 UUID Sessions Eliminate Phone Gate
- **How it works:** On first visit, `crypto.randomUUID()` generates a session ID stored in `localStorage` as `customer_session_id`. This ID is sent with every order as `customerSessionId` and used to retrieve orders via `/orders?customerSessionId=<uuid>`.
- **Why it matters:** Socket.IO real-time updates (via `order:update` events) work for every visitor because `customerSessionId` always exists. The `customerSessionId` is included in the `OrderUpdatePayload` broadcast by `server.js`, and `useCustomerOrderFeed` filters on it client-side to patch the correct query cache.
- **Retrieval flow:** User visits `/orders` → query client calls `api.orders.list({ customerSessionId })` → json-server filters by the UUID → all orders for that session are displayed. The user never enters a phone number.

### 2.2 Guest Checkout Flow & Order Number Generation

#### Checkout Flow
1. User browses menu at `/` and adds items to cart.
2. Cart badge in header shows item count. Clicking opens `CartPanel` slideover.
3. From `CartPanel`, user clicks "Checkout" → navigates to `/checkout`.
4. `CheckoutPage` shows:
   - Cart summary (read-only items, quantities, totals)
   - Optional customer name field (defaults to "Guest" if empty)
   - Optional special instructions field
   - "Place Order" button with loading state
5. On submit:
   - `POST /orders` with `{ orderNumber, source: 'direct', customerName, customerSessionId, items, totalAmount, status: 'pending', brandId, timestamps: { placedAt: now }, prepTimeTarget: 15 }`
   - `orderNumber` is fetched first via `GET /orders?_sort=orderNumber&_order=desc&_limit=1` and incremented
   - On success: clear cart, show success toast, redirect to `/orders/:id`
   - On error: show error toast, stay on checkout page
6. User lands on `OrderDetail` with the new order and real-time status timeline.

#### Order Number Generation
- Client calls `api.orders.list({ _sort: 'orderNumber', _order: 'desc', _limit: 1 })` to get the highest existing `orderNumber`.
- New `orderNumber = (max || 2000) + 1`.
- This runs inside the mutation as a warm-up query, avoiding race conditions by using the mutation function context.

### 2.3 Error & Loading States
Every view handles four states:
| State | Visual |
|-------|--------|
| Loading | Skeleton cards matching the layout (animated placeholders) |
| Empty | Icon + message + suggested action |
| Error | Error message + Retry button |
| Success | Rendered data |

`useSnackbar` (PrimeVue Toast) surfaces mutation errors globally.

### 2.4 Namespaced Query Keys
| Context | Query Key | Invalidated By |
|---------|-----------|----------------|
| Admin KDS | `['orders']` | `useOrderFeed` socket handler patches `['orders']` |
| Customer session | `['orders', 'customer', sessionId]` | `useCustomerOrderFeed` patches `['orders', 'customer', sessionId]` |
| Order tracking | `['order', 'tracking', orderNumber]` | `useOrderTracking` patches `['order', 'tracking', orderNumber]` |

Keys are fully disjoint. Admin `useOrderFeed` never touches customer cache.

### 2.5 Module Naming: `customer` not `customer-order`
Renamed per convention to match existing module names (`kds`, `inventory`, `menu`).

---

## 3. File Manifest

All new files are marked with **(N)**, modified files with **(M)**.

```
src/
  router/index.ts                    (M) — admin prefix, customer routes, legacy guard
  types/index.ts                     (M) — add customerSessionId, CartItem, GuestOrderPayload
  types/api.ts                       (M) — add orders.update, orders.delete
  api/client.ts                      (M) — implement orders.update, orders.delete

  components/layout/
    CustomerLayout.vue               (N) — navbar, cart badge, responsive wrapper

  modules/customer/
    composables/
      useCustomerSession.ts          (N) — UUID generation + localStorage
      useCart.ts                     (N) — reactive cart + localStorage persistence
      useCustomerOrderFeed.ts        (N) — WebSocket listener for customer keys
      useCustomerOrders.ts           (N) — query orders by session ID
      usePlaceOrder.ts               (N) — place order mutation with orderNumber generation
      useModifyOrder.ts              (N) — PATCH items & DELETE/cancel mutations

    views/
      MenuBrowser.vue                (N) — browse menu, filter, add to cart
      CartPanel.vue                  (N) — slideover cart drawer
      CheckoutPage.vue               (N) — review & place order
      OrderHistory.vue               (N) — list of session orders
      OrderDetail.vue                (N) — single order with timeline, modify/cancel

  modules/kds/
    composables/
      useOrderFeed.ts                (M) — ensure only ['orders'] key is touched
      useOrderFlow.ts                (M) — update invalidateQueries key scope

  modules/order-status/
    composables/
      useCustomerOrders.ts           (U) — unchanged, still functional
    views/
      CustomerPortal.vue             (U) — unchanged, accessible via /portal redirect

server.js                            (M) — broadcast customerSessionId in order:update payload
```

- (U) = untouched

---

## 4. Implementation Details

### 4.1 Types (`src/types/index.ts`)

**Additions:**

```typescript
export interface CartItem {
  menuItemId: string
  name: string
  unitPrice: number
  quantity: number
  specialInstructions?: string
  brandId: string
  brandName: string
  category: string
}

export interface CartState {
  items: CartItem[]
  updatedAt: string
}

export interface GuestOrderPayload {
  orderNumber: number
  source: string
  customerName: string
  customerSessionId: string
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  brandId: string
  timestamps: OrderTimestamps
  prepTimeTarget: number
}
```

**Modifications to existing types:**

```typescript
// Order interface — add optional customerSessionId
export interface Order {
  // ... existing fields ...
  customerSessionId?: string   // NEW
}

// OrderUpdatePayload — add customerSessionId for WS filtering
export interface OrderUpdatePayload {
  id: string
  status: OrderStatus
  orderNumber: number
  customerId?: number
  customerSessionId?: string   // NEW
}
```

### 4.2 API Client (`src/api/client.ts` + `src/types/api.ts`)

**api/client.ts — add to `orders` object:**

```typescript
orders: {
  // ... existing list, get, create, updateStatus ...
  update: (id: string, data: Partial<Order>) => 
    http.patch(`/orders/${id}`, data).then((r) => r.data),
  delete: (id: string) => http.delete(`/orders/${id}`),
},
```

**types/api.ts — add to `orders` interface:**

```typescript
orders: {
  // ... existing list, get, create, updateStatus ...
  update: (id: string, data: Partial<Order>) => Promise<Order>
  delete: (id: string) => Promise<void>
}
```

### 4.3 Server (`server.js`)

**Modify `router.render` to include `customerSessionId` in broadcast:**

```javascript
router.render = (req, res) => {
  const isOrder = req.url.startsWith('/orders')
  if (isOrder && (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT')) {
    const order = res.locals.data
    io.emit('order:update', {
      id: order.id,
      status: order.status,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerSessionId: order.customerSessionId,  // NEW
    })
  }
  res.json(res.locals.data)
}
```

### 4.4 Router (`src/router/index.ts`)

Complete restructure:

```
Routes:
  /                          → CustomerLayout
    /                        → MenuBrowser (name: customer.menu)
    /checkout                → CheckoutPage (name: customer.checkout)
    /orders                  → OrderHistory (name: customer.orders)
    /orders/:id              → OrderDetail (name: customer.order-detail)

  /track                     → PublicLayout
    /                        → OrderTracking (name: track.order) [UNCHANGED]

  /portal                    → redirect to /orders (name: customer.orders)

  /admin                     → AppLayout
    /admin                   → redirect /admin/kds
    /admin/kds               → OrderDashboard (name: admin.kds)
    /admin/inventory         → InventoryList (name: admin.inventory)
    /admin/inventory/adjust  → StockAdjustment (name: admin.inventory.adjust)
    /admin/menu              → MenuList (name: admin.menu)
    /admin/menu/recipes      → RecipeBuilder (name: admin.menu.recipes)
    /admin/analytics         → AnalyticsDashboard (name: admin.analytics)

Legacy redirect guard:
  /kds /inventory /menu /analytics → /admin/<path>?redirected=1
```

**Guard implementation:**

```typescript
const LEGACY_ADMIN_PATHS = ['/kds', '/inventory', '/menu', '/analytics']

router.beforeEach((to, from, next) => {
  const match = LEGACY_ADMIN_PATHS.find(p => to.path.startsWith(p))
  if (match && !to.query.redirected) {
    next({
      path: `/admin${to.path}`,
      query: { ...to.query, redirected: '1' },
    })
  } else {
    next()
  }
})
```

**Edge case:** If admin paths had query params before redirect, they are preserved. The `redirected=1` flag prevents redirect loops. A user already at `/admin/kds` won't match any legacy path, so no redirect occurs.

### 4.5 CustomerLayout (`src/components/layout/CustomerLayout.vue`)

```
Template structure:
  div.min-h-screen.bg-gray-50
    header (sticky, white bg, border-b)
      Left: brand logo (pi pi-cart-plus + "Cloud Kitchen")
      Center: nav links (Menu, My Orders) — hidden on mobile
      Right: 
        Cart badge (button with pi pi-shopping-cart + item count badge)
        Mobile menu toggle (pi pi-bars)
    main
      router-view
    CartPanel (slideover, positioned fixed right side)
    Toast (from PrimeVue)

Props: none (uses composables internally)

Behaviors:
  - Cart badge shows count from useCart().itemCount
  - Clicking cart badge toggles CartPanel visibility
  - CartPanel is a slideover that pushes content left on desktop, overlays on mobile
  - Nav link active states use router-link-active
  - Responsive: hamburger menu on mobile (<768px) with slideover nav drawer
```

### 4.6 Composables

#### 4.6.1 `useCustomerSession.ts`

```typescript
// Singleton pattern — session ID is generated once and shared app-wide.
// Falls back to a random hex string if crypto.randomUUID() is unavailable.

export function useCustomerSession(): {
  sessionId: Ref<string>
}

// Storage key: 'customer_session_id'
// On first call:
//   1. Check localStorage for existing ID
//   2. If found, return it
//   3. If not, generate via crypto.randomUUID(), store in localStorage, return it
// Returns a ref<string> (reactive)
// Session ID persists across tabs (same localStorage)
```

#### 4.6.2 `useCart.ts`

```typescript
export function useCart(): {
  items: Ref<CartItem[]>
  itemCount: ComputedRef<number>
  totalAmount: ComputedRef<number>
  addItem(item: CartItem): void
  removeItem(menuItemId: string): void
  updateQuantity(menuItemId: string, quantity: number): void
  clearCart(): void
}

// Storage key: 'customer_cart'
// Serialization: JSON.stringify(CartState)
//
// On init:
//   1. Read and parse localStorage['customer_cart']
//   2. If valid CartState, hydrate items ref
//   3. If parse fails or missing, start with empty array
//
// Watch:
//   deep watch on items.value
//   on change: serialize to localStorage
//   debounced at 300ms to avoid excessive writes
//
// addItem logic:
//   - If item already exists (same menuItemId): increment quantity
//   - If new: push to array
//
// updateQuantity logic:
//   - If quantity <= 0: removeItem
//   - Otherwise: update
//
// Edge cases:
//   - localStorage full (QuotaExceededError): silently fail, cart still works in memory
//   - Corrupted localStorage data: catch parse error, reset to empty
//   - Multiple tabs: each tab has independent in-memory state (acceptable for MVP)
```

#### 4.6.3 `useCustomerOrderFeed.ts`

```typescript
export function useCustomerOrderFeed(sessionId: Ref<string>): void

// Listens for 'order:update' from WebSocket.
// For each event:
//   1. Check if payload.customerSessionId === sessionId.value
//   2. If match: patch query cache at ['orders', 'customer', sessionId.value]
//   3. Also patch individual order cache at ['order', 'detail', payload.id]
//   4. If payload.customerSessionId is undefined or doesn't match: ignore
//
// Cleanup: socket.off on unmounted
//
// This is a "fire-and-forget" composable — no return value.
// It simply keeps the query cache in sync.
```

#### 4.6.4 `useCustomerOrders.ts`

```typescript
export function useCustomerOrders(sessionId: Ref<string>) {
  // useQuery({
  //   queryKey: ['orders', 'customer', sessionId],
  //   queryFn: () => api.orders.list({ customerSessionId: sessionId.value }),
  //   enabled: () => !!sessionId.value,
  //   refetchOnWindowFocus: false,
  // })
  // 
  // + useCustomerOrderFeed(sessionId) for real-time patching
  //
  // Returns: { data, isLoading, isError, error, refetch }
}
```

#### 4.6.5 `usePlaceOrder.ts`

```typescript
export function usePlaceOrder() {
  // Returns: { mutate, mutateAsync, isPending }

  // Mutation flow:
  //   1. Fetch max orderNumber: api.orders.list({ _sort: 'orderNumber', _order: 'desc', _limit: 1 })
  //   2. Compute new orderNumber = (max || 2000) + 1
  //   3. Compute totalAmount from cart items
  //   4. Determine brandId from most-frequent brand in cart items (or first)
  //   5. POST /orders with GuestOrderPayload
  //   6. On success: clearCart(), invalidate ['orders', 'customer', sessionId]
  //   7. On error: show toast
  //
  // useMutation with mutationFn that takes no args (reads from cart directly)
}
```

#### 4.6.6 `useModifyOrder.ts`

```typescript
export function useModifyOrder() {
  // cancelOrder: useMutation
  //   mutationFn: (orderId: string) => api.orders.update(orderId, { status: 'cancelled' })
  //   onSuccess: invalidate customer query keys, show snackbar
  //
  // updateItems: useMutation
  //   mutationFn: ({ orderId, items }: { orderId: string; items: OrderItem[] }) =>
  //     api.orders.update(orderId, { items, totalAmount: recalculate(items) })
  //   onSuccess: invalidate customer query keys, show snackbar
  //
  // Conditions:
  //   - Cancellation only allowed if status === 'pending'
  //   - Item modification only allowed if status === 'pending'
  //   - Button disabled states reflect these conditions
}
```

### 4.7 Views

#### 4.7.1 `MenuBrowser.vue`

```
Route: /
States: loading, error, empty (no active menu items), success

Layout:
  Hero section (optional): "Order Now" heading
  Filter bar:
    Brand chips (fetch brands on mount, "All" + each brand)
    Category chips (derived from menu items: "All" + unique categories)
    Active filter highlight

  Menu grid:
    2 columns on mobile, 3 on tablet, 4 on desktop
    Each card shows:
      Item name
      Brand name (small, with brand color dot)
      Price
      Quantity selector (+/- buttons with input)
      "Add to Cart" button (or "Added" state with checkmark)
    On add: brief visual feedback (button flashes, cart badge animates)

  Cart badge in CustomerLayout header shows count
```

#### 4.7.2 `CartPanel.vue`

```
Route: Not a route — rendered as slideover overlay in CustomerLayout.

Props:
  visible: boolean (v-model)

Template:
  Transition (slide from right)
  Fixed overlay panel
    Header: "Your Cart" + close button (X)
    Body:
      If empty:
        Icon (pi pi-shopping-cart), "Your cart is empty", link to browse menu
      If has items:
        Scrollable list of CartItemRow components
          Item name, brand
          Quantity controls (-, count, +)
          Unit price, line total
          Remove button (trash icon)
        Divider
        Subtotal, delivery/info text
    Footer:
      Total amount (bold, large)
      "Checkout" button (primary, full-width)
      
Behaviors:
  - Close on backdrop click
  - Close on Escape key
  - Close on navigation to checkout
  - Animate count badge in header when item added
```

#### 4.7.3 `CheckoutPage.vue`

```
Route: /checkout
Guard: Redirect to / if cart is empty (beforeEnter or onMounted check)

Template:
  Page title: "Review Your Order"
  
  Order summary card:
    For each item: name, brand, qty, unit price, line total
    Divider
    Total amount

  Customer info card:
    InputField: "Your Name" (optional, v-model.trim, placeholder "Guest")
    Textarea: "Special Instructions" (optional)
  
  Action bar (sticky bottom on mobile):
    "Place Order" button (primary, large, loading state)
    or Back button (secondary)

Behaviors:
  - On mount: verify cart has items, if empty → redirect to /
  - Submit: call usePlaceOrder().mutateAsync()
  - On success: clearCart(), redirect to /orders/:newOrderId
  - On error: snackbar error, button re-enabled
  - Loading: button shows spinner, disabled
```

#### 4.7.4 `OrderHistory.vue`

```
Route: /orders
States: loading, error, empty, success

Template:
  Page title: "My Orders"
  
  Loading: 3 skeleton cards (same shape as OrderCardCompact)
  
  Error: icon + message + Retry button
  
  Empty: 
    Icon (pi pi-receipt)
    "No orders yet"
    "Browse our menu and place your first order!"
    Button: "Browse Menu" → navigates to /
  
  Orders list:
    Cards sorted by timestamps.placedAt descending
    Each card shows:
      Order #number
      Status badge (colored)
      Item count summary ("3 items")
      Total amount
      Placed time (relative)
    Click navigates to /orders/:id
  
  Real-time: useCustomerOrderFeed patches cache; cards update in place
```

#### 4.7.5 `OrderDetail.vue`

```
Route: /orders/:id
States: loading, error, not-found, success

Template:
  Back button → /orders

  Order header card:
    Order #number
    Status badge (large, colored)
    Placed time
    Customer name

  Items card:
    Table/list of items
    Name, qty, unit price, line total
    Special instructions shown as badge/note
  
  Total: bold, right-aligned

  Status Timeline card:
    StatusTimeline component (reused from order-status module)
    Shows: Order Placed → Preparing → Ready for Pickup → Dispatched
  
  Actions card (only when status === 'pending'):
    "Modify Items" button → opens inline edit mode or modal
    "Cancel Order" button → confirmation dialog → PATCH status='cancelled'
  
  "Modify Items" inline edit:
    Table becomes editable
    Quantity +/- buttons per item
    Remove item button (with confirmation)
    Add item button → opens menu item picker modal
    "Save Changes" button → PATCH order
    "Discard" button → revert

  Loading: skeleton blocks
  Error: Retry button
  Not found: 404-style message

  Real-time: useCustomerOrderFeed patches this order's cache
```

### 4.8 Navigation & Link Updates

#### AppDrawer.vue (admin sidebar)
All nav paths updated to `/admin/...`:
```
/kds        → /admin/kds
/inventory  → /admin/inventory
/menu       → /admin/menu
/analytics  → /admin/analytics
```

#### AppHeader.vue (mobile admin header)
Same path updates as AppDrawer.

#### PublicLayout.vue (existing customer header)
- `/track` link remains unchanged
- `/portal` link updated to point to `/orders` (or removed in favor of new CustomerLayout)

Actually, PublicLayout is still used for `/track`. We keep it as-is. The new CustomerLayout replaces it for the root customer portal. PublicLayout still works for the `/track` route.

---

## 5. Data Flow Diagrams

### 5.1 Guest Checkout Flow

```
[MenuBrowser]      [CartPanel]        [CheckoutPage]        [server.js]         [OrderDetail]
     |                  |                   |                    |                    |
     |-- addItem() -->  |                   |                    |                    |
     |                  |-- checkout ---->  |                    |                    |
     |                  |                   |-- POST /orders -->|                    |
     |                  |                   |                    |-- save to db.json |
     |                  |                   |                    |-- io.emit() ----->|
     |                  |                   |<-- 201 + order ---|                    |
     |                  |<-- clearCart() --|                    |                    |
     |                  |                   |-- redirect --------------------------->|
     |                  |                   |                    |                    |
     |                  |                   |                    |   [Real-time updates]
```

### 5.2 WebSocket Cache Patching

```
[server.js]                  [useOrderFeed - admin]          [useCustomerOrderFeed]
     |                              |                                |
     |-- io.emit('order:update') -->|                                |
     |   { id, status,             |                                |
     |     customerSessionId }      |                                |
     |                              |-- patch ['orders']            |
     |                              |   (ignores customerSessionId) |
     |                              |                                |
     |                              |        OR                      |
     |                              |                                |
     |-------------------------------------------------------------->|
     |                                                  |-- filter by sessionId match |
     |                                                  |-- patch ['orders','customer',sessionId] |
     |                                                  |-- patch ['order','detail',id] |
```

### 5.3 Legacy Redirect Guard

```
User navigates to /kds
  → beforeEach fires
  → Matches LEGACY_ADMIN_PATHS
  → query.redirected is undefined
  → Redirect to /admin/kds?redirected=1
  
User navigates to /admin/kds
  → beforeEach fires
  → No match in LEGACY_ADMIN_PATHS (starts with /admin)
  → next() — no redirect
  
User navigates to /admin/kds?redirected=1 (from redirect above)
  → No match in LEGACY_ADMIN_PATHS
  → next() — no redirect, loop prevented
```

---

## 6. Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Cart empty on checkout | `beforeEnter` guard redirects to `/`; page also checks `onMounted` |
| Order number collision | Unlikely with single-user json-server; `_sort&_limit=1` + increment is deterministic |
| `crypto.randomUUID()` unavailable | Fallback to `'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ...)` |
| localStorage full (cart/session) | Catch `QuotaExceededError`, cart works in memory, session falls back to runtime ID |
| Corrupted localStorage data | Try/catch on JSON.parse, reset to defaults if invalid |
| Multiple tabs | Each tab has independent cart in memory; sessionId is shared (same localStorage key) |
| WebSocket disconnect | Socket.IO auto-reconnects; `useCustomerOrderFeed` re-attaches listener on reconnect via `socket.on` |
| Order modification after status change | Buttons disabled unless `status === 'pending'`; server doesn't enforce — client-side guard only |
| Pending order goes to preparing while user is modifying | WebSocket patches cache, status changes underneath — UI reverts to read-only on next tick |
| Navigate away during checkout mutation | Mutation completes in background; on success, invalidate queries will update stale cache |
| Admin hits `/portal` | Redirects to `/orders` (customer page) — no admin guard exists; acceptable for MVP |
| Legacy `/portal` with bookmarks | Works — redirects to `/orders` |
| Legacy `/track` | Unchanged — fully functional at original path |

---

## 7. Verification Questions

### Q1: Are admin query cache and customer query cache truly disjoint?
**Answer:** Yes. Admin `useOrderFeed` patches `['orders']`. Customer `useCustomerOrderFeed` patches `['orders', 'customer', sessionId]`. The `useQueryClient.setQueryData` calls target exact keys — no overlap. The only shared resource is the `socket.io` connection itself, which is a singleton managed by `useSocket`.

### Q2: Can the redirect guard loop?
**Answer:** No. Three protections:
1. Guard only fires for paths starting with `/kds`, `/inventory`, `/menu`, `/analytics` — not `/admin/*`.
2. After redirect, the target path is `/admin/kds?redirected=1` which does not match the legacy patterns.
3. Even if somehow triggered again, the `redirected=1` flag short-circuits.

### Q3: What happens if a user's localStorage is cleared mid-session?
**Answer:**
- **Session ID:** Generated fresh on next composable init. Previous orders remain in json-server (keyed by old UUID) and become orphaned — they can't be retrieved under the new session. Acceptable for MVP.
- **Cart:** Lost. User sees empty cart. No data loss beyond the cart.

### Q4: How does the customer retrieve orders placed under a UUID session?
**Answer:** On the `/orders` page, `useCustomerOrders` fires a query:
```typescript
queryFn: () => api.orders.list({ customerSessionId: sessionId.value })
```
json-server translates this to `GET /orders?customerSessionId=<uuid>`, returning all orders for that session. If the user clears localStorage, they lose access to those orders (since the UUID changes). A future enhancement could add phone-based lookup as a fallback.

### Q5: What prevents a user from cancelling an order that's already being prepared?
**Answer:** The `OrderDetail` view checks `order.status === 'pending'` before rendering the "Cancel Order" and "Modify Items" buttons. If the status changes (via WebSocket push) while the user is viewing the page, the reactive `order` ref updates and buttons disappear. No server-side enforcement exists in json-server, but the client is fully protected.

---

## 8. Changes from Original Proposal

| Aspect | Original Proposal | Implemented Solution | Rationale |
|--------|-------------------|---------------------|-----------|
| Module name | `customer-order` | `customer` | Align with existing module naming convention (`kds`, `inventory`, `menu`) |
| Composable granularity | Single `useCart` + `useCustomerOrderFeed` | Six composables: `useCustomerSession`, `useCart`, `useCustomerOrderFeed`, `useCustomerOrders`, `usePlaceOrder`, `useModifyOrder` | Separation of concerns; each composable has a single responsibility |
| Cart data structure | `Map<menuItemId, CartItem>` | `CartItem[]` with additive semantics | Simpler JSON serialization for localStorage; no need for Map polyfill |
| Order number generation | Not specified | `GET /orders?_sort=orderNumber&_order=desc&_limit=1` + increment | Deterministic, no server-side changes needed |
| Query key for customer orders | `['orders', 'customer', sessionId]` | Same | Unchanged — confirmed correct in review |
| `CustomerLayout` | "Derived from PublicLayout" | New standalone `CustomerLayout.vue` with cart badge, slideover, responsive nav | PublicLayout has `/track`/`/portal` nav which is wrong for root; cleaner separation |
| Legacy `/portal` | Redirect to `/admin/portal`? (not specified) | Redirect to `/orders` | `/portal` was customer-facing; redirect to new customer order history |
| Modification of pending orders | Implied by "modify pending orders" | `useModifyOrder` with inline edit mode on OrderDetail | Concrete UX: quantity +/- per item, remove, add-item picker, Save/Discard |
| Cancel action | `api.orders.delete(id)` | `api.orders.update(id, { status: 'cancelled' })` | Soft-delete preserves order history; DELETE would remove from json-server entirely |
| WebSocket payload | Not specified to include `customerSessionId` | Server modified to broadcast `customerSessionId` | Required for client-side filtering in `useCustomerOrderFeed` |
