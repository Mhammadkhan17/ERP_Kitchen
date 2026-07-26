# Customer-Facing Order Portal — Design Proposals

**Date:** 2026-07-15  
**Context:** Cloud Kitchen ERP (Vue 3 + TypeScript, Vite, PrimeVue, TanStack Vue Query, UnoCSS, Socket.IO)  
**Backend:** json-server (port 3001) proxied via Vite `/api` → `localhost:3001`  
**Codebase base:** `D:\ERP`

---

## Step 1 — Problem Decomposition

### Core Problem
Convert the existing KDS/admin-only SPA into a dual-audience application where:
- `/` → customer-facing menu browsing, cart, order creation/review/cancellation
- `/admin/*` → existing KDS dashboard, inventory, menu management, analytics

### Subproblems Every Solution Must Address

| # | Subproblem | Key Tension |
|---|-----------|-------------|
| A | **Route architecture** — `/` currently redirects to `/kds`. Admin routes exist at root level. How do we split without breaking bookmarks? | Breaking change risk vs clean path separation |
| B | **Layout split** — Admin has sidebar+header (`AppLayout`). Customer needs a clean public layout. Both share `Toast` and global shell. | Component tree nesting vs route-level meta |
| C | **Cart state** — Customer cart must persist across page navigation (refresh, category filter, brand browse). | localStorage resilience vs reactive composable purity |
| D | **Order creation flow** — Menu browse → add to cart → checkout → create order with customer identity | UX flow complexity vs backend simplicity |
| E | **Order mutation** — Modify pending orders (add/remove items, change quantities). The current API only does `updateStatus`. | No existing item-patch endpoint vs simple full-replace PATCH |
| F | **Customer identity** — Simple auth/session to associate orders to a customer. Existing pattern uses phone number lookup. | Frictionless entry vs attribution reliability |
| G | **WebSocket scoping** — Customer only needs updates on *their* orders. Admin needs all orders. | Client-side filtering (wasteful) vs server-side rooms (requires server changes) |
| H | **Admin path migration** — `/kds` → `/admin/kds`, `/inventory` → `/admin/inventory`, etc. | Redirect preservation vs router restructure |
| I | **Backend API gaps** — No `orders.update(id, data)` for item changes, no `source: 'direct'` for portal orders, no auto-increment order numbers. | json-server constraints vs custom server logic |

### Evaluation Criteria
1. **Minimal breakage** — existing admin workflows remain identical  
2. **Pattern consistency** — uses same Composition API, module structure, import style  
3. **Implementation velocity** — fewer server changes = faster  
4. **User experience** — cart persists, real-time works, no full-page reloads  
5. **Testability** — composables separate from views  

---

## Step 2 — Solution Space Map

### Major Decision Axes

```
Route organization   Flat redirect ───────────────────── Nested route groups
Cart strategy        localStorage + reactive ──────────── Server-side resource  
Customer identity    Phone number ────────────────────── Generated session token
Order creation       Single-page checkout ────────────── Multi-step wizard
Order mutation       PATCH entire order ──────────────── Granular item operations  
WebSocket filter     Client-side ─────────────────────── Server-side rooms
Admin migration      Path rewrite in router ──────────── Nginx/Vite proxy layer
Cart persistence     Session only ────────────────────── IndexedDB / PWA cache
```

---

## Step 3 — Six Approaches

---

### Approach 1 — Progressive Enhancement (High-probability)

**Summary:** Minimal delta — add a `customer` module, move admin routes under `/admin` via router nesting + redirects. Cart is a localStorage-backed composable.

**Detailed description:**  
Create `src/modules/customer/` mirroring the existing module structure (views/, composables/, components/). Add `CustomerLayout.vue` (similar to `PublicLayout.vue` but with cart badge, brand filter tabs, and a "My Orders" link). The router gets two top-level groups: `/` (CustomerLayout) with children `''` (menu), `cart`, `orders`, `order/:id`, and `/admin` (AppLayout) with children `kds`, `inventory`, `menu`, `analytics`. Existing `/track` and `/portal` routes keep working at `/admin/track` and `/admin/portal` or remain as-is for backward compat.

Cart lives in `useCart.ts` composable backed by localStorage with a reactive ref. On page load, hydrate from localStorage; on mutation, persist. Order creation calls `api.orders.create(...)` with `source: 'portal'`. Customer is identified by phone number on checkout (reusing existing `customers` resource — look up or create). WebSocket listener in `useCustomerOrders.ts` filters by `payload.customerId`.

Admin migration: the existing `AppDrawer.vue` nav items update paths to `/admin/kds`, `/admin/inventory`, etc. A catch-all redirect from `/kds` → `/admin/kds` preserves old bookmarks.

**Key decisions & rationale:**
- localStorage cart: zero server changes, survives refresh, works offline
- Router nesting with `/admin` parent: single source of truth for admin guard logic
- Phone-based identity: reuses existing `customers` table and `CustomerPortal.vue` pattern
- Full-order PATCH for modification: json-server supports `PATCH /orders/:id` natively

**Trade-offs:**
- (+) Zero server changes beyond what json-server already provides
- (+) All patterns already exist in the codebase (phone lookup, `PublicLayout`, OrderCard)
- (+) Existing `/track` and `/portal` pages can remain functional
- (-) localStorage cart is opaque to server — no cross-device cart
- (-) Admin route redirects add a minor maintenance burden
- (-) Full-order PATCH for modification means sending entire order each time

**Probability:** 0.85  
**Complexity:** Low–Medium (2-3 days)  
**Risks:** Redirect loops if not careful; localStorage race conditions with multiple tabs; `orderNumber` needs auto-generation client-side or via server POST logic

---

### Approach 2 — Feature-Sliced Customer Module (High-probability)

**Summary:** Self-contained `src/modules/customer/` module with dedicated views, composables, and components. Pinia store for cart. Admin routes wrapped under `/admin` via computed route config.

**Detailed description:**  
The customer module is a self-contained feature slice: `views/MenuPage.vue` (brand filter + category tabs + item cards + add-to-cart), `views/CartPage.vue` (line items, quantity steppers, checkout form), `views/OrderHistory.vue` (list of past orders with status), `views/OrderDetail.vue` (single order with timeline + modify/cancel actions). Each view uses its own composable (e.g., `useMenuBrowsing.ts`, `useCustomerCheckout.ts`) following the pattern of `useOrderFlow.ts` and `useOrderFeed.ts`.

Cart is managed via a Pinia store (`src/stores/cart.ts`) — actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`. This makes the cart accessible across any view without prop drilling, and enables a persistent cart badge in the layout header. On checkout, the store's contents are serialized into the order payload.

Admin routes: `router/index.ts` refactors routes into two factory functions — `createAdminRoutes()` and `createCustomerRoutes()` — that return route record arrays. This keeps the router config maintainable as each domain grows.

**Key decisions & rationale:**
- Pinia for cart: the app already has Pinia installed; store is more natural than a composable for cross-view state
- Factory functions for route domains: isolates change, makes testing easier
- Dedicated `useCustomerCheckout.ts`: encapsulates phone lookup, order creation, and address collection

**Trade-offs:**
- (+) Pinia store provides devtools, time-travel debugging, and plugin ecosystem
- (+) Route factory functions make it trivial to add new customer routes
- (+) Fully encapsulated — customer module can be tree-shaken if needed
- (-) Over-engineered for a json-server backend
- (-) Pinia adds boilerplate vs a simple composable
- (-) Phone-based customer lookup during checkout adds latency before order creation

**Probability:** 0.82  
**Complexity:** Medium (3-4 days)  
**Risks:** Pinia store persists in memory only — must manually sync to localStorage for refresh survival; route factory abstraction may confuse new developers

---

### Approach 3 — Domain-Driven Route Restructure (High-probability)

**Summary:** Router split into two explicit domains — `customer` and `admin` — each with dedicated layout, meta guards, and error boundaries. Uses route `meta` fields for domain tagging and redirect middleware.

**Detailed description:**  
Every route record gets a `meta.domain` property: `customer` or `admin`. The router's `beforeEach` guard uses this to enforce layout selection. `App.vue` uses a `<component :is="layoutComponent">` pattern — it reads `route.meta.layout` (resolved by the guard) and dynamically renders `CustomerShell.vue` or `AdminShell.vue`. The shells each contain their own `<router-view />` plus domain-specific global UI (Toast, confirm dialog for admin; cart FAB for customer).

Admin routes move to an unambiguous `/admin` prefix with a `beforeEnter` guard that could later check a real auth token. Existing paths (`/kds`, `/inventory`, etc.) get permanent redirects (301-style) via route records. The customer domain uses `/` for menu, `/menu`, `/cart`, `/orders`, `/order/:id`.

WebSocket subscription is unified in `useOrderFeed.ts` but enhanced with a `domain` parameter: when `domain === 'customer'`, the handler only processes orders matching the current customer ID from localStorage. This avoids adding complexity to the server.

**Key decisions & rationale:**
- `meta.domain` tagging: single source of truth for layout rendering, navigation guards, and analytics
- Dynamic layout component: keeps `App.vue` thin and avoids nested layout kludges
- Unified WebSocket with domain filter: no server changes, client-side filtering is cheap for a small dataset

**Trade-offs:**
- (+) Cleanest separation of concerns for layout/guard logic
- (+) Redirects for old admin paths mean zero bookmark breakage
- (+) Easy to add auth guard later — just check `meta.domain === 'admin'`
- (-) Dynamic layout component adds a rendering indirection that may confuse Vue devtools
- (-) `meta` fields are runtime-only — no compile-time safety
- (-) All WebSocket messages still delivered to all clients, which may not scale

**Probability:** 0.80  
**Complexity:** Medium (3-4 days)  
**Risks:** Dynamic layout component may cause unnecessary re-renders; `meta.domain` must be present on every route or the guard falls back incorrectly

---

### Approach 4 — Server-Backed Cart Resource (Low-probability)

**Summary:** Cart is a first-class server resource (`/carts`). Customers get a `cartId` stored in localStorage on first visit. All cart operations (add, remove, update qty) go through REST. Order creation promotes the cart to an order.

**Detailed description:**  
Add a `carts` resource to `db.json` and an auto-incrementing `cartId` generator in `server.js`. When a customer first visits the portal, the client calls `POST /carts` to create a cart and stores the returned `cartId` in localStorage. All subsequent add/remove/update operations are `PATCH /carts/:cartId` with a `{ items: [...] }` payload, or more granular `POST /carts/:cartId/items`. The checkout flow calls `POST /carts/:cartId/checkout`, which the server handles by: (1) looking up the cart, (2) computing total, (3) creating an order, (4) deleting the cart, (5) broadcasting via Socket.IO. This requires modifying `server.js` with custom route handlers.

On the frontend, `useServerCart.ts` composable wraps these calls using Vue Query mutations with optimistic updates. A background refetch on mount reconciles the cart if the user previously left items in it (across devices if `cartId` is tied to browser fingerprint).

Admin migration: since all existing routes change, use `router.addRoute()` to dynamically register old path redirects. Admin routes are registered under `/admin` at app bootstrap.

**Key decisions & rationale:**
- Server-side cart: enables cross-device cart, push notifications, abandoned cart analytics
- Optimistic updates via Vue Query: instant UI feedback while server confirms
- Custom server handlers: necessary because json-server's default PATCH doesn't support array mutations

**Trade-offs:**
- (+) Cart survives anywhere — clear cache, different device, same account
- (+) Future-ready for analytics (cart abandonment rate, average cart size)
- (+) Server can enforce inventory checks at cart time, not just order time
- (-) Requires `server.js` changes — custom routes, new resource, auto-increment logic
- (-) Much higher network traffic for cart operations (every add/remove is an API call)
- (-) Cart becomes a stateful server resource with all the attendant complexity (orphan carts, expiry, concurrent modification)
- (-) json-server is not designed for this — the custom route layer approaches a real backend

**Probability:** 0.08  
**Complexity:** High (5-6 days)  
**Risks:** json-server's in-memory database means carts vanish on restart; race conditions on concurrent cart edits; abandoned cart cleanup requires a cron-like mechanism json-server doesn't have

---

### Approach 5 — Socket-First Order Management (Low-probability)

**Summary:** Order creation and modification bypass REST entirely — all order mutations go through Socket.IO events. REST is used only for reads (menu, brands, order history). The server listens for events and broadcasts changes.

**Detailed description:**  
The server (`server.js`) gains Socket.IO event listeners: `order:create`, `order:modify`, `order:cancel`. Each handler reads/writes `db.json` directly (using `lowdb` or direct file reads) and broadcasts the updated order. The client's checkout flow emits `order:create` with payload `{ items, customerName, phone, brandId }` and awaits an acknowledgement with the created `order` object. Order modification emits `order:modify` with `{ orderId, items }` and the server replaces items for pending orders only.

On the frontend, `useOrderSocket.ts` composable wraps socket event emission into a Vue Query mutation-like interface: `emitter.emit(...)` with a callback that resolves the mutation promise. Vue Query queries (e.g., `['menuItems']`) remain REST-based for reading.

Admin routes: instead of restructuring the router, use a **layout resolver** component (`RouterShell.vue`) that checks `window.location.pathname.startsWith('/admin')` and renders the appropriate layout. This avoids touching the router config entirely — old admin paths continue to work. New customer routes are added alongside.

**Key decisions & rationale:**
- Socket-first mutations: real-time by default, no polling, instant multi-user updates
- Layout resolver: zero-touch admin migration — no redirects, no route restructuring
- Direct `db.json` writes in server.js: avoids json-server middleware limitations

**Trade-offs:**
- (+) Order creates propagate to KDS instantly via the same socket broadcast
- (+) Layout resolver means existing admin routes literally do not change
- (+) No REST API changes needed for order mutations
- (-) Loses REST's cacheability, idempotency, and HTTP status codes
- (-) Direct file writes in server.js bypass json-server's internal consistency guarantees
- (-) Socket acknowledgements add complexity to the client mutation pattern
- (-) `db.json` file corruption risk under concurrent writes (json-server's `router.db` is single-threaded, but direct writes bypass it)

**Probability:** 0.06  
**Complexity:** High (5-7 days)  
**Risks:** Race conditions on orderNumber generation; no REST fallback for debugging; direct file mutations may conflict with json-server's internal router state; layout resolver approach feels hacky and may confuse vue-router's active-link detection

---

### Approach 6 — Offline-First PWA Customer Portal (Low-probability)

**Summary:** The customer portal is built as an offline-capable PWA. Menu data is cached in IndexedDB via a service worker on first load. Cart lives in IndexedDB. Orders queued offline sync when connectivity returns. Admin remains a standard SPA with no offline capability.

**Detailed description:**  
Two conceptually separate apps served from the same build: the customer portal registers a service worker (`sw-customer.js`) that caches `/api/menuItems`, `/api/brands`, and static assets. The menu page reads from `CacheStorage` first, then updates from network (stale-while-revalidate strategy). Cart is stored in IndexedDB using `idb-keyval` — it survives tab close, offline periods, and browser crashes. Order creation when offline is queued in a `sync-queue` IndexedDB store. When the `sync` event fires (or connectivity returns), queued orders are sent via navigator.sendBeacon or fetch. Real-time status updates use a WebSocket connection that reconnects with exponential backoff; while offline, a "Connection lost — showing cached data" banner displays.

The build process uses `vite-plugin-pwa` to generate the service worker and manifest. Admin side does not register a service worker (or registers a separate one that only caches static assets).

Admin routes: use nginx-level or Vite-proxy-level rewriting so that `/admin/*` is treated as a single-page app route served by the same `index.html`. No JavaScript-level routing changes needed for the admin side — only customer routes are added. The existing router config adds `/admin` as a prefix to existing routes using a `router.addRoute()` call at app bootstrap for the admin routes.

**Key decisions & rationale:**
- IndexedDB cart: survives anything (close, crash, offline week)
- Stale-while-revalidate menu: instant load even on flaky networks
- Sync queue: orders don't get lost even if customer has no signal
- Vite-plugin-pwa: minimal config overhead for manifest + service worker
- Server-level admin rewrite: zero frontend changes to existing admin routing

**Trade-offs:**
- (+) Works offline — critical for food courts, events, areas with poor connectivity
- (+) Instant page loads (menu from cache)
- (+) No cart data loss under any scenario
- (-) Massive scope — PWA certification, service worker lifecycle testing, sync event handling
- (-) Service worker caching + json-server mutations means stale data if admin changes menu
- (-) `vite-plugin-pwa` adds build complexity and debugging difficulty
- (-) Offline order queue creates expectation of eventual consistency, but json-server has no conflict resolution
- (-) Only useful if the cloud kitchen target audience actually loses connectivity

**Probability:** 0.04  
**Complexity:** Very High (8-10 days)  
**Risks:** Service worker caching wrong responses; sync queue never flushes; browser not supporting `SyncManager`; "order placed offline but never delivered" customer support nightmare; over-engineered for the stated `json-server` backend

---

## Step 4 — Diversity Verification

| Dimension | A1 Progressive | A2 Feature-Sliced | A3 Domain-Driven | A4 Server Cart | A5 Socket-First | A6 Offline PWA |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Cart location** | localStorage | Pinia → localStorage | localStorage | Server | Client (socket) | IndexedDB |
| **Order mutation API** | REST PATCH | REST PATCH | REST PATCH | Custom server route | Socket event | REST + Sync queue |
| **Ws filtering** | Client-side | Client-side | Client-side | Client-side | Server-side | Client-side |
| **Admin migration** | Router nesting | Route factories | meta.domain | addRoute | Layout resolver | Vite/nginx proxy |
| **Server changes** | None | None | None | High | High | None |
| **Offline support** | No | No | No | No | No | Yes |
| **Cross-device cart** | No | No | No | Yes | No | No |

Each approach occupies a different region of the solution space:
- **A1–A3**: Different cart strategies, same REST-backend philosophy  
- **A4**: Inverts cart ownership to server  
- **A5**: Inverts mutation transport to sockets  
- **A6**: Adds connectivity resilience as primary concern  

All three high-probability approaches (A1–A3) share the same REST+localStorage foundation and differ mainly in code organization. This reflects reality — for a json-server-backed app, the most robust solutions involve minimal server changes and leverage the existing patterns.
