# Customer Portal — Architecture Proposals (Batch B)

**Date:** 2026-07-15
**Context:** Cloud Kitchen ERP — Vue 3 + TS + Vite + vue-router + PrimeVue + TanStack Vue Query + UnoCSS + Socket.IO
**Backend:** json-server (port 3001) proxied via Vite `/api`

---

## Problem Decomposition

### Core Problem
Transform a single-tenant KDS/admin SPA into a dual-audience application where customers browse, order, and manage orders at `/`, while admin/KDS functions remain intact under a prefixed path — without breaking existing functionality.

### Subproblems
| # | Subproblem | Description |
|---|------------|-------------|
| P1 | **Route conflict** | Current `/` redirects to `/kds`. Customer needs `/` as a landing/menu page. Admin routes must migrate under a prefix without breaking existing deep links. |
| P2 | **No cart system** | The app has orders but no cart composable, no add-to-cart flow, no guest cart persistence. |
| P3 | **No customer order mutations** | API client has `orders.create` and `orders.updateStatus` but no `orders.update` (modify items) or `orders.delete` (cancel). Customer cancellation currently requires admin action via KDS. |
| P4 | **WebSocket subscription model** | Current `useOrderFeed` subscribes globally to `order:update`. Customers need filtered updates scoped to their orders. Guest tracking works because it filters by `orderNumber` client-side. |
| P5 | **Customer identity/session** | Current pattern uses localStorage phone/ID with lookup. No session token, no auth guard. Cart needs an anonymous session ID that persists across page loads. |
| P6 | **Menu browsing for customers** | Menu module is admin-only (`MenuItemForm`, `RecipeBuilder`). Customers need a read-only menu browser with category filtering and add-to-cart. |
| P7 | **Order modification in pending state** | Customers must be able to edit items, quantities, or special instructions while `status === 'pending'`. This requires a PATCH endpoint that replaces `items` array and recomputes `totalAmount`. |

### Evaluation Criteria
1. **Zero breakage** — Existing `/kds`, `/inventory`, `/menu`, `/analytics` routes continue working after migration
2. **Route clarity** — Customer vs admin separation is obvious and maintainable
3. **State consistency** — Real-time updates patch Query cache correctly for both audiences
4. **Developer ergonomics** — Adding new customer features follows existing patterns
5. **Graceful migration** — Admins can be redirected from old paths to new prefixed paths without losing work

---

## Approach 1: Route Prefix Restructure + Cart Module
**Probability:** 0.88 | **Complexity:** Medium

### Summary
Move all admin routes under a `/admin` prefix, place customer portal at `/`, and introduce a `modules/customer-order/` module with cart composable, menu browser, and order management views.

### Description
The router is restructured into two top-level groups. The `/admin` route group uses the existing `AppLayout` with sidebar/drawer. The `/` route group uses a new `CustomerLayout` (derived from `PublicLayout`) with a navbar, cart badge, and responsive grid. A new `modules/customer-order/` directory houses `MenuBrowser.vue`, `CartPanel.vue`, `CheckoutPage.vue`, `CustomerOrderHistory.vue`, and `CustomerOrderDetail.vue`. A `useCart.ts` composable manages a `Map<menuItemId, CartItem>` in `reactive()` + `watch` persists to `localStorage` under key `customer_cart`. The customer session is a UUID generated on first visit, stored in `localStorage` as `customer_session_id`, sent with orders so they can be retrieved later. WebSocket updates are handled by a new `useCustomerOrderFeed.ts` composable that listens for `order:update` and patches the customer's query keys only. The API client gains `orders.update(id, data)` for PATCH (item modification) and `orders.delete(id)` for cancellation. Admin users hitting old `/kds` URLs are redirected via the router's `beforeEach` guard to `/admin/kds`.

### Key Design Decisions
- **Explicit redirect guard over 301**: A `beforeEach` nav guard checks if the user navigates to a legacy admin path (`/kds`, `/inventory`, `/menu`, `/analytics`) and redirects to `/admin/<path>` with a `?redirected=1` query param. This avoids breaking bookmarks while not requiring server-side redirects.
- **Cart as composable, not Pinia**: The existing codebase uses Pinia in name only — no stores exist. A composable with `localStorage` persistence matches the existing pattern (`useCustomerOrders`, `useOrderTracking` both use `ref` + `localStorage`).
- **New module, not repurposed order-status**: The existing `modules/order-status/` is focused on tracking-only (read-only). The customer portal requires create/modify/cancel — a fundamentally different concern that deserves its own module with clear separation.

### Trade-offs
| Gain | Sacrifice |
|------|-----------|
| Clean route hierarchy — `/admin/*` vs `/*` is immediately understandable | All existing bookmarks/links to `/kds` stop working without the redirect guard |
| Existing admin code is untouched — only router config changes | Redirect guard adds a small runtime cost on every navigation |
| Cart persistence survives page refresh | Cart does not survive clearing localStorage or switching devices (acceptable for MVP) |
| Follows existing module structure exactly | Duplicates some UI patterns between `order-status` and `customer-order` (mitigated by extracting shared components later) |

### Risks
1. **Redirect loop**: Guard must skip redirect when user is already on `/admin/*` or when `redirected` param is present.
2. **Query cache key collision**: Customer query keys (`['orders', 'customer', sessionId]`) and admin keys (`['orders']`) must not overlap. The admin `useOrderFeed` invalidates `['orders']` globally — customer cache entries are safe as long as keys differ.
3. **API gap**: `json-server` supports PATCH and DELETE natively via REST, but the current `api.orders` only exposes `updateStatus`. Need to add generic `update` and `delete` methods.

---

## Approach 2: Layout-Switching Root with Role Detection
**Probability:** 0.82 | **Complexity:** Medium

### Summary
Keep a single flat route table but swap layouts at the top-level `router-view` based on a reactive role. Admin layout renders the sidebar; customer layout renders the portal UI. Route paths remain as-is (or minimally changed) but access is gated by role.

### Description
`App.vue` uses a computed role (`'admin'` or `'customer'`) derived from a `useRole()` composable that checks for the presence of `admin_token` in `localStorage`. If no admin token exists, the app assumes customer mode. The `App.vue` template becomes:
```vue
<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>
```
Customer routes (`/`, `/menu`, `/cart`, `/orders`, `/track`) share the same path level as admin routes (`/kds`, `/inventory`, etc.). When an admin user logs in, the entire app re-renders with the `AppLayout`. The router's `beforeEach` guard checks the intended route against the current role and either renders the content or shows an "unauthorized" message. Customer views are lazy-loaded under empty-path parent routes with `CustomerLayout`. The existing `PublicLayout` becomes `CustomerLayout` and gains navigation to menu, cart, and order history.

### Key Design Decisions
- **No path prefix needed**: Since the layout swaps dynamically, route paths don't need `/admin` prefix. The role check determines which routes are accessible. This minimizes URL changes.
- **`useRole()` composable matches existing patterns**: Like `useSocket.ts` and `useCustomerOrders`, this is a lightweight composable wrapping localStorage + a reactive ref. No Pinia needed.
- **Route name over path**: Admin features reference `name: 'kds.dashboard'` internally, not `/kds`. The `/kds` path can remain but the route definitions are gated by `meta.role`.

### Trade-offs
| Gain | Sacrifice |
|------|-----------|
| Zero URL breakage — `/kds` still works, just rendered inside a different layout concept | Ambiguous URLs — a `/kds` path means nothing to a customer visiting the site |
| No redirect logic needed | Role detection is fragile — relies on a localStorage key that an admin could accidentally clear |
| Shared route metadata and guards are centralized | Adding a new route requires remembering to set `meta.role` — easy to forget |
| Simple mental model for developers | If an admin opens the app in an incognito window, they see the customer portal — confusing |

### Risks
1. **Race condition on role detection**: `useRole()` must resolve synchronously before the router guard fires. If it becomes async (e.g., API call to validate token), the entire route resolution stalls.
2. **Route name collisions**: Both admin and customer could have a route named `orders`. Names must be namespaced (`kds.orders`, `customer.orders`) or prefixed.
3. **Layout flicker**: Switching roles causes a full layout re-render. If the user has both admin and customer sessions (e.g., testing), the transition is jarring.

---

## Approach 3: Dynamic Admin Prefix via Runtime Config
**Probability:** 0.80 | **Complexity:** Medium-High

### Summary
Make the admin route prefix a runtime configuration value (default `'admin'`), loaded from a JSON file or environment variable at app initialization. All admin route paths are generated from this prefix. Customer routes occupy all non-admin paths. The prefix is configurable without rebuilding.

### Description
At app startup, `main.ts` fetches `config.json` from `/public` which contains `{ adminPrefix: "admin" }` (or reads `import.meta.env.VITE_ADMIN_PREFIX`). This value is passed to a `createAdminRouter()` factory function that prepends the prefix to every admin route definition. The main router is built by merging the admin routes with customer routes. The `App.vue` template checks the current route's meta to decide which layout to render. Navigation guards use the prefix value to determine if the current path is admin-related. The sidebar's navigation links are generated from the prefix, so if an ops manager wants `/backoffice/kds` instead of `/admin/kds`, they change one config value and all links update automatically. The existing `AppHeader` and `AppDrawer` components accept the prefix as a prop or retrieve it from a shared inject key (`ADMIN_PREFIX`).

### Key Design Decisions
- **Prefix as inject/provide**: `ADMIN_PREFIX` is provided at the `App.vue` level and injected wherever route paths need to be constructed (sidebar, header links, navigation guards). This keeps components decoupled from the specific prefix value.
- **Separate route generation**: A `createAdminRoutes(prefix: string)` utility returns the route config array. This makes testing easier and allows the prefix to be validated at generation time (e.g., must not contain slashes).
- **Environment fallback**: `config.json` is the primary source, with `VITE_ADMIN_PREFIX` as build-time fallback. This supports both Docker deployments (env vars) and static hosting (config.json).

### Trade-offs
| Gain | Sacrifice |
|------|-----------|
| Maximum deployment flexibility — same build works for any prefix | Adds a blocking config fetch at startup — increases TTI by one round-trip |
| All admin links update automatically when config changes | `createAdminRoutes` adds indirection that makes the router harder to understand at a glance |
| Follows the "configuration over hardcoding" principle | Environment variable + config.json duality is confusing — which wins at runtime? |
| Easy to A/B test different route structures | Dynamic prefix complicates nav guards — need to check both `/prefix/kds` and possibly legacy `/kds` |

### Risks
1. **Startup race**: If `config.json` fails to load, the app must decide: fall back to default prefix or show an error. Either choice has UX implications.
2. **Deep links break across config changes**: If an admin bookmarks `/admin/kds` and the prefix changes to `/backoffice`, the bookmark breaks. No runtime redirect can fix this without also storing the old prefix.
3. **Increased cognitive load**: Developers must think in terms of the `prefix` variable when reading route configs, not static paths. Code reviews become harder.

---

## Approach 4: Independent Customer SPA (Separate Mount Point)
**Probability:** 0.08 | **Complexity:** High

### Summary
Mount two independent Vue 3 application instances on the same HTML page — one for the customer portal (mounted on `#app-customer`), one for the admin panel (mounted on `#app-admin`). A thin orchestrator script reads the URL and mounts the appropriate app. Both apps share the same `node_modules`, types, and API client but have separate router instances, component trees, and state.

### Description
The `index.html` contains two root divs: `<div id="app-customer"></div>` and `<div id="app-admin"></div>`. A `boot.ts` script runs before Vue mounts and inspects `window.location.pathname`. If it starts with `/admin`, it dynamically imports `admin/main.ts` (which creates a Vue app with `AppLayout`, admin router, and admin stores). Otherwise, it imports `customer/main.ts` (which creates a Vue app with `CustomerLayout`, customer router, and cart stores). Each app gets its own `createApp()`, `createRouter()`, and `createPinia()`. They do not share state, but share code via TypeScript project references — the `shared/` directory contains types, API client, and composables that both apps import. The Vite config uses `rollupOptions.input` with multiple entry points, producing separate bundles for admin and customer that are loaded on demand.

### Key Design Decisions
- **Separate bundle per audience**: The customer app is smaller (~50KB gzip vs ~120KB for admin). Admin-only dependencies (e.g., chart libraries) are never loaded by customer browsers.
- **Shared library extracted**: `@erp/shared` (alias for `src/shared/`) contains `types`, `api/client`, `composables/useSocket`, `composables/useSnackbar`. Both apps import from this internal package. Vite's `optimizeDeps` ensures shared code is deduplicated.
- **Orchestrator is zero-dependency**: `boot.ts` uses only `document.write` or dynamic `<script>` injection — no framework, no import maps. This keeps the initial HTML response tiny.

### Trade-offs
| Gain | Sacrifice |
|------|-----------|
| Complete isolation — admin changes cannot break customer and vice versa | Two Vue runtimes in memory if user switches roles without page reload |
| Optimized bundle per audience — customers don't download admin charting libs | Shared composables like `useSocket` create two Socket.IO connections (one per app) |
| Natural deployment boundary — could be deployed to different subdomains | Requires TypeScript project references + Vite multi-entry config — non-trivial build setup |
| Future-proof for micro-frontends | Over-engineered for a team of < 10 developers |

### Risks
1. **Socket.IO double connection**: Both apps would open their own WebSocket. Mitigatable by sharing the singleton socket at the `window` level, but that couples the two apps.
2. **Shared composable gotchas**: If `useSnackbar` creates a Toast component, both apps would have competing toast stacks. Shared code must be stateless or scoped.
3. **Build complexity**: Vite multi-entry + shared library + TypeScript project references is a brittle setup. A single misconfigured path alias breaks the entire build.

---

## Approach 5: Middleware-Based Route Rewriting
**Probability:** 0.07 | **Complexity:** Low-Medium

### Summary
Keep the entire app as a single SPA with all routes at the root level. Use a `beforeEach` navigation guard as a "middleware pipeline" that dynamically rewrites route paths based on session state and route metadata. The customer portal and admin panel are not structurally separated — they are the same routes with different access policies applied by middleware.

### Description
The router defines all routes in one flat array without any `/admin` prefix. Each route has a `meta.access` field: `'public'` (always accessible), `'customer'` (requires a customer session), or `'admin'` (requires admin auth). The `beforeEach` guard runs three middleware functions in sequence: (1) `sessionMiddleware` — ensures a customer session UUID exists in localStorage, creating one if absent; (2) `authMiddleware` — checks the route's `meta.access` against the current role; (3) `redirectMiddleware` — rewrites legacy paths (e.g., `/kds` → `/orders/kds-view` if the app decides to restructure later). If an admin user accesses a customer route, they see the customer view (useful for testing). If a customer accesses an admin route, they get a 403 page. The customer session middleware runs on every navigation, ensuring a session is always available without explicit login. Routes like `/menu`, `/cart`, `/orders`, and `/track` are accessible at all times; `/kds`, `/inventory`, `/menu/manage`, `/analytics` are gated to admin only.

### Key Design Decisions
- **Session-first design**: A customer session is auto-created on first visit. No login screen is needed for browsing. This reduces friction — customers see the menu immediately.
- **Route rewrite instead of redirect**: Instead of 302 redirecting, the guard rewrites `to.path` using `next({ path: newPath })`. This keeps the browser history clean and avoids the redirect loop problem.
- **Flat route table**: Every route is at the top level. `/menu` is the customer menu browser; `/menu/manage` is the admin recipe builder. They share the `/menu` prefix but are different routes.

### Trade-offs
| Gain | Sacrifice |
|------|-----------|
| Zero URL changes — all existing links work without modification | Route collisions are harder to spot — `/menu` for customers vs `/menu` for admin is confusing in the route config |
| Session is always available — no login gate | Anonymous sessions create data quality issues (orphaned carts, no way to contact customer) |
| Middleware pipeline is composable and testable | Middleware ordering is critical — if `authMiddleware` runs before `sessionMiddleware`, the session UUID may not exist yet |
| Low implementation effort — add one file (`middleware.ts`) and modify three router config entries | No clear path migration story — admin routes are mixed with customer routes in the same table |

### Risks
1. **Route name ambiguity**: Two routes cannot share the same `name`. Admin and customer routes must use namespaced names (`adminKds`, `customerMenu`), which looks inconsistent in `router-link` usage.
2. **Security by obscurity**: Admin routes are "hidden" behind a guard but still defined in the same bundle. A motivated user could find the route paths by inspecting the JS source.
3. **Middleware explosion**: As more access policies are added (e.g., `manager`, `cashier`), the middleware pipeline grows. Without careful design, it becomes a tangled `if-else` chain.

---

## Approach 6: State-Driven Single Surface (No Traditional Routes)
**Probability:** 0.05 | **Complexity:** High

### Summary
Abandon traditional multi-page routing for the customer portal. Render all customer views inside a single `<component :is="currentView">` switcher driven by a reactive `customerView` ref. The URL bar is updated via `history.replaceState` for bookmarkability but the app never does a full route transition. Admin side keeps traditional vue-router. The customer side is a "single surface" app within a route.

### Description
A new `/portal` route (or `/` with a `CustomerSurface` component) renders a state machine with views: `menu`, `cart`, `checkout`, `order-placed`, `orders`, `order-detail`, `track`. A `useCustomerView()` composable exposes `currentView` (a ref) and `navigate(view, params?)` — the only way to change views. `navigate()` updates `currentView`, calls `history.replaceState()` with the view name (e.g., `/portal/menu`), and the browser back button is intercepted via `popstate` to restore the previous view. There is no `<router-view>` inside the customer surface — just a `<KeepAlive>`-wrapped `<component :is="viewComponent">` that preserves component state as users navigate between menu, cart, and checkout. Cart state survives view switches because components are kept alive and the cart composable is scoped above the view layer. The admin side (`/admin/kds`, etc.) uses traditional vue-router as before, completely unaffected.

### Key Design Decisions
- **KeepAlive preserves cart context**: When a user navigates from menu → cart → back to menu, the menu browser retains its scroll position and category filter. This is superior to route-based navigation where components are destroyed and recreated.
- **history.replaceState for URLs only**: URL updates are purely cosmetic — they exist so users can copy/paste URLs. The app never reads the URL to determine state on page load (it starts at `menu` by default). This avoids complex URL parsing logic.
- **Admin stays untouched**: This approach is scoped entirely to the customer portal. The admin router, guards, and components remain exactly as they are. The only router change is adding the `/portal` catch-all route.

### Trade-offs
| Gain | Sacrifice |
|------|-----------|
| Butter-smooth transitions — no route guard delay, no layout re-initialization | Not standard — new developers must learn the `useCustomerView` state machine pattern |
| KeepAlive preserves scroll position, form state, and cart across all views | Browser back/forward buttons require custom `popstate` handling — easy to get wrong |
| Admin side is completely isolated from these changes | Cannot deep-link to a specific order from outside the app (e.g., email link to `/portal/order/42`) |
| Low risk of breaking existing admin routes | `history.replaceState` means the server must serve the SPA for all `/portal/*` paths — no SSR fallback |

### Risks
1. **State machine complexity**: As the portal grows (coupons, saved addresses, reorder), the view state machine becomes complex. Without a statechart library (XState), the `useCustomerView` composable risks becoming a big `switch` statement.
2. **URL desync**: If `navigate()` fails to call `history.replaceState`, the URL no longer reflects the current view. Since views are restored from state on page load, the wrong view might render for the URL shown.
3. **Testing difficulty**: Standard Vue Test Utils patterns assume route-based navigation. Testing the state machine requires wrapping the entire `CustomerSurface` component with the correct initial state — significantly harder than testing a routed component.

---

## Diversity Verification

| Dimension | A1: Prefix Restructure | A2: Layout Swing | A3: Dynamic Prefix | A4: Dual SPA | A5: Middleware Rewrite | A6: State Machine |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Architecture style** | Structural (routes) | Structural (layouts) | Config-driven | Micro-frontend | Guard-driven | State-machine |
| **Route approach** | Prefix separation | Flat + guard | Dynamic prefix generation | Independent routers | Middleware rewrite | No router in customer zone |
| **Admin isolation** | High (separate subtree) | Medium (same tree, guarded) | Medium (prefixed but same tree) | High (separate bundle) | Low (same tree) | High (completely separated) |
| **Cart persistence** | localStorage composable | localStorage composable | localStorage composable | localStorage composable | localStorage composable | KeepAlive + composable |
| **URL bookmarkability** | Full | Full | Full | Full | Full | Partial (replaceState) |
| **Dev familiarity** | High | Medium | Medium | Low | Medium | Low |
| **Migration effort** | Medium | Low | Medium | High | Low | Medium |
| **Risk of breaking admin** | Low | Medium | Low | Very low | Medium | Very low |

**Conclusion:** The six approaches span from conventional route restructuring (A1–A3) to architectural divergence (A4, A6). They differ in admin isolation strategy (prefix vs guard vs separate app), routing philosophy (standard vs middleware vs state machine), and complexity. No two approaches are minor variations of each other.
