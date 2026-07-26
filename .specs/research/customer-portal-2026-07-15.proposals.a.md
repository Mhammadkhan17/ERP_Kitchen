# Customer-Facing Order Management Portal — Design Proposals

**Date:** 2026-07-15  
**Context:** Cloud Kitchen ERP — Vue 3 + TypeScript + Vite + PrimeVue + TanStack Vue Query + UnoCSS + Socket.IO  
**Backend:** json-server (port 3001) with Socket.IO broadcast on `order:update`  
**Base URL requirement:** `localhost:5173/` → customer content; admin moves under `/admin/`

---

## Step 1: Problem Decomposition

### Core Problem
Transform a single-tenant admin SPA into a dual-audience platform: customer-facing portal at `/` and admin/KDS under `/admin/`, while reusing the existing json-server/Socket.IO backend with zero backend changes.

### Key Constraints
| Constraint | Implication |
|---|---|
| No backend changes (json-server + Socket.IO) | All customer operations must map to existing REST endpoints; only `PATCH /orders/:id` and `POST /orders` available for mutations |
| No breaking existing KDS/inventory/menu/analytics | Admin routes must move without affecting existing vue-router named routes, query keys, or layout refs |
| Existing patterns (Composition API, `<script setup>`, same module structure) | No new meta-framework, no global store for server state — Vue Query remains the state backbone |
| Real-time must work for customers | Socket.IO `order:update` already broadcasts — but payload lacks item-level detail. Customer views need only status + timestamp updates |
| File structure conventions | `src/modules/{feature}/views/`, `composables/`, `components/` per module |

### Subproblems Any Solution Must Address

1. **Route migration:** `/kds` → `/admin/kds`, `/inventory` → `/admin/inventory`, etc., while preserving existing URL expectations (bookmarks, redirects).
2. **Layout bifurcation:** Root `/` gets a new customer layout (hero + menu browsing + cart); existing `AppLayout` becomes admin-only under `/admin`.
3. **Customer session:** No auth server — need a lightweight local identity (phone number or generated token) to associate orders.
4. **Cart state:** Pure client-side (no backend cart endpoint). Must persist across navigation, survive refresh, and support modification before order placement.
5. **Pending order modification:** No `PUT /orders/:id` endpoint exists. Items are embedded — changing pending orders means `PATCH`-ing the full order body, which json-server supports but the current `api.orders.updateStatus()` only patches status.
6. **Menu browsing:** Existing `MenuItem` type has no `image` or `description` field in `db.json` — frontend must handle gracefully without backend changes.
7. **WebSocket race conditions:** Order created via `POST` triggers `order:update` broadcast — customer must correctly merge the created order into their list.

### Evaluation Criteria

| Criterion | Weight | Measure |
|---|---|---|
| **Non-breaking** | Critical | Existing admin routes, query keys, composables unchanged |
| **Implementation cost** | High | Lines changed/added, complexity of migration, risk of regressions |
| **UX quality** | Medium | Cart persistence, real-time feedback, mobile-friendliness |
| **Maintainability** | Medium | Module separation, composable reuse, naming conventions |
| **Production readiness** | Low | Error states, loading skeletons, empty states |

---

## Step 2: Solution Space Dimensions

| Dimension | Spectrum |
|---|---|
| **Route structure** | Flat rename (`/admin/kds`) vs. nested admin shell with `<router-view>` |
| **Cart state** | `reactive()` composable (in-memory) vs. localStorage persisted vs. Pinia store |
| **Customer identity** | Phone-only (existing pattern) vs. generated UUID + localStorage vs. email+phone |
| **Order mutation API** | Extend `api.orders` with `update()` (PATCH full order) vs. custom json-server middleware |
| **Menu data enhancement** | Virtual fields at query layer (`useMenuItems` enriched) vs. accept schema as-is |
| **Admin migration strategy** | Redirect shim for old paths vs. rewrite all internal `router-link`s atomically |
| **Real-time customer feed** | Same `order:update` socket event (filter client-side) vs. new server event per customerId |

---

## Step 3: Approaches

---

### Approach A — "Minimal Viable Portal" (High Probability)

**Summary:** Add `/` customer portal as a new module (`src/modules/customer/`), rename admin routes to `/admin/*` via a single router restructure, and run a simple reactive cart composable with localStorage persistence. Keep the Socket.IO integration identical — filter events client-side by `customerId`.

**Detailed description:**  
The router is restructured into two top-level groups. The `/` path uses a new `CustomerLayout.vue` (hero section, brand/menu grid, floating cart drawer). Admin routes move under `/admin` with the existing `AppLayout` and all current child paths preserved (`/admin/kds`, `/admin/inventory`, `/admin/menu`, `/admin/analytics`). A `RedirectShim.vue` component catches navigation to legacy `/kds`, `/inventory`, etc. at the router level and redirects to `/admin/...` with a console warning.

A `useCustomerCart()` composable manages an in-memory `Map<menuItemId, { item, quantity }>`, serialized to `localStorage` under key `customer_cart`. The cart persists across page refreshes and supports add, remove, update-quantity, and clear operations. On order submission, the composable transforms cart contents into `OrderItem[]`, calls `api.orders.create()`, clears the cart, and navigates to an order confirmation view.

Customer identity uses the existing phone-based pattern: a `useCustomerSession()` composable stores `{ customerId, phone, name }` in localStorage. New customers supply a phone number on first order; returning customers see their past orders via `/orders/history`. The composable wraps `api.customers.list({ phone })` to resolve existing IDs or creates a local-only session token for guest flows.

Order modification (while `pending`) is implemented by extending `api.orders` with an `updateOrder(id, data)` method that sends a full `PATCH /orders/:id` with the modified `items` array. The existing `order:update` WebSocket event fires on the PATCH, so the KDS receives the change automatically. Cancellation reuses `api.orders.updateStatus(id, 'cancelled')`.

Real-time updates reuse `useSocket()` directly in `useCustomerOrders()`, filtering the `order:update` payload by `customerId`. The existing `useOrderFeed.ts` composable in the KDS module is untouched.

**Key design decisions:**
- `/admin` prefix chosen over `/kds` to leave room for future admin sub-modules
- LocalStorage cart over Pinia because no server cart endpoint exists and the cart is purely ephemeral UX state
- Extending `api.orders` with a generic `update()` rather than creating a new endpoint — json-server PATCH supports partial body updates natively
- Phone-based identity reuses existing `db.json` `customers` resource and the lookup pattern from `CustomerPortal.vue`

**Trade-offs:**
- *Gain:* Fastest to implement (~2-3 days), zero backend changes, zero existing module changes, follows established patterns exactly
- *Sacrifice:* Guest customers without a resolved `customerId` won't see real-time updates (socket events filter by numeric `customerId`); no email-based identity; menu items lack images/descriptions beyond name+price

**Probability:** 0.85  
**Complexity:** Low  
**Risks:** (1) Phone-only identity excludes customers who don't want to share phone numbers — mitigated by allowing order-number-only tracking at `/track`. (2) localStorage cart may conflict if user opens two tabs — acceptable for v1.

---

### Approach B — "Admin-in-Subdirectory with Shim Layer" (High Probability)

**Summary:** Keep the router file readable by extracting admin routes into a separate `adminRoutes` array re-exported from a `routes/` directory, add a `beforeEach` guard that redirects legacy paths, and build the customer portal as a sibling layout with its own module tree.

**Detailed description:**  
Refactor `src/router/index.ts` into `src/router/routes/admin.ts` and `src/router/routes/customer.ts`, merged in `index.ts`. The admin routes are defined with a parent path `/admin` and `AppLayout` component. The customer routes use `/` as the parent path with `CustomerLayout`. A global `router.beforeEach` guard intercepts requests to legacy paths (`/kds`, `/inventory`, `/menu`, `/menu/recipes`, `/inventory/adjust`, `/analytics`) and silently redirects to the `/admin/...` equivalent. This means *any* existing link, bookmark, or hard refresh to an old path still works.

The customer portal is built in `src/modules/customer/views/` with the following views:
- `MenuBrowse.vue` (route `/`) — hero banner, category filter chips, brand filter, responsive grid of `MenuItemCard.vue`
- `CartDrawer.vue` (overlay on `/`) — always-accessible slide-over cart
- `CheckoutPage.vue` (route `/checkout`) — customer info form + order summary + place order
- `OrderHistory.vue` (route `/orders`) — list of past orders with status badges, expandable details
- `OrderDetail.vue` (route `/orders/:id`) — full detail + `StatusTimeline` + modify/cancel actions while pending

A new `src/modules/customer/composables/` directory holds:
- `useCustomerCart.ts` — cart state composable (reactive Map + localStorage sync)
- `useCustomerSession.ts` — session management (phone → customerId lookup, localStorage persistence)
- `useCustomerOrders.ts` — extends the existing one with cancel + modify mutations (reuses existing query keys to avoid duplication)
- `useCustomerMenu.ts` — wraps `useMenuItems` with brand enrichment for filtering

The `AppDrawer.vue` and `AppHeader.vue` nav items are updated to `/admin/kds` etc. in one atomic commit. `PublicLayout.vue` is renamed to `CustomerLayout.vue` and enhanced with a cart badge and navigation tabs for the portal.

**Key design decisions:**
- Separate route files for admin vs. customer to avoid a single monster `index.ts`
- `beforeEach` guard for backward compatibility — zero risk of broken bookmarks
- Enhanced `PublicLayout` → `CustomerLayout` avoids creating a third layout component
- Reuses existing `useCustomerOrders` composable from `order-status` module but extends it with mutation functions (rather than duplicating)

**Trade-offs:**
- *Gain:* Extremely safe migration path; backward compatibility means the team can deploy without coordinating with anyone; clear file separation
- *Sacrifice:* Slightly more router boilerplate (guard + two route files); the `order-status` module now straddles two contexts (guest tracking + logged-in portal) which may confuse future developers

**Probability:** 0.82  
**Complexity:** Medium  
**Risks:** (1) The `beforeEach` guard is a hidden behavior that may surprise developers debugging routing issues. (2) Guest tracking at `/track` remains on `PublicLayout` while `/portal` moves to `CustomerLayout` — need to ensure the `/track` route still uses the minimal layout, not the full portal nav.

---

### Approach C — "Gradual Migration with Feature Flags" (High Probability)

**Summary:** Ship the customer portal alongside the existing routes without moving admin paths yet. Use a feature flag (`localStorage.admin_prefix`) or URL parameter to gate the migration. Once the portal is stable, flip the default and remove the flag. This decouples the portal build from the admin route migration.

**Detailed description:**  
Phase 1 (immediate): Build the customer portal at `/menu` (customer menu browsing), `/cart`, `/orders`, `/checkout` alongside the existing routes. No admin routes are moved yet. The existing `/` redirect to `/kds` remains. The customer portal lives under a new `CustomerLayout` with routes like `/menu/browse`, `/cart`, `/orders`, `/checkout`. This allows the team to ship and test the portal without touching admin routing at all.

Phase 2 (after portal is verified): Introduce a router guard that checks `localStorage.getItem('admin_prefix')`. If set to `'/admin'`, admin routes move and old paths redirect. If unset (default), admin routes remain at their current paths. The guard is toggled by an internal setting page or env var. During a sprint boundary, the default flips to `/admin`, old paths get permanent redirects, and the feature flag is removed.

Phase 3 (cleanup): Remove the flag, delete the guard, and finalize the route structure.

The customer cart composable (`useCustomerCart`) uses `reactive()` with a `watch` that debounces writes to `localStorage`. On page load, the cart is hydrated from localStorage. This avoids blocking render on deserialization. The composable exposes a `cartCount` computed property that `CustomerLayout` reads to show a PrimeVue `Badge` on the cart icon.

Order modification for pending orders uses a new `api.orders.update(id, data)` method that sends `PATCH /orders/:id` with `items` and `totalAmount` recalculated client-side. The server broadcasts `order:update` which both KDS and customer receive. The customer-side socket handler in `useCustomerOrders` checks `payload.customerId` matches the session before re-fetching.

**Key design decisions:**
- Three-phase approach minimizes risk per deployment
- `localStorage` flag over env var because it doesn't require a rebuild to test — ops team can toggle for specific testers
- Cart hydration from localStorage on composable init rather than at app mount — lazily evaluated, only when cart is accessed
- Existing `order-status` module untouched — the new `customer` module is a superset

**Trade-offs:**
- *Gain:* Safest rollback story — if the portal breaks, just don't flip the flag; admin is untouched until Phase 3
- *Sacrifice:* The codebase lives in an in-between state for 1-2 sprints; some routes exist in two layouts (`/menu` as admin and `/menu/browse` as customer), which is confusing; the feature flag adds conditional complexity that is ultimately thrown away

**Probability:** 0.80  
**Complexity:** Medium  
**Risks:** (1) Phase 2 → Phase 3 transition requires a coordinated deployment; if delayed, the codebase accumulates tech debt from the flag. (2) `/menu` route collision — admin menu at `/menu` vs customer browse at `/menu/browse` — could cause developer confusion during Phase 1.

---

### Approach D — "Server-Generated Customer Sessions with JWT-like Tokens" (Low Probability / Diversity)

**Summary:** Instead of phone-based identity, use the json-server `customers` resource to create a lightweight session. On first visit, POST to `/customers` to generate a record, store the returned `id` in localStorage as a "token". All subsequent requests include this ID. The server treats it as the customer's identity.

**Detailed description:**  
On app load, `useCustomerSession` checks for `session_id` in localStorage. If absent, it POSTs to `/api/customers` with a placeholder `{ name: 'Guest', phone: null, email: null }` and the server returns a new customer record with an `id`. This ID is stored as the session token. The composable provides `customerId` (ref), `isReturning` (computed — true if the record has a `name` beyond 'Guest'), and `claimProfile(phone)` which looks up or updates the customer record.

The cart composable is unchanged from other approaches, but the checkout flow becomes simpler: since `customerId` always exists, the order can be created immediately with `customerId` populated. Real-time socket events filter correctly because every customer has a numeric `customerId`.

Order history is fetched via `api.orders.list({ customerId })`, identical to the existing portal but without the phone lookup step. The customer can "claim" their profile later by providing a phone number, at which point the system does a `PATCH /customers/:id` to update the name and phone.

Menu items are fetched as-is, but the `MenuItemForm.vue` admin component is extended to support an optional `imageUrl` and `description` field (which `db.json` lacks). The admin UI shows a new text input; if empty, the customer portal renders a gradient placeholder.

Admin route migration follows the simplest pattern: rename paths in the router, add a one-line `beforeEach` redirect for legacy paths. No feature flags, no phased rollout.

**Key design decisions:**
- Server-side customer record as session — avoids localStorage-only identity fragility (cleared cookies, incognito mode)
- Guest-first model reduces friction (no phone entry required to browse or order)
- `claimProfile` deferred — respects privacy, collects data only when needed for support/fulfillment
- Admin menu item form extended for `imageUrl`/`description` — but only if the admin user fills it in; no migration required

**Trade-offs:**
- *Gain:* Every customer (even unclaimed guests) gets real-time updates via socket; no phone/email gate; cleaner checkout flow
- *Sacrifice:* Pollutes the `customers` resource with ephemeral guest records — json-server stores them in `db.json` indefinitely; requires a periodic cleanup cron or manual purge; slightly higher backend load (one extra POST per new visitor)

**Probability:** 0.08  
**Complexity:** Medium  
**Risks:** (1) `POST /customers` must not require authentication (currently it doesn't — json-server is open). If auth is added later, this approach breaks. (2) Guest records accumulate quickly — 1000 visitors = 1000 `customers` entries, most with `name: 'Guest'`, making the customer list harder to manage in the admin UI. (3) No way to link a guest session across devices — the token is localStorage-bound.

---

### Approach E — "IFrame-Embedded Micro-Frontend" (Low Probability / Diversity)

**Summary:** Instead of a router migration, serve the customer portal as a separate Vite app embedded via an iframe at `/`. The existing app stays at its current paths. Communication between the two apps uses `postMessage`. Admin routes are never moved — the iframe simply overlays the customer experience at the root.

**Detailed description:**  
A new Vite app is created at `customer/` within the monorepo, sharing UI components via a local npm workspace or by duplicating a small subset (`OrderCardCompact`, `StatusTimeline`, `useSocket`). This app is built and served as a static asset. The main app's `App.vue` detects route `/` and renders an iframe pointing to the built customer app (served by Vite's proxy or a different port).

Communication happens via `postMessage`:
- Customer app → Main app: `{ type: 'ORDER_PLACED', order }` — main app invalidates KDS query cache
- Main app → Customer app: `{ type: 'STATUS_UPDATE', orderId, status }` — customer app updates its displayed order

The main app's `useOrderFeed` composable is unchanged — it still listens to socket events and patches the main app's query cache. The customer app also opens its own Socket.IO connection (separate from the main app's singleton) to receive `order:update` events directly. This means two socket connections per user, but the socket singleton in `useSocket.ts` scopes per-app so there's no collision.

The admin routes are completely untouched. The iframe approach means zero router migration risk. The customer app has its own router, its own PrimeVue instance, and its own UnoCSS generation. The host app adds a `beforeResolve` guard that skips loading `AppLayout` when route is `/` (rendering a blank shell with just the iframe).

**Key design decisions:**
- Separate Vite build avoids CSS conflicts, PrimeVue theme collisions, and route complexity
- `postMessage` bridge is minimal — only two message types needed
- Customer app gets its own socket connection — simpler subscription logic, no need to share the singleton across app boundaries
- Iframe sizing uses `100vw x 100vh` with `border: none` — visually seamless

**Trade-offs:**
- *Gain:* Zero risk to existing admin app; independent deployment (customer app can be deployed on its own cadence); clean separation of concerns
- *Sacrifice:* Two PrimeVue bundles loaded (~200KB extra); duplicate socket connections; no shared auth state (customer must re-enter phone/Token in iframe); `postMessage` adds latency and complexity for real-time updates; SSR/SEO impossible; browser back/forward can behave unexpectedly

**Probability:** 0.05  
**Complexity:** High  
**Risks:** (1) Iframe security — XSS in customer app could leak into parent via `postMessage` listener. (2) PrimeVue + UnoCSS double-bundle significantly increases initial load time. (3) Browser "Open in new tab" for iframe content breaks the seamless experience. (4) `postMessage` origin validation becomes a maintenance burden. (5) Socket.IO connection limits — if many customers are on the portal, the server handles separate connections per app instance.

---

### Approach F — "Progressive Enhancement via Service Worker + Offline Cart" (Low Probability / Diversity)

**Summary:** Build the customer portal as a progressively enhanced experience that works offline once loaded. The cart and menu data are cached in IndexedDB via a Service Worker. The admin migration is handled by URL rewriting at the Vite dev server / nginx level, not in vue-router. This approach prioritizes resilience (network flakiness) over architectural purity.

**Detailed description:**  
A Service Worker is registered at `src/sw.ts` that intercepts API requests to `/api/*` and caches responses using a Cache-First strategy for `GET /menuItems` and Network-First with cache fallback for `POST /orders` and `PATCH /orders/:id`. The cart itself is stored in IndexedDB (via `idb-keyval` wrapper) rather than localStorage, allowing larger payloads and structured cloning.

The admin route migration is handled outside the SPA: the Vite dev server config is extended with a `rewrite` rule that maps `/kds`, `/inventory`, `/menu`, `/analytics` → `/admin/kds`, etc. during development. For production, the same rewrite is configured in nginx/Caddy. The vue-router is *not* changed — it still defines routes at their original paths. The external rewrite means the client never sees a redirect; the server internally serves the correct SPA entry and the client-side router matches the path as defined. However, the nav links in `AppDrawer.vue` and `AppHeader.vue` are updated to `/admin/kds` etc., and a `beforeResolve` guard in the router maps old incoming paths to the new ones (in case a user directly navigates).

The customer portal views are built as route children of a new `CustomerLayout` at the root path `/`. The layout is wrapped in a `Suspense` boundary so that the Service Worker can serve cached menu data while the network request completes in the background.

Order modification uses IndexedDB-local mutation queue: when a customer modifies a pending order and the network is unavailable, the mutation is queued locally with a `pendingSync` flag. When connectivity resumes, the queue is flushed. This is transparent to the user — the UI optimistically shows the modified state and the Service Worker resolves the conflict when the `PATCH` succeeds.

**Key design decisions:**
- URL rewrites at the server layer instead of vue-router — keeps the client-side router simpler and allows the admin to work with or without the JS bundle loaded
- IndexedDB over localStorage for the cart — supports structured data (OrderItem[]), larger quotas, and transactional updates
- Mutation queue for offline order modification — future-proofs the portal for areas with unreliable connectivity (food trucks, pop-ups)
- Service Worker caching for menu data — instant load on repeat visits, critical for the menu-first customer experience

**Trade-offs:**
- *Gain:* Best offline resilience; instant menu load on return visits; future-proof for PWA distribution; clean server-side URL rewrite keeps the SPA router uncluttered
- *Sacrifice:* Service Worker complexity (cache invalidation, SW lifecycle management, testing overhead); IndexedDB API is more verbose than localStorage; offline mutation queue adds a new failure mode (queue conflicts); the URL rewrite approach means the dev server is configured differently from production, causing potential "works on my machine" issues

**Probability:** 0.03  
**Complexity:** High  
**Risks:** (1) Service Worker caching of `/api/orders` may serve stale data — careful cache-busting logic required. (2) If the nginx/Vite rewrite misconfigures, admin routes 404 with no clear error. (3) The mutation queue could produce conflicting orders if the same customer modifies on two devices offline. (4) vue-router `beforeResolve` mapping for old paths must be maintained alongside the server rewrite — two sources of truth for the same redirect logic.

---

## Step 4: Diversity Verification

| Dimension | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| **Admin migration strategy** | Router restructure | Route files + guard | Feature flag phased | Router rename + guard | None (iframe) | Server URL rewrite |
| **Customer identity** | Phone-based | Phone-based | Phone-based | Server-generated guest session | Iframe-local token | Phone-based |
| **Cart persistence** | localStorage | localStorage | localStorage (debounced) | localStorage | Iframe-local | IndexedDB |
| **Real-time approach** | Client-side filter | Client-side filter | Client-side filter | Client-side filter (guaranteed ID) | Dual socket connection | SW cache + socket |
| **Offline support** | None | None | None | None | None | Full (SW + mutation queue) |
| **Backend changes** | None | None | None | None | None + separate build | None |
| **Risk profile** | Low | Low | Medium | Medium | High (iframe) | High (SW) |
| **Implementation cost** | ~2-3 days | ~3-4 days | ~4-5 days | ~3-4 days | ~5-7 days | ~6-8 days |

Approaches A, B, C cluster around the conservative end of the spectrum (incremental, safe, well-understood). D introduces a server-side identity shift. E is a radical architectural divergence (micro-frontend). F trades implementation complexity for offline resilience. All six are genuinely different — they differ in at least 3 of the 8 comparison dimensions.

---

**Recommendation for next step:** Approaches A or B should be selected as the primary implementation path. They offer the lowest risk, fastest delivery, and closest alignment with existing codebase patterns. D (server-generated sessions) can be cherry-picked as an enhancement to A/B rather than a standalone approach — specifically the guest-first identity model without the phone gate.
