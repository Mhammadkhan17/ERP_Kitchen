# Customer Live Order Tracking — Design Approaches

**Date:** 2026-07-15  
**Context:** Cloud Kitchen ERP (Vue 3 + Vite + UnoCSS + PrimeVue 4 + TanStack Vue Query 5 + Pinia 2 + Socket.IO + json-server)  
**Goal:** Enable customers to track orders in real-time — both via a public order-number lookup and a logged-in portal.

---

## 1. Problem Decomposition

### Core problem
Guests and registered customers lack visibility into their order status. Kitchen staff use a KDS to advance orders through `pending → preparing → ready → dispatched` but those status changes are invisible outside the internal dashboard.

### Subproblems any solution must address
| # | Subproblem | Key tension |
|---|---|---|
| P1 | **Guest lookup** — unauthenticated user enters order number, sees live status | No auth → data access control |
| P2 | **Customer portal** — logged-in user sees all their past/present orders | No auth system exists at all today |
| P3 | **Real-time push** — status changes appear without page refresh | Current `order:update` broadcasts *all* orders to *all* clients |
| P4 | **Server integration** — status mutations happen via KDS (PATCH /orders/:id) | Server broadcast is global, no room concept |
| P5 | **Routing & navigation** — where do these pages live? | Current layout assumes internal staff (AppDrawer, AppLayout) |
| P6 | **Data model** — orders lack a customer identifier filterable by end-user | `Order.customerName` is free-text, not a foreign key |

### Evaluation criteria
1. **Minimal server changes** — json-server + Socket.IO is a thin prototype layer; heavy server refactors risk fragility
2. **Reuse of existing patterns** — singleton socket, composable patterns, UnoCSS shortcuts, palette
3. **Security boundary** — guest lookup must not expose other customers' orders
4. **Developer ergonomics** — clear module boundary, type-safe, testable
5. **Incremental deployability** — can ship guest tracking before customer portal (or vice versa)

---

## 2. Solution Space Dimensions

| Dimension | Spectrum |
|---|---|
| **Socket architecture** | Single global broadcast → Client-side filtering → Server-scoped rooms → Separate connection per domain |
| **Auth model** | No auth (public order number) → Simple token (email link or order secret) → Full auth system |
| **Data retrieval** | API query on page load → WebSocket-only → Polling fallback |
| **Module placement** | New top-level route family → Inside existing AppLayout → Standalone page outside layout |
| **Customer identity** | `customerName` string match → `customerId` foreign key → `orderToken` secret per order |
| **SSR / static delivery** | SPA-only → Static order status badge (embed) → Server-rendered widget |

---

## 3. Proposed Approaches

---

### Approach A — "Composable Overlay" (High Probability, ~0.85)

**Summary:** Reuse the existing singleton Socket.IO connection. Filter the global `order:update` broadcast client-side. Add a lightweight `useCustomerOrders` composable that filters by order number or a local-storage token. Guest page and portal are new route entries *outside* the internal AppLayout.

**Details:**
- Two new routes registered at the router root (not under AppLayout):
  - `/track` — guest lookup page (InputText for order number + live status card)
  - `/portal` — customer portal page (list of orders for the stored customer token)
- Create `src/modules/tracking/composables/useCustomerOrders.ts` which:
  - Calls `api.orders.list()` on mount and filters client-side to orders matching the tracked order number(s) or customer identifier
  - Listens to the same `order:update` events (via the existing singleton from `useOrderFeed.ts`) and updates local reactive state when the payload matches a tracked ID
- Guest tracking stores the order number in `useStorage` (vueuse-style, or just localStorage) so page refresh persists it
- Customer portal uses a simpler identity: a `customerId` field added to the Order type and seeded in `db.json`; customer "registration" is just storing this ID in localStorage (no real auth)
- Orders API extends `api.orders.list()` with optional query param `?customerId=X` (json-server supports this natively)
- New module folder: `src/modules/tracking/` with views `OrderTracking.vue` and `CustomerPortal.vue`, components `StatusTimeline.vue` and `OrderCardCompact.vue`
- Palette and card patterns match existing KDS components exactly

**Key decisions:**
- No server-side Socket.IO changes — filtering is entirely client-side
- No real auth system — a pragmatic "informational" model where the barrier to guessing order numbers is the randomness of the ID (uuid-like)
- Reuse the existing `useOrderFeed` singleton; the connection lifecycle is already managed
- Query param filtering for `customerId` reuses json-server's built-in query support

**Trade-offs:**
| Gain | Sacrifice |
|---|---|
| Zero server changes beyond seeding data | Client receives *all* order updates (bandwidth waste) |
| Reuses existing socket singleton perfectly | No real security — anyone who guesses an order ID can track it |
| Can ship in hours, not days | `customerId` filtering via json-server means no pagination or server-side search |
| Follows existing conventions exactly | No scalability to thousands of concurrent customers |

**Complexity:** Low (2 views, 1 composable, 1 module folder, no server changes)  
**Risks:**
- If the order feed grows to hundreds of orders, every client receives all updates — mobile data concern
- No real auth means this is suitable only as an MVP / internal demo; production would need a token mechanism

---

### Approach B — "Dedicated Customer Socket" (High Probability, ~0.80)

**Summary:** Create a *second* singleton Socket.IO connection dedicated to customer-facing features, separate from the KDS connection. The server adds a `customer:order:update` event that scopes broadcasts to relevant data. Guest and portal pages use this dedicated connection.

**Details:**
- Add `useCustomerFeed.ts` composable in `src/modules/tracking/composables/` that creates its own Socket.IO singleton (same connection URL, same server) but listens to `customer:order:update` instead of `order:update`
- Server-side: in `server.js` `router.render`, add a second `io.emit('customer:order:update', { ... })` alongside the existing `order:update` — or alternatively emit a richer payload that includes customer information
- The dedicated socket can send an `identify` event on connect with a customer ID / order number, allowing future server-side filtering (preparation for Approach C)
- Guest tracking uses this dedicated socket; when `customer:order:update` arrives with a matching order number, the UI updates
- Both sockets can coexist — the KDS singleton remains untouched
- Add `api.orders.getByNumber(orderNumber: number)` to the API client for initial lookup

**Key decisions:**
- Separate socket = separate concern, cleaner lifecycle
- Server sends two events from the same `router.render` interceptor (no need for room support yet)
- The `identify` mechanism is a future hook for server-side filtering without breaking current behavior

**Trade-offs:**
| Gain | Sacrifice |
|---|---|
| Customer traffic is logically isolated from KDS traffic | Two WebSocket connections per browser tab (negligible overhead) |
| Can evolve to server-side filtering without touching KDS code | Duplicates socket setup logic (some shared code possible) |
| Customer events can carry different payload shape than KDS events | Slightly more bytes per status change (second emit) |
| Cleaner unload — can disconnect customer socket when leaving tracking pages | Higher cognitive overhead for maintainers |

**Complexity:** Medium (new composable, server change in one place, new API method)  
**Risks:**
- Two socket connections from the same page may trigger browser limits in edge cases (though unlikely at 2)
- Server double-emit means 2× the Socket.IO traffic per order update

---

### Approach C — "Server-Scoped Rooms" (High Probability, ~0.82)

**Summary:** Add Socket.IO room support on the server. When a client connects, it joins a room scoped to either a specific order ID or a customer ID. The server emits `order:update` only to the relevant room(s). This is the architecturally "correct" solution.

**Details:**
- Server (`server.js`): add a `join` event handler where the client sends `{ room: 'order:ord-001' }` or `{ room: 'customer:customer-xyz' }`
- In `router.render`, emit to the specific room instead of (or in addition to) the global broadcast:
  ```js
  io.to(`order:${order.id}`).emit('order:update', payload)
  if (order.customerId) {
    io.to(`customer:${order.customerId}`).emit('order:update', payload)
  }
  ```
- Client-side `useCustomerFeed.ts`:
  - After connecting, emits `join` with the appropriate room
  - Guest: joins `order:${orderId}` after successful lookup
  - Portal: joins `customer:${customerId}` after "login"
- The existing KDS dashboard continues to receive the global broadcast (no change needed)
- Orders need a `customerId` field — seed this in `db.json` alongside `customerName`; add `Order.customerName` is kept for display
- API client gains `orders.getByNumber(n)` for the guest lookup initial fetch

**Key decisions:**
- Rooms are the idiomatic Socket.IO pattern for scoped broadcasts
- The existing KDS clients *do not* join rooms — they rely on the global emit (backward compatible)
- Guest access is still unauthenticated but scoped to a single order — an attacker would need both the order ID and the order number, reducing the guessing surface

**Trade-offs:**
| Gain | Sacrifice |
|---|---|
| Clients receive only relevant events — scalable to thousands | Requires server change (moderate complexity) |
| Security boundary is enforced server-side | Existing KDS broadcast is *also* global — dual broadcast pattern |
| Follows Socket.IO best practices | Needs client-side room join logic after initial data fetch |
| Natural foundation for future auth (validate room join) | json-server has no concept of Socket.IO — logic lives in server.js only |

**Complexity:** Medium (server room logic, client join logic, data model migration)  
**Risks:**
- If the KDS ever needs to migrate from global broadcast to rooms, both systems need updating
- Room join order dependency: must fetch order data first, then join room — potential race if status changes between the fetch and the join

---

### Approach D — "Polling-First, Progressive Enhancement" (Low Probability, ~0.08)

**Summary:** The customer tracking feature works primarily via HTTP polling. WebSocket is a progressive enhancement that upgrades the experience when available. This minimizes server and client complexity by leaning on the existing json-server REST API.

**Details:**
- Guest tracking page:
  - User enters order number → `GET /orders?orderNumber=X` (json-server supports this)
  - Display order details with a `refetchInterval` of 5 seconds (TanStack Vue Query)
  - Status timeline component renders based on `Order.timestamps`
- Customer portal:
  - `GET /orders?customerId=X` with 5-second polling
  - Orders are returned as a sorted list
- WebSocket enhancement:
  - If the singleton socket is connected, the polling interval reduces to 30 seconds, and the `order:update` listener (client-side filtered) updates the UI in real-time
  - If the socket disconnects, fall back to 5-second polling
- This is a "graceful degradation" approach — the feature works without WebSocket at all

**Key decisions:**
- No new server features beyond what json-server provides natively
- TanStack Vue Query already has `refetchInterval` as a first-class API — this is the path of least resistance
- WebSocket is purely additive; the UI has a connection indicator showing "live" vs "polling"

**Trade-offs:**
| Gain | Sacrifice |
|---|---|
| Works with zero server changes (beyond seeding data) | 5-second polling is not truly "real-time" — defeats the purpose of the feature for demanding users |
| Incredibly simple — 2 views + 1 composable | Bandwidth cost of repeated polling (still lower than Approach A's full broadcast for many orders) |
| Falls back gracefully if WebSocket fails | Polling every 5s per customer could hammer json-server at scale |
| Can be built and tested independently of WebSocket | Undermines the stated requirement of "real-time" |

**Complexity:** Low (reuses only existing patterns — query, polling, no socket changes)  
**Risks:**
- Users may perceive the feature as "not live" — the gap between polling interval and actual status change creates confusion
- Mobile users may drain battery with aggressive polling
- json-server has no caching — each poll reads the full JSON file

---

### Approach E — "Embeddable Widget / Micro-Frontend" (Low Probability, ~0.05)

**Summary:** Build the customer tracking feature as a lightweight, self-contained embeddable widget that can be dropped into external delivery partner portals (Zomato, Swiggy, Uber Eats) or a standalone HTML page. The widget communicates via a minimal REST + SSE channel, completely decoupled from the main SPA.

**Details:**
- A standalone HTML page at `/track.html` (or a separate tiny Vite entry) that:
  - Contains its own minimal Vue 3 app or even vanilla JS
  - Uses Server-Sent Events (SSE) via an `EventSource` to `/api/track/:orderId/stream`
  - Makes initial `GET /api/orders?orderNumber=X` for the full order payload
- Server-side: add a new express route in `server.js` before `json-server.router`:
  ```js
  app.get('/track/:orderId/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    // Listen for order:update events from io and write SSE
    const listener = (payload) => {
      if (payload.id === req.params.orderId) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`)
      }
    }
    io.on('order:update', listener)
    req.on('close', () => io.off('order:update', listener))
  })
  ```
- The widget is designed to be iframe-embedded by delivery partners: a `<script src="https://cloudkitchen.example.com/widget/track.js" data-order="ORDER_NUMBER">` that renders a small status badge
- The main SPA's `/track` and `/portal` pages are completely separate concerns

**Key decisions:**
- SSE over Socket.IO for the widget because: (a) no client library needed, (b) works through iframes and third-party contexts more reliably, (c) one-way data flow suits tracking perfectly
- Widget is a separate deployment artifact — it does not share the SPA bundle
- The main SPA's customer portal still uses Socket.IO (bidirectional for potential future interactions like re-ordering)

**Trade-offs:**
| Gain | Sacrifice |
|---|---|
| Delivery partners can embed the widget via iframe/script tag | Significantly more dev work — two separate build pipelines, two codebases to maintain |
| SSE is simpler than Socket.IO for one-way push | Widget styling must be self-contained (shadow DOM or iframe) — cannot reuse PrimeVue components |
| Decouples customer tracking from the main SPA's lifecycle | Widget needs its own API layer, its own error handling, its own a11y |
| Opens a product avenue (partner integrations) | Increases the surface area: new server routes, new client entry, new testing |

**Complexity:** High (new build entry, new server routes, widget packaging, SSE handling)  
**Risks:**
- iframe CORS and cookie-sharing issues with third-party delivery partners
- Maintaining UI consistency between the widget and the SPA portal is difficult
- The SSE endpoint bypasses json-server entirely — data consistency logic must be duplicated or the SSE endpoint must read from db.json directly

---

### Approach F — "Reactively Scoped Pinia Store" (Low Probability, ~0.07)

**Summary:** Build the entire customer tracking system around a Pinia store that manages the "tracked orders" set. The store wraps both the REST fetch and the WebSocket listener. Route guards and component reactivity emerge from the store's state. No new socket connections, no server changes.

**Details:**
- Create `src/modules/tracking/stores/orderTrackingStore.ts`:
  ```ts
  export const useOrderTrackingStore = defineStore('orderTracking', () => {
    const trackedIds = ref<Set<string>>(new Set())
    const orders = ref<Map<string, Order>>(new Map())
    const customerId = ref<string | null>(localStorage.getItem('cid'))

    function trackOrder(orderNumber: number) { /* fetch + add to trackedIds */ }
    function setCustomer(id: string) { /* fetch all orders + store cid */ }
    function handleSocketUpdate(payload: SocketUpdate) { /* update map */ }

    // Subscribe to singleton socket internally
    // Expose computed sorted orders, current status, etc.
    return { trackedIds, orders, customerId, trackOrder, setCustomer }
  })
  ```
- The store initializes a listener to the existing singleton `order:update` event (by calling `useOrderFeed` internally or by importing the socket directly) and filters by `trackedIds`
- Two views consume the store:
  - `OrderTracking.vue` — shows `orderTrackingStore.orders.get(id)` for the tracked order
  - `CustomerPortal.vue` — shows all orders filtered by `customerId` (client-side filter from the full list fetch)
- Guest tracking writes the order ID to the store; a `watch` persists tracked IDs to localStorage so the tracking survives page refresh
- No server changes needed — all logic is reactive store management

**Key decisions:**
- Pinia stores are the "state hub" pattern — the store manages WebSocket subscription lifecycle centrally
- The store uses `useOrderFeed`'s socket internally (module-level import of the socket instance), avoiding the need for a second connection
- `customerId` is a simple localStorage string — sufficiently "authenticated" for an MVP
- The store's `handleSocketUpdate` is called from the global `order:update` listener; it checks if the updated order ID is in `trackedIds` before updating the map

**Trade-offs:**
| Gain | Sacrifice |
|---|---|
| Single source of truth for tracking state | Store couples WebSocket logic with UI state — harder to test |
| Zero server changes | Receives all order updates on the socket (same bandwidth concern as A) |
| Pinia devtools support for debugging | Store could grow into a "god object" if tracking features expand |
| Natural Vue reactivity — no manual invalidation | Cannot scope to customerId on the server — all orders are fetched and filtered client-side |
| Trivially composable with existing TanStack Query | TanStack Query cache and Pinia store could conflict if both hold order data |

**Complexity:** Low-Medium (1 store, 2 views, import existing socket, no server changes)  
**Risks:**
- The store's implicit dependency on the singleton socket makes it fragile if the socket connection lifecycle changes
- If the user tracks multiple orders, the initial fetch for each is N separate API calls
- No server-side pagination — all orders are loaded client-side if customer has many past orders

---

## 4. Diversity Verification

| Dimension | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| Socket architecture | Shared singleton | Dedicated socket | Scoped rooms | None (poll) | SSE new route | Shared singleton |
| Server changes | None | +1 emit line | Rooms + join | None | New SSE route | None |
| Auth model | None | None | Order-level scoping | None | None | None |
| Data retrieval | Query + WS | Query + WS | Query + WS | Polling | SSE stream | Query + WS |
| Module placement | Outside AppLayout | Outside AppLayout | Outside AppLayout | Outside AppLayout | Standalone widget | Outside AppLayout |
| Customer identity | Order number | Order number/customerId | customerId FK | Order number | Order number | Order number/customerId |
| Reuse of existing | High (socket) | Medium (2 sockets) | Medium (rooms API) | High (TanStack Query) | Low (new pipeline) | High (Pinia + socket) |
| Real-time quality | True real-time | True real-time | True real-time | Near-real-time (5s) | Real-time (SSE) | True real-time |

All six approaches genuinely differ on multiple dimensions. Approaches A, B, C, and F form a cluster around "real-time + minimal server changes" but diverge on socket architecture. D and E explore fundamentally different trade-offs (polling-first and embeddable widget respectively).

---

## 5. Recommendation Path

| Phase | Approach | Rationale |
|---|---|---|
| **MVP (ship today)** | **A (Composable Overlay)** | Zero server changes, follows existing patterns perfectly, can be built in hours. |
| **Phase 2 (scale)** | **C (Server-Scoped Rooms)** | Adds security boundary and bandwidth efficiency; rooms are a natural evolution from the client-filtered approach. The room join logic can be added to the composable without changing the views. |
| **Phase 3 (embed)** | **E (Embeddable Widget)** | Only if delivery partner integration becomes a business requirement. The SSE endpoint can share the room-scoped events from Phase 2. |

The key insight: start with client-side filtering (A), then add server-side scoping (C) as traffic grows, then consider widget embed (E) for partner distribution. Each phase is incremental and backward-compatible.
