# Customer Live Order Tracking — Solution Proposals (Set A)

**Date:** 2026-07-15  
**Context:** Cloud Kitchen ERP — Vue 3 + Vite + UnoCSS + PrimeVue 4 + TanStack Vue Query 5 + Pinia 2 + Socket.IO + json-server on :3001  
**Author:** Architecture Agent

---

## 1. Problem Decomposition

### Core Problem
Deliver two customer-facing views into the existing KDS order lifecycle — a **public guest tracking page** (order-number lookup with live status) and a **customer portal** (full order history with live updates) — using the existing real-time infrastructure.

### Key Constraints
- No authentication system exists (no login, no guards, no auth store)
- Existing WebSocket broadcasts `order:update` globally — every client receives all order events (no room scoping)
- Orders are keyed only by sequential `orderNumber` and `customerName` string — no `customerId` field exists
- Routes are flat children under `AppLayout` with auto-redirect to `/kds`; no public/unauthenticated routes exist
- Singleton Socket.IO client pattern in `useOrderFeed.ts` — module-level singleton, not composable-scoped
- Palette: `#F8F9FA` ground, `#1A1D1F` text, `#E85D3A` accent, `#E9ECEF` border — with UnoCSS primary-* family
- All modules (kds, inventory, menu, analytics) are internal; no customer-facing code exists

### Subproblems Any Solution Must Address
1. **Identity** — How to associate an order with a given customer without breaking existing data (`customerName` string only)
2. **Guest entry point** — Public route outside the authenticated AppLayout shell, with an order-number input
3. **Live filtering** — The global `order:update` broadcast emits every status change; each client must discard irrelevant events
4. **State isolation** — The singleton `useOrderFeed` currently serves the KDS; a customer tracker needs its own connection or filtered subscription
5. **Server augmentation** — Either add customer fields to `db.json` orders, or add a new `customers` resource
6. **UX parity** — Status progression timeline, estimated prep time, item breakdown — mirroring the KDS detail dialog for the customer

### Evaluation Criteria
| Criterion | Weight | Definition |
|-----------|--------|------------|
| Implementation complexity | High | Lines changed, new files, server mods, learning curve |
| UX quality | High | Real-time feel, status clarity, mobile-friendliness |
| Security/Privacy | Medium | Preventing order-number guessing, data isolation |
| Codebase alignment | High | Consistency with existing composables, query patterns, style conventions |
| Evolvability | Medium | Path from MVP to production with real auth and scoped WS |
| Testability | Low | Ability to test in isolation with current tooling |

---

## 2. Solution Space Map

### Major Decision Axes

```
Auth Strategy     None ───────────────────────────────────────── JWT
                      ●──○──○──○──○──●
                      Guest-only      Full auth system

WebSocket Model   Global broadcast ────────────────────── Room-scoped
                      ●──○──○──○──○──●
                      Client-side     Server-side
                      filtering       room filtering

Data Association  customerName string ────────────────── customerId FK
                      ●──○──○──○──○──●
                      Minimal change   New customers resource

Route Model       Flat inside AppLayout ────────────── Separate public layout
                      ●──○──○──○──○──●
                      Reuse shell     Full isolation

State Management  TanStack Query cache ─────────────── Pinia store
                      ●──○──○──○──○──●
                      Cache-driven    Explicit store

Transport         WebSocket (existing) ─────────────── SSE + WebSocket hybrid
                      ●──○──○──○──○──●
                      Single transport  Split by audience
```

---

## 3. Six Approaches

---

### Approach A1 — Guest-Only Order-Number Lookup (High Probability)

**Summary:** A single public page where a guest enters their order number and sees live status updates via the existing WebSocket, with no server changes.

**Description:**  
Add two routes outside of `AppLayout`: `/track` (order-number input page) and `/track/:orderNumber` (live status view). The input page is a centered card with a single InputText bound to orderNumber, and a "Track" button that navigates to `/track/:orderNumber`. The status page uses `useQuery` to fetch the order by order number, then establishes its own singleton WebSocket connection (or reuses the existing one with a filtered listener). Status is displayed as a vertical timeline (Placed → Preparing → Ready → Dispatched) with timestamps and a live "current status" banner.

Server changes are **zero** — the existing `router.render` broadcast already emits `{ id, status, orderNumber }`. Client-side filtering discards events not matching the tracked order number. The singleton `useOrderFeed` is either reused (adding a filter map concept) or a new `useCustomerOrderFeed` composable is created that takes an `orderNumber` filter.

**Key Design Decisions:**
- Routes `/track` and `/track/:orderNumber` are defined at the router root level (not under AppLayout) to avoid showing the internal sidebar/header
- A new composable `useSingleOrderFeed(orderNumber)` wraps `io()` with a thin filter — only `order:update` events matching `payload.orderNumber` trigger a queryClient invalidation for `['order', orderNumber]`
- The order is fetched via a new `api.orders.getByNumber(number)` method that queries `/orders?orderNumber=${number}` (json-server supports this natively)
- Status timeline is a re-rendered version of the existing KDS detail dialog timeline — visually isomorphic but a new component to avoid coupling

**Trade-offs:**
- (+) Zero server changes — works immediately with existing `db.json` shape
- (+) No auth complexity — pure guest experience
- (+) Maximum codebase alignment — reuses singleton WS, Axios, TanStack Query patterns
- (-) Order numbers are sequential and guessable — anyone can track any order by iterating numbers
- (-) No customer portal — only one-at-a-time tracking by order number
- (-) The singleton WS receives ALL order:update events globally; at scale this is wasteful (every guest client processes the entire kitchen broadcast)

**Probability:** 0.85  
**Complexity:** Low (3 new files: view, composable, route config)  
**Risks:** Order-number guessing is a privacy concern; WS noise at scale; no customer identity for future features

---

### Approach A2 — Dual-Mode: Guest + Customer with LocalStorage "Auth" (High Probability)

**Summary:** Adds both guest tracking and a customer portal by introducing a simple PIN-based identity stored in localStorage, plus a `customerId` field on orders for association.

**Description:**  
Extend the Order type with `customerId: string` and `customerPin: string` fields. Seed the existing orders with synthetic customer IDs (e.g., mapping `customerName` → a UUID). Add a `customers` resource to `db.json` with `{ id, name, pin, phone }`.

A new `/register` page allows a customer to set their name + PIN (stored in localStorage). The customer portal at `/orders` fetches `/orders?customerId=${id}` and establishes a WebSocket filtered on their orders. Guest tracking (`/track`) remains as-is from A1 but now also accepts PIN entry for sensitive order details.

The Pinia store (`useCustomerStore`) manages `customer.id`, `customer.name`, and a boolean `isAuthenticated`. It persists to localStorage. When `isAuthenticated`, the AppLayout shows a "My Orders" nav link. When not, a link to `/track` appears instead.

**Key Design Decisions:**
- `customerId` is added to the Order type and `db.json` — this is a breaking change to the data model but aligns with any real auth system
- PIN is a simple 4-digit string, hashed with a fast hash (not bcrypt — this is json-server) for minimal "security"
- Guest tracking and customer portal share a composable `useOrderTracker(customerId?, orderNumber?)` that wraps WS + TanStack Query
- The existing `useOrderFeed` singleton is left untouched — a new `useCustomerFeed` singleton is the customer-facing equivalent

**Trade-offs:**
- (+) Covers both required features in one coherent design
- (+) Customer portal shows *all* orders without re-entering order numbers
- (+) Data model change (`customerId`) prepares for real auth later
- (-) PIN-in-localStorage is pseudo-auth — no real security, easily lost on device clear
- (-) Requires modifying all existing orders in `db.json` to add `customerId`
- (-) Two WebSocket singletons (KDS + customer) complicates connection management

**Probability:** 0.82  
**Complexity:** Medium (5–7 files: store, composable, 2 views, route changes, db.json migration)  
**Risks:** Pseudo-auth gives false sense of security; localStorage fragility; two singletons may conflict

---

### Approach A3 — Full Customer Portal with JWT + Server Room Scoping (High Probability)

**Summary:** A complete authentication system (JWT-based login/register) plus server-side Socket.IO rooms so customers receive only their own order events. Guest tracking remains but is degraded to polling.

**Description:**  
Introduce a disposable JWT-based auth flow where customers register with email + password. The server (`server.js`) gains auth endpoints (`POST /auth/register`, `POST /auth/login`) that return JWTs. The `customers` resource is promoted to a real auth table with hashed passwords (via a pre-commit script or a middleware).

On the server side, `router.render` is augmented to also emit `order:update` to a room named `customer:${order.customerId}`. The customer's socket joins their room on connection (using the JWT payload to derive `customerId`). Guest tracking clients use a new `guest:${orderNumber}` room pattern.

An `auth` store (`useAuthStore`) tracks JWT, refresh logic, and customer profile. Axios interceptors attach the `Authorization` header. The router gains `beforeEach` guards that redirect unauthenticated users to `/track` or `/login`. Guest tracking loses WebSocket and falls back to a 10-second polling interval (guests don't justify the server-side WS overhead of per-order rooms).

**Key Design Decisions:**
- JWT auth is real — usable for future features (profile, saved addresses, order history)
- Socket.IO rooms solve the filtering problem at the source — the server only sends relevant events
- Auth endpoints live in `server.js` as Express middleware before `jsonServer.router`
- Guest tracking degrades to polling to avoid creating thousands of WS connections for anonymous users
- The `Order` type gets `customerId` (required for room routing) — a **must-have** for this approach

**Trade-offs:**
- (+) Production-ready auth — no tech debt from pseudo-auth
- (+) WS rooms are the architecturally correct solution — minimal network waste
- (+) Guest tracking and customer portal have properly different transport strategies
- (-) Significant server.js changes — auth middleware, room management, password hashing
- (-) JWT adds complexity: token refresh, expiration, secure storage
- (-) Guest experience degrades from real-time to 10s polling
- (-) Requires a `customers` table with hashed passwords — json-server is not ideal for this

**Probability:** 0.85  
**Complexity:** High (auth system, server overhaul, 10+ files, db schema migration)  
**Risks:** JWT secret management in json-server dev env; password hashing in a dev server; over-engineering for an MVP

---

### Approach A4 — Hashed-Order-Token Guest Tracking (Diverse)

**Summary:** Replace sequential order numbers with opaque, hashed tracking tokens for public URLs. Each order gets a unique, unguessable slug (e.g., `TRK-a8f3c`), and the guest page is `/track/:token`.

**Description:**  
Add a `trackingToken` field to the Order type — a short (8-10 char) base62 string generated server-side when the order is created (`POST /orders`). The `router.render` interceptor generates it if missing. The guest page becomes `/track/:token` instead of `/track/:orderNumber`. The token is derived from `orderNumber + secret_salt` via SHA-256 truncated, so it's deterministic but not reversible.

The customer portal (if built) uses JWT auth from A3 or localStorage from A2 — but the guest page is now resistant to enumeration attacks. The order lookup API becomes `GET /orders?trackingToken=${token}`. A new helper `generateTrackingToken(orderNumber)` is shared between `server.js` and the client for display purposes.

The status display page shows the order number (displayed as `#2001`) and the token in small muted text — the token is the URL itself, shared by sending the link. No login or PIN needed.

**Key Design Decisions:**
- Token generation happens server-side in `router.render` — the client never generates it
- Token is the primary lookup key for guest tracking, replacing `orderNumber` in the public route
- PIN/auth approaches are orthogonal — this works with any auth strategy (or none)
- The `trackingToken` field is added to `db.json` orders via a migration script

**Trade-offs:**
- (+) Prevents order-number enumeration — privacy win over A1
- (+) Token can be included in SMS/email order confirmations → direct link to tracking page
- (+) Deterministic from `orderNumber + salt` — no extra state to manage
- (-) Adds a new field to every order — migration required
- (-) If the salt is compromised, all tokens can be regenerated
- (-) Token in the URL is shareable by design — anyone with the link can track (same as any delivery tracking)

**Probability:** 0.08 (diverse — unconventional token scheme instead of order numbers)  
**Complexity:** Low-Medium (server token generation, client route change, db migration)  
**Risks:** Salt management in json-server; token collision risk if truncating too aggressively; UX friction of "where do I find my tracking code?"

---

### Approach A5 — SSE Public / WS Customer Split (Diverse)

**Summary:** Guest tracking uses Server-Sent Events (SSE) for a lightweight, unidirectional real-time feed, while the customer portal uses the full Socket.IO bidirectional channel. Different transport per use case.

**Description:**  
The server gains a `GET /api/events/order/:id` SSE endpoint that streams order status updates. The endpoint subscribes to an in-process EventEmitter that `router.render` also publishes to (in addition to the Socket.IO broadcast). The guest tracking page uses `EventSource` (native browser SSE) to receive updates — no Socket.IO client needed for guests.

The customer portal continues to use Socket.IO (with room scoping from A3 or filter logic from A2) for bidirectional capability (future: cancel order, add notes, etc.). The SSE endpoint is deliberately read-only.

On the server, `router.render` is refactored to call a shared `notifyOrderUpdate(order)` function that both `io.emit('order:update', ...)` and `eventEmitter.emit('order-status', order)`.

**Key Design Decisions:**
- SSE is simpler than WebSocket for the guest case — no handshake overhead, auto-reconnect, works through HTTP proxies
- Guest page connects SSE on mount, disconnects on unmount — no singleton needed
- Customer portal reuses the existing Socket.IO infrastructure with possible room scoping
- EventEmitter must be shared between `router.render` and the SSE route — requires extracting `createOrderNotifier()` from `server.js`

**Trade-offs:**
- (+) SSE is significantly simpler client-side — `new EventSource(url)` with no library
- (+) Guests don't need to load the `socket.io-client` bundle (~20KB gzipped)
- (+) Two-tier architecture: lightweight for guests, full-duplex for customers
- (-) Server becomes more complex — two real-time transports to maintain
- (-) SSE has connection limits per domain (6 per browser), though unlikely to hit for tracking pages
- (-) SSE is unidirectional only — guests cannot send data (fine for tracking, but limits future interactivity)
- (-) `EventSource` doesn't support POST or custom headers — limits auth options

**Probability:** 0.07 (diverse — unconventional to split transport per audience)  
**Complexity:** Medium (server-side event emitter refactor, SSE route, 2 client connection strategies)  
**Risks:** Browser SSE connection limits; proxy/browser compatibility (no IE); dual transport maintenance burden

---

### Approach A6 — Embeddable Widget SDK (Diverse)

**Summary:** Build the tracking UI as a framework-agnostic Web Component that can be embedded anywhere — in a separate HTML page, an iframe on a delivery aggregator, or directly into the ERP. Supports API-polling and optional WebSocket.

**Description:**  
Create a self-contained `<order-tracker order="42">` Web Component built with Lit or a vanilla custom element. The component encapsulates: a text input (if no order attribute), a status timeline, auto-updating labels, and the complete tracking UI. It communicates with the server via a REST API (polling every 10s) and optionally upgrades to WebSocket if `socket.io-client` is available on the page.

The component is built independently from the Vue app — compiled with its own Vite build into a single JS file (~8KB gzipped without WS, ~28KB with). It can be embedded in:
- The ERP itself (as a Vue-avoiding island)
- A standalone tracking page (simple `index.html` that loads `<order-tracker>`)
- Third-party delivery apps via iframe + `postMessage` for height resizing

For the Vue-based customer portal, the same component is imported as a custom element via Vue's `defineCustomElement` or used directly as a Vue SFC. The portal adds order history (a table of past orders) that links to individual tracker instances.

**Key Design Decisions:**
- Web Component uses Shadow DOM for style isolation — the industrial palette is compiled into the bundle
- Polling is the default transport; WebSocket is an opt-in enhancement (attribute `ws-enabled`)
- The bundle exposes a simple API: `OrderTracker.attach('#el', { order: '42' })` for non-JS-framework pages
- Server-side: the existing REST API is sufficient — no changes needed for the polling path

**Trade-offs:**
- (+) Maximum portability — embed in any page, any framework, any context
- (+) Style isolation via Shadow DOM — no CSS conflicts with parent pages
- (+) Framework-agnostic — not coupled to Vue at all
- (-) Web Component + Shadow DOM means no reuse of existing Vue components — complete rebuild of the tracking UI
- (-) Polling is the default (less real-time feel unless WS is loaded)
- (-) Considerably higher initial build complexity — separate package, separate build pipeline
- (-) The customer portal becomes a consumer of the widget rather than native Vue — awkward integration

**Probability:** 0.06 (diverse — unconventional architecture choice for a Vue codebase)  
**Complexity:** High (separate build, Web Component dev, dual-transport, postMessage bridge)  
**Risks:** Shadow DOM breaks PrimeVue/Tailwind utility classes; bundle size if including socket.io-client; maintenance burden of a parallel UI toolkit

---

## 4. Diversity Verification

| Dimension | A1 | A2 | A3 | A4 | A5 | A6 |
|-----------|----|----|----|----|----|----|
| Auth model | None | localStorage PIN | JWT | Token-based | None (guest) / JWT (cust) | None |
| Transport | WS (existing) | WS (existing) | WS rooms / Polling guest | WS | SSE (guest) / WS (cust) | Polling / optional WS |
| Data model change | None | customerId | customerId + customers | trackingToken | None | None |
| Server change | None | None | Major (auth, rooms) | Minor (token gen) | Medium (SSE endpoint) | None |
| Target audience | Guest only | Guest + Customer | Guest + Customer | Guest only | Guest + Customer | Any embedder |
| Route model | Public (no layout) | Public + AppLayout | Public + AppLayout + guards | Public (no layout) | Public + AppLayout | External (no routes) |
| Style reuse | Full | Full | Full | Full | Full | None (Shadow DOM) |
| Complexity | Low | Medium | High | Low-Medium | Medium | High |

Approaches span the solution space: A1–A3 are conventional (high probability), A4–A6 explore diverse mechanisms (token routing, transport split, embeddability). All six are genuinely different — no two share the same combination of auth model, transport strategy, and architecture pattern.

---

## 5. Comparison Summary

| | A1 (Guest Lookup) | A2 (Dual + PIN) | A3 (Full Auth + Rooms) | A4 (Token) | A5 (SSE/WS Split) | A6 (Widget) |
|--|---|---|---|---|---|---|
| **Probability** | 0.85 | 0.82 | 0.85 | 0.08 | 0.07 | 0.06 |
| **Complexity** | Low | Medium | High | Low-Med | Medium | High |
| **Files changed** | 3–4 | 5–7 | 10+ | 4–5 | 6–8 | 8–10 |
| **Server changes** | None | None | Major | Minor | Medium | None |
| **Real-time quality** | Excellent (WS) | Excellent (WS) | Excellent (WS rooms) | Excellent (WS) | Good (SSE) / Excellent (WS) | Moderate (polling) |
| **Privacy** | Poor (guessable) | Poor (PIN) | Good (JWT) | Good (token) | Good (JWT) | Moderate (token) |
| **Evolvability** | Low (dead-end) | Medium | High | Medium | Medium | Low (parallel) |
| **Codebase alignment** | High | High | Medium | High | Medium | Low |

**Recommendation for next step:** A1 is the fastest path to deliver guest tracking (zero server changes, 3 new files). A2 adds the customer portal with minimal auth. A3 is the correct long-term architecture but is over-engineered for the current json-server dev environment. A pragmatic MVP sequence would be **A1 → A2 → migrate to A3** once a real backend (Postgres/Express) replaces json-server.
