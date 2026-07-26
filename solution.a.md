# Solution A — Minimal Viable Portal: Full Implementation Plan

## 1. Proposal Deep-Dive

### Core Approach

Route `/` becomes the customer portal. Admin routes (KDS, Inventory, Menu, Analytics) move under `/admin/*`. A new `src/modules/customer/` module contains all customer-facing views and composables. Zero changes to existing module views or server code.

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| `/admin` prefix | Leaves room for future admin sub-modules (users, settings) |
| localStorage cart | Ephemeral UX state; no server cart endpoint exists |
| Extend `api.orders` | json-server PATCH supports partial body — no server changes |
| Phone-based identity | Reuses `db.json` `customers` resource and existing patterns |
| Client-side WS filtering | Existing `order:update` events carry `customerId`; no server changes |

### Gaps Identified from Judge Feedback

1. **Phone gate friction** — First-time visitors forced to enter phone before ordering
2. **Guest WS blind spot** — Guests without `customerId` get no real-time updates
3. **Route conflict risk** — `/track` and `/portal` exist under `PublicLayout`; RedirectShim may conflict
4. **Cart/order boundary** — Modifying pending orders vs. creating new ones need clear separation
5. **Admin backward compat** — No testing strategy for old `/kds`, `/inventory` etc. redirects
6. **Scope creep** — Payments, email, user accounts must be explicitly excluded
7. **Order number generation** — Server auto-assigns IDs but `orderNumber` needs sequence logic
8. **Loading/error states** — Proposal mentions none
9. **Menu item descriptions** — Proposal accepts name+price only but can show `category` + brand

---

## 2. Judge Feedback — Specific Changes

| Concern | Solution |
|---------|----------|
| **Phone gate friction** | Offer **Guest Checkout**: customer can place an order without phone. A temporary `customerId` of `0` is used. These orders use `source: "direct"` and show "Guest" as name. Real-time updates are not available for guest orders — a banner explains this. Returning customers can enter phone to see full order history with live updates. |
| **Guest WS blind spot** | `useCustomerOrders` shows a banner: *"Enter your phone number to get live order updates"* when `customerId` is 0/null. The composable gracefully handles missing `customerId` by skipping socket listener registration. |
| **Route conflict risk** | Existing `/track` and `/portal` routes are removed. Their functionality is absorbed into the customer portal: `/orders/track` (track by order number) and `/orders/history` (phone-based history). A **migration test checklist** verifies old routes redirect correctly. |
| **Cart/order boundary** | `useCustomerCart()` is **cart-only** (new orders). `useCustomerOrders()` handles **existing order operations** (view, modify, cancel). They are separate composables that do not share state. Modifying a pending order calls `api.orders.update()` directly — it does not go through the cart. |
| **Admin backward compat** | `RedirectShim.vue` is tested by navigating to all legacy paths (`/kds`, `/inventory`, `/menu`, `/analytics`, `/inventory/adjust`, `/menu/recipes`) and asserting redirect to `/admin/...`. A `console.warn` is emitted. |
| **Scope creep (exclusions)** | Explicitly scoped out: payments, email auth, user registration, loyalty points, delivery tracking, multi-currency, image upload. |
| **Order number generation** | Client generates `orderNumber` on create: `Date.now() % 100000` + random suffix. This is unique enough for v1 and avoids server query. |
| **Loading/error states** | Every view implements: skeleton loading (matching existing `skeleton` shortcuts), error state with retry button, empty state with helpful message. |
| **Menu item descriptions** | Menu cards display `name`, `price`, `category` badge, and `brandName`. No images needed for v1. |

---

## 3. Implementation Decomposition

### Dependency Graph

```
Phase 1: Foundation (no dependencies)
  ├── 1a. Router restructure (src/router/index.ts)
  ├── 1b. RedirectShim.vue
  └── 1c. API extensions (api/client.ts + types/api.ts)

Phase 2: Composables (depends on Phase 1)
  ├── 2a. useCustomerSession.ts
  ├── 2b. useCustomerCart.ts
  └── 2c. useCustomerOrders.ts (customer-specific, NOT order-status one)

Phase 3: Layout & Components (depends on Phase 2)
  ├── 3a. CustomerLayout.vue
  ├── 3b. MenuGrid.vue
  └── 3c. CartDrawer.vue

Phase 4: Views (depends on Phase 3)
  ├── 4a. MenuBrowse.vue (home page)
  ├── 4b. OrderCheckout.vue
  ├── 4c. OrderHistory.vue
  ├── 4d. MyOrderDetail.vue
  ├── 4e. OrderTrackByNumber.vue
  └── 4f. GuestCheckoutBanner.vue

Phase 5: Admin updates (depends on Phase 1)
  ├── 5a. AppDrawer.vue nav links → /admin/...
  └── 5b. AppHeader.vue nav links → /admin/...

Phase 6: Verification
  ├── 6a. Admin backward-compat test list
  └── 6b. Router test checklist
```

### File Inventory

**New files (18):**
```
src/modules/customer/
├── composables/
│   ├── useCustomerSession.ts
│   ├── useCustomerCart.ts
│   └── useCustomerOrders.ts
├── components/
│   ├── CustomerLayout.vue
│   ├── MenuGrid.vue
│   ├── CartDrawer.vue
│   └── GuestCheckoutBanner.vue
└── views/
    ├── MenuBrowse.vue
    ├── OrderCheckout.vue
    ├── OrderHistory.vue
    ├── MyOrderDetail.vue
    └── OrderTrackByNumber.vue
src/components/layout/RedirectShim.vue
```

**Modified files (5):**
```
src/router/index.ts
src/api/client.ts
src/types/api.ts
src/components/layout/AppDrawer.vue
src/components/layout/AppHeader.vue
```

**Removed routes (2):**
```
/track   → replaced by /orders/track
/portal  → replaced by /orders/history
```

**Explicitly not modified:**
```
server.js, db.json, any module views or composables, plugins, styles
```

---

## 4. Detailed Implementation

### 4a. Router Restructure — `src/router/index.ts`

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import CustomerLayout from '@/modules/customer/components/CustomerLayout.vue'
import RedirectShim from '@/components/layout/RedirectShim.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ── Customer portal at root ────────────────────
    {
      path: '/',
      component: CustomerLayout,
      children: [
        {
          path: '',
          name: 'customer.menu',
          component: () => import('@/modules/customer/views/MenuBrowse.vue'),
        },
        {
          path: 'checkout',
          name: 'customer.checkout',
          component: () => import('@/modules/customer/views/OrderCheckout.vue'),
        },
        {
          path: 'orders/history',
          name: 'customer.orders',
          component: () => import('@/modules/customer/views/OrderHistory.vue'),
        },
        {
          path: 'orders/:id',
          name: 'customer.order-detail',
          component: () => import('@/modules/customer/views/MyOrderDetail.vue'),
        },
        {
          path: 'orders/track',
          name: 'customer.track',
          component: () => import('@/modules/customer/views/OrderTrackByNumber.vue'),
        },
      ],
    },

    // ── Admin routes under /admin ──────────────────
    {
      path: '/admin',
      component: AppLayout,
      redirect: '/admin/kds',
      children: [
        {
          path: 'kds',
          name: 'admin.kds',
          component: () => import('@/modules/kds/views/OrderDashboard.vue'),
        },
        {
          path: 'inventory',
          name: 'admin.inventory',
          component: () => import('@/modules/inventory/views/InventoryList.vue'),
        },
        {
          path: 'inventory/adjust',
          name: 'admin.inventory.adjust',
          component: () => import('@/modules/inventory/views/StockAdjustment.vue'),
        },
        {
          path: 'menu',
          name: 'admin.menu',
          component: () => import('@/modules/menu/views/MenuList.vue'),
        },
        {
          path: 'menu/recipes',
          name: 'admin.menu.recipes',
          component: () => import('@/modules/menu/views/RecipeBuilder.vue'),
        },
        {
          path: 'analytics',
          name: 'admin.analytics',
          component: () => import('@/modules/analytics/views/AnalyticsDashboard.vue'),
        },
      ],
    },

    // ── Legacy redirect shims ──────────────────────
    {
      path: '/kds',
      component: RedirectShim,
      redirect: () => {
        console.warn('[Router] /kds is deprecated. Use /admin/kds.')
        return '/admin/kds'
      },
    },
    {
      path: '/inventory',
      component: RedirectShim,
      redirect: () => {
        console.warn('[Router] /inventory is deprecated. Use /admin/inventory.')
        return '/admin/inventory'
      },
    },
    {
      path: '/inventory/adjust',
      component: RedirectShim,
      redirect: () => {
        console.warn('[Router] /inventory/adjust is deprecated. Use /admin/inventory/adjust.')
        return '/admin/inventory/adjust'
      },
    },
    {
      path: '/menu',
      component: RedirectShim,
      redirect: () => {
        console.warn('[Router] /menu is deprecated. Use /admin/menu.')
        return '/admin/menu'
      },
    },
    {
      path: '/menu/recipes',
      component: RedirectShim,
      redirect: () => {
        console.warn('[Router] /menu/recipes is deprecated. Use /admin/menu/recipes.')
        return '/admin/menu/recipes'
      },
    },
    {
      path: '/analytics',
      component: RedirectShim,
      redirect: () => {
        console.warn('[Router] /analytics is deprecated. Use /admin/analytics.')
        return '/admin/analytics'
      },
    },
  ],
})

export default router
```

### 4b. RedirectShim.vue — `src/components/layout/RedirectShim.vue`

A minimal component that never renders. It exists solely because `vue-router` requires a component for routes that use `redirect` as a function (when the redirect depends on route state). Alternative: all redirects can use string paths, but function redirects allow the console warning.

```vue
<template>
  <div />
</template>
<script setup lang="ts">
// RedirectShim — never rendered; exists to satisfy vue-router redirect function requirement
</script>
```

**Edge case:** If a user manually types `/kds` while already on the customer portal, `RedirectShim` fires the `redirect` function, which navigates to `/admin/kds`. The shim component renders an empty div for the split-second before the navigation completes.

### 4c. API Extensions

**`src/types/api.ts`** — Add to `orders`:
```typescript
orders: {
  // ... existing: list, get, create, updateStatus
  update: (id: string, data: Partial<Order>) => Promise<Order>
}
```

**`src/api/client.ts`** — Add:
```typescript
// After updateStatus:
update: (id, data) => http.patch(`/orders/${id}`, data).then((r) => r.data),
```

### 4d. `useCustomerSession.ts`

Manages customer identity with guest fallback.

```
State (localStorage under key 'customer_session'):
  customerId: number | null   // null = guest
  phone: string | null
  name: string | null

Behavior:
  - On first visit: customerId = null (guest mode)
  - login(phone): queries api.customers.list({ phone })
    - If found: sets customerId, phone, name from returned customer
    - If not found: creates via api.customers.list({ phone, name }) and sets
    - Stores to localStorage
  - logout(): clears session, sets customerId = null
  - isGuest: computed, true when customerId is null or 0

Guest checkout flow:
  - Skip login screen entirely
  - When placing order, use customerId = null
  - Order is created with source: 'direct', customerName: 'Guest'
  - Server auto-assigns orderNumber
  - Show success screen with order number for manual tracking

Edge cases:
  - localStorage corrupted → treat as guest, clear bad data
  - Tab sync: not handled in v1 (acceptable per proposal trade-offs)
```

**File:** `src/modules/customer/composables/useCustomerSession.ts`

### 4e. `useCustomerCart.ts`

```
State (localStorage key 'customer_cart'):
  Map<menuItemId, { item: MenuItem, quantity: number }>

Serialization:
  - Serialize as array for JSON (Map → [{menuItemId, item, quantity}])
  - Deserialize back to Map on init
  - Auto-save to localStorage on every mutation

Operations:
  - addItem(item): adds with qty 1 or increments if exists
  - removeItem(menuItemId): removes entry
  - updateQuantity(menuItemId, qty): sets quantity (removes if qty <= 0)
  - clear(): empties cart
  - items: computed → Array<{ item, quantity }>
  - totalItems: computed → sum of quantities
  - totalAmount: computed → sum of item.price * quantity
  - hasItems: computed → totalItems > 0

Order submission (submitOrder):
  - Reads current cart
  - Builds OrderItem[] from cart items
  - Calls api.orders.create(data) where data = {
      orderNumber: generateOrderNumber(),
      source: 'direct',
      customerName: session.name || 'Guest',
      customerId: session.customerId || undefined,
      phone: session.phone ? Number(session.phone) : undefined,
      items: [...],
      totalAmount: computed total,
      status: 'pending',
      brandId: (first item's brandId) || 'brand-01',
      timestamps: { placedAt: now, ... },
      prepTimeTarget: 15,
    }
  - On success: clear cart, return created order
  - On error: throw (caller shows error toast)

Order number generation:
  function generateOrderNumber(): number {
    const ts = Date.now() % 100000
    const rand = Math.floor(Math.random() * 9000) + 1000
    return ts + rand  // e.g., 47382154 — unique enough for v1
  }

Edge cases:
  - Empty cart → submitOrder throws 'Cart is empty'
  - Menu item becomes inactive after adding to cart → show "(unavailable)" badge in cart
```

**File:** `src/modules/customer/composables/useCustomerCart.ts`

### 4f. `useCustomerOrders.ts` (Customer-specific)

This is **separate** from the existing `src/modules/order-status/composables/useCustomerOrders.ts`. The existing one is used by `/portal` and `/track` (which are being removed). This new one lives in the customer module and handles:

```
Features:
  - listOrders(customerId): api.orders.list({ customerId })
  - getOrder(id): api.orders.get(id)
  - modifyOrder(id, items): api.orders.update(id, { items, totalAmount: recalculated })
    - Only allowed when order.status === 'pending'
    - Recalculates totalAmount from items
  - cancelOrder(id): api.orders.updateStatus(id, 'cancelled')
    - Only allowed when order.status === 'pending'
  - trackByOrderNumber(orderNumber): api.orders.list({ orderNumber })

Real-time:
  - Uses useSocket() directly
  - Listens to 'order:update' events
  - Filters by this.customerId
  - On event: invalidates query cache for this customer's orders
  - If customerId is null (guest): skips socket registration entirely

  // Uses @tanstack/vue-query useMutation for modify/cancel
  // Uses useQuery for list and get
```

**File:** `src/modules/customer/composables/useCustomerOrders.ts`

### 4g. `CustomerLayout.vue`

```
Layout structure:
  ┌────────────────────────────────────────────┐
  │  Header: Logo | Nav: Menu | My Orders |    │
  │          Track Order | (Phone/Guest badge)  │
  ├────────────────────────────────────────────┤
  │                                            │
  │          <router-view />                   │
  │                                            │
  ├────────────────────────────────────────────┤
  │  Floating Cart Button (bottom-right)       │
  │  → Opens CartDrawer overlay                │
  └────────────────────────────────────────────┘

Header nav links:
  - "/" (Menu)
  - "/orders/history" (My Orders)
  - "/orders/track" (Track Order)

Right side of header:
  - If guest: "Guest" badge + "Login" button
  - If logged in: phone display + "Logout" button

Cart button:
  - Fixed position bottom-right
  - Shows badge with totalItems count
  - Toggles CartDrawer slide-over panel
  - Hidden on checkout and order detail pages
```

**PrimeVue components used:** `Button`, `Badge`, `Sidebar` (for cart drawer)

**File:** `src/modules/customer/components/CustomerLayout.vue`

### 4h. `MenuGrid.vue`

Displays menu items grouped by brand, with filter tabs for categories.

```
Props:
  - items: MenuItem[]
  - brands: Brand[]
  - cartQuantities: Record<string, number>  // menuItemId → qty in cart

Layout:
  - Brand filter chips (horizontal scroll)
  - Category filter tabs: All | Mains | Sides
  - Grid of MenuCard items (2-3 columns responsive)

MenuCard:
  ┌─────────────────────┐
  │  [Brand Chip]        │
  │  Item Name           │
  │  $12.99              │
  │  [+ / 1x / +] qty   │
  └─────────────────────┘

  - Add button calls cart.addItem(item)
  - If in cart, show quantity stepper
  - Disabled if item.isActive === false
```

**Edge cases:** Empty menu (show empty state), all items inactive (show "No items available"), brand with no items (hide brand chip).

**File:** `src/modules/customer/components/MenuGrid.vue`

### 4i. `CartDrawer.vue`

Slide-over panel from the right (PrimeVue `Sidebar`).

```
Props/State:
  - visible: boolean
  - cart: useCustomerCart() return value

Content:
  - Header: "Your Order (N items)"
  - List of cart items with:
    - Item name
    - Quantity stepper (minus / count / plus)
    - Unit price × quantity
    - Remove button (trash icon)
  - If item is inactive: "(unavailable)" label, disabled stepper
  - Empty state: "Your cart is empty. Browse the menu to add items."
  - Footer:
    - Subtotal: $XX.XX
    - "Checkout" button → router.push('/checkout')
    - "Continue Browsing" link
```

**File:** `src/modules/customer/components/CartDrawer.vue`

### 4j. `GuestCheckoutBanner.vue`

```
Props: none (reads from useCustomerSession)

Variants:
  - Guest mode active:
    "You're ordering as a Guest. [Enter phone number] to save your order history
     and get live updates."
    Input + button to enter phone → calls session.login(phone)
  - Logged in:
    "Logged in as {name} ({phone}). [Logout]"
```

**File:** `src/modules/customer/components/GuestCheckoutBanner.vue`

### 4k. `MenuBrowse.vue` — Home page (route `/`)

```
Template:
  - Hero section (optional): "Order from our Cloud Kitchens"
  - GuestCheckoutBanner (if guest)
  - MenuGrid with fetched menu items

Data:
  - useQuery(['menuItems'], () => api.menu.items.list())
  - useQuery(['brands'], () => api.menu.brands.list())
  - useCustomerCart()
  - useCustomerSession()

States:
  - Loading: skeleton grid (6 skeleton cards)
  - Error: "Failed to load menu" + retry button
  - Empty: "Menu is empty" (shouldn't happen with seed data)
  - Success: MenuGrid
```

**File:** `src/modules/customer/views/MenuBrowse.vue`

### 4l. `OrderCheckout.vue` (route `/checkout`)

```
Template:
  - Order summary (read-only list of cart items)
  - Name input (prefilled from session.name, editable)
  - Phone input (prefilled from session.phone, editable) [optional for guest]
  - Special instructions per item (expandable textarea)
  - Subtotal, total display
  - "Place Order" button
  - "Back to Menu" link

Flow:
  1. Read cart from useCustomerCart
  2. If cart empty → redirect to '/' with warning toast
  3. User fills/adjusts name, phone
  4. "Place Order" → calls cart.submitOrder()
  5. On success → clear cart, router.push('/orders/' + order.id)
  6. On error → show error toast, stay on page

Edge cases:
  - Empty cart: redirect to '/', snackbar "Your cart is empty"
  - Network error: show retry, keep form data
  - Items became inactive between browse and checkout: show warning, allow removal
```

**File:** `src/modules/customer/views/OrderCheckout.vue`

### 4m. `OrderHistory.vue` (route `/orders/history`)

```
Template:
  - GuestCheckoutBanner
  - If guest: prompt to enter phone to see orders
  - If logged in:
    - List of orders (most recent first)
    - Each order card shows: orderNumber, status, totalAmount, item count, time ago
    - Click → router.push('/orders/' + order.id)
  - Empty state: "No orders yet. [Browse Menu]"

Data:
  - useQuery(['customerOrders', customerId], ...) via useCustomerOrders
  - Real-time updates via socket (if customerId exists)

States:
  - Loading: skeleton list
  - Error: "Failed to load orders" + retry
  - Guest + no input: prompt screen
```

**File:** `src/modules/customer/views/OrderHistory.vue`

### 4n. `MyOrderDetail.vue` (route `/orders/:id`)

```
Template:
  - Order header: Order #number, status badge, placed time
  - Items list with quantities and prices
  - Total
  - Status timeline (reuse StatusTimeline from order-status module)
  - If status === 'pending':
    - "Modify Order" button → opens modify mode
    - "Cancel Order" button → confirmation dialog → api cancel
  - If status !== 'pending':
    - Read-only view with timeline

Modify Mode:
  - Opens inline editing of items (same as cart item steppers)
  - "Save Changes" button → api.orders.update(id, { items, totalAmount })
  - "Cancel" → exit modify mode without saving
  - Only available if status === 'pending'

Real-time:
  - Listens to 'order:update' for this specific order ID
  - Updates status badge and timeline reactively

Edge cases:
  - Order not found: "Order not found" message
  - Cancel already-cancelled order: show "Order already cancelled"
  - Network error on modify: revert to original items, show error toast
```

**File:** `src/modules/customer/views/MyOrderDetail.vue`

### 4o. `OrderTrackByNumber.vue` (route `/orders/track`)

Replaces the existing `/track` route. Same functionality as the existing `OrderTracking.vue` but integrated into the customer layout.

```
Template:
  - Input field: "Enter order number"
  - "Track" button
  - Result: OrderCardCompact + StatusTimeline
  - Real-time updates via socket (filters by orderNumber)

States:
  - Unsearched: prompt
  - Loading: skeleton
  - Found: order card + timeline
  - Not found: "No order found with that number"
  - Error: error message + retry
```

**File:** `src/modules/customer/views/OrderTrackByNumber.vue`

### 4p. Admin Navigation Updates

**`AppDrawer.vue`** — Change nav paths:
```typescript
const navItems = [
  { path: '/admin/kds', label: 'KDS Dashboard', icon: '<i class="pi pi-receipt"></i>' },
  { path: '/admin/inventory', label: 'Inventory', icon: '<i class="pi pi-box"></i>' },
  { path: '/admin/menu', label: 'Menu & Recipes', icon: '<i class="pi pi-book"></i>' },
  { path: '/admin/analytics', label: 'Analytics', icon: '<i class="pi pi-chart-bar"></i>' },
]
```

Same change in **`AppHeader.vue`**.

**Note:** `isActive(path)` check uses `route.path.startsWith(path)`, which still works because `/admin/kds` starts with `/admin/kds`.

**`PublicLayout.vue`** — The existing `/track` and `/portal` nav links in the header are removed when the `/track` and `/portal` routes are deleted. The `PublicLayout.vue` file is kept (may be used by future public pages) but its nav links should point to the new customer portal routes if needed, or be simplified.

---

## 5. Router Test Checklist (Admin Backward Compatibility)

After deployment, manually verify:

| Old URL | Expected Redirect | Status |
|---------|------------------|--------|
| `/kds` | `/admin/kds` | Console warning emitted |
| `/inventory` | `/admin/inventory` | Console warning emitted |
| `/inventory/adjust` | `/admin/inventory/adjust` | Console warning emitted |
| `/menu` | `/admin/menu` | Console warning emitted |
| `/menu/recipes` | `/admin/menu/recipes` | Console warning emitted |
| `/analytics` | `/admin/analytics` | Console warning emitted |
| `/track` | Returns 404 (route removed) | Show "Page not found" |
| `/portal` | Returns 404 (route removed) | Show "Page not found" |
| `/` | Customer portal menu | Brand header visible |
| `/orders/history` | Order history (or phone prompt) | Guest handling works |
| `/admin/kds` | KDS Dashboard | All 4 columns render |

**Cypress/Playwright test outline (future):**
```typescript
describe('admin backward compatibility', () => {
  const legacyPaths = ['/kds', '/inventory', '/menu', '/analytics']
  legacyPaths.forEach(path => {
    it(`redirects ${path} to /admin${path}`, () => {
      cy.visit(path)
      cy.url().should('include', '/admin' + path)
    })
  })
})
```

---

## 6. Self-Verification

### Q1: Is the router restructure backwards-compatible for admin users who bookmarked old paths?

**Yes.** All 6 legacy admin paths (`/kds`, `/inventory`, `/inventory/adjust`, `/menu`, `/menu/recipes`, `/analytics`) have dedicated route entries with `redirect` functions that emit a console warning and redirect to `/admin/...`. No data loss — the same components load, same query keys, same state.

### Q2: What happens if a guest places an order and then enters their phone later?

The guest's order was created with `customerId: undefined` and `source: 'direct'`. When the customer later enters their phone, `useCustomerSession.login()` queries `api.customers.list({ phone })`. If the phone exists, it retrieves the customer and their orders via `api.orders.list({ customerId })`. However, the guest order will NOT appear because it has no `customerId`. This is a known limitation — orders placed as guest are NOT linkable to a phone number retroactively. The checkout flow addresses this by allowing phone entry **before** placing the order. The `GuestCheckoutBanner` on the home page encourages entering a phone before ordering.

**Mitigation for v2:** Store the generated `orderNumber` in localStorage so guests can at least re-track that specific order via `/orders/track`.

### Q3: Does a pending order modification via the customer portal trigger the same WebSocket event as KDS modifications?

**Yes.** Both use `api.orders.update(id, data)` which sends `PATCH /orders/:id`. The server's `router.render` middleware in `server.js` intercepts all PATCH/POST to `/orders/*` and emits `order:update` with `{ id, status, orderNumber, customerId }`. The KDS `useOrderFeed` receives this and updates its cache. The customer's `useCustomerOrders` also receives it and updates its cache. Both sides stay in sync automatically.

### Q4: What is the test strategy for the RedirectShim?

**Manual verification checklist** (Section 5 above). Automated tests would use Playwright/Cypress to visit each legacy URL and assert that the current URL starts with `/admin/...`. The `console.warn` can be verified by stubbing `console.warn` and asserting it was called with the expected message. These tests are scoped for the "future" column in the checklist — v1 relies on manual verification during deployment.

### Q5: How does the solution handle the "item becomes inactive after being added to cart" edge case?

The cart stores the full `MenuItem` object (including `isActive`). When rendering:
- `CartDrawer.vue` checks `item.isActive` and shows "(unavailable)" label with strikethrough and disabled stepper
- `OrderCheckout.vue` shows a warning banner: "Some items in your order are no longer available. Please remove them before placing the order."
- `useCustomerCart.submitOrder()` filters out inactive items before submission (with a warning)

---

## 7. Changes from Original Proposal

| Aspect | Original Proposal | Final Solution |
|--------|------------------|----------------|
| **Guest checkout** | Phone-only identity | Guest mode with no phone required |
| **Real-time for guests** | Not addressed | Banner explaining limitations; socket registration skipped gracefully |
| **Route migration** | All legacy paths redirected | Individual route entries per legacy path for fine-grained warnings |
| **Existing routes** | `/track` and `/portal` kept | Removed; functionality absorbed into `/orders/track` and `/orders/history` |
| **Order number** | Not addressed | `generateOrderNumber()` composable-side |
| **Loading/error states** | Not addressed | Every view: skeleton, error+retry, empty state |
| **Cart/order separation** | Implicit | Explicit: separate composables, no shared state |
| **Scope exclusions** | Not stated | Explicit list: payments, email, user registration, etc. |
| **Admin nav** | Not addressed | AppDrawer.vue and AppHeader.vue paths updated |
| **Menu display** | "name+price only" | Shows name, price, category badge, brand name |

---

## 8. Explicitly Scoped Out (v1)

These features are deliberately excluded from this implementation:

- Payment processing / checkout payment
- Email-based identity or password auth
- User registration or account creation
- Loyalty points or rewards
- Delivery address management
- Multi-currency support
- Menu item images or descriptions beyond name+price+category
- Drag-and-drop cart reordering
- Tab sync for cart (multi-tab conflicts acceptable)
- Automated test suite (manual checklist provided)
- Order history pagination for large datasets
- Admin user authentication/roles
