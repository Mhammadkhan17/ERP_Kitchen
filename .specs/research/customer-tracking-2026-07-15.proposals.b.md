# Customer Live Order Tracking — Proposals (Set B)

**Date**: 2026-07-15
**Context**: Cloud Kitchen ERP — Vue 3 + Vite + UnoCSS + PrimeVue 4 + TanStack Vue Query 5 + Socket.IO + json-server

---

## 1. Problem Decomposition

### Core Problem
A customer (guest or logged-in) needs to see their order's live status without needing internal dashboard access. Status changes originate from the KDS workflow (staff marking orders as `preparing` → `ready` → `dispatched`).

### Key Constraints
- **No auth system** exists: no login page, no guards, no auth store, no customer concept
- **WebSocket is global**: server broadcasts `order:update` to all connected clients — no room scoping
- **Public page must be standalone**: cannot inherit AppLayout (internal nav/branding)
- **Existing routes are flat** under AppLayout with auto-redirect to `/kds`
- **Vite proxy** rewrites `/api` → `localhost:3001`; no backend auth layer
- **Order data model** lacks any customer identifier beyond `customerName` (string, not relational)
- **Singleton Socket.IO** pattern in `useOrderFeed.ts` — module-level singleton, not composable-per-component

### Subproblems Any Solution Must Address
| # | Subproblem | Description |
|---|-----------|-------------|
| P1 | Guest lookup | How does an anonymous user find their order? (order number, phone, email, QR) |
| P2 | Real-time scoping | How does a client receive only its own order's updates without leaking others' data? |
| P3 | No customer identity | `customerName` is a flat string; no user accounts, no `customerId` on orders |
| P4 | Router architecture | Public routes must live outside AppLayout; need a clean split between internal/public |
| P5 | KDS integration | KDS already broadcasts `order:update`; tracking must piggyback without breaking KDS |
| P6 | Singleton collision | `useOrderFeed` creates one global socket; public page shares or forks it? |

### Evaluation Criteria
- **Simplicity** — lines of new code, conceptual overhead, server changes required
- **UX quality** — perceived latency, status clarity, error handling when order not found
- **Security** — can customer A see customer B's order? Can they enumerate orders?
- **Implementation cost** — files touched, server.js changes, new dependencies, migration effort
- **Future-proofing** — does the approach scale to multi-brand, multi-outlet, or mobile push later?

---

## 2. Solution Space Map

### Major Dimensions

```
  Scoping             Identity           Lookup UX             State Persistence
  ─────────           ─────────          ──────────            ─────────────────
  client-filter   ◄──►  anonymous    ◄──►  form + order#   ◄──►  none (stateless)
  room-based      ◄──►  phone/OTP    ◄──►  direct URL path ◄──►  URL query param
  customer-based  ◄──►  email link   ◄──►  QR scan        ◄──►  localStorage
  SSE per-order   ◄──►  full auth    ◄──►  email lookup    ◄──►  Pinia store
  polling         ◄──►  token only   ◄──►  auto-detect     ◄──►  session cookie
```

### Trade-off Axes

| Axis | Lean Left (simpler) | Lean Right (more robust) |
|------|--------------------|--------------------------|
| Server changes | None (client filters) | Room scoping, token gen, event sourcing |
| Security | Order number is the key | Tokens, OTP, auth walls |
| Real-timeness | Polling (3s) | Persistent WebSocket / SSE |
| Identity depth | Guest only | Guest + light customer portal |
| Scaling cost | O(n) clients read all events | O(n) clients read 1 event each |

---

## 3. Approach A — Anonymous Order Lookup + Client-Side Filtering

**Summary**: Guest enters order number on a public page → REST fetch resolves the order → existing global WebSocket broadcasts all events but the client filters client-side for its order ID only.

### Description
The minimal-change approach. A new public route `/track` renders a two-state view: (1) a search form where the user types their order number, and (2) a tracking view that shows the order's current status, items, and a visual timeline. The tracking view connects to the *existing* singleton WebSocket via `useOrderFeed`. On each `order:update` event, a local composable filters by the tracked order's ID and updates only the tracked order's reactive state. No server changes to server.js at all.

The composable `useOrderTracker(orderId)` is created, which:
1. Calls `api.orders.list()` or a new `api.orders.getByNumber(number)` to resolve the order
2. Calls `useOrderFeed()` to get the singleton socket reference
3. Registers a local listener on `order:update` that checks `payload.id === orderId.value`
4. Returns a reactive `Order | null` and status indicators

For the customer portal, a light Pinia store (`useCustomerStore`) stores a list of "tracked" order numbers in localStorage. The portal page at `/portal` shows all tracked orders with live updates from the same global socket.

### Key Design Decisions
- **No server.js changes** — fastest path, zero risk to KDS stability
- **Singleton socket is shared** — public and KDS pages use the same connection; `onUnmounted` does not disconnect
- **Order number as identifier** — maps to existing `orderNumber` field; no new fields needed
- **localStorage as "customer session"** — no backend auth, orders are re-fetched on page load
- **Client-side filter is an `onMounted`/`onUnmounted` pair** — composable adds/removes a local event handler

### Trade-offs
| Gain | Sacrifice |
|------|-----------|
| Zero server changes | Every public client receives all order updates (bandwidth waste) |
| Reuses existing patterns entirely | If order numbers are sequential/predictable, anyone can watch any order |
| Ships in hours, not days | "Customer portal" is just a list of tracked numbers — no real identity |
| No new dependencies | No way to push updates to a customer who hasn't visited the page yet |

### Probability: 0.85
### Complexity: Low (~5 files: 1 route, 2 views, 1 composable, 1 store)

### Risks
- **Security by obscurity**: order numbers are sequential (2001, 2002…). An adversary could iterate to watch any order. Mitigation: use the order UUID (`id`) in the URL instead of `orderNumber`, but the UX is worse.
- **Bandwidth waste**: if 1000 customers watch their orders, the server broadcasts 1000× the same data on each status change. Socket.IO's binary overhead is low, but HTTP polling for the initial page load is not affected.
- **Singleton listener leak**: if the composable adds a listener to the singleton socket but doesn't remove it on unmount, tracked orders pile up. Mitigation: explicit `onUnmounted` cleanup.

---

## 4. Approach B — Anonymous Order Lookup + Server-Side Room Scoping

**Summary**: Same guest UX as A, but the server now supports Socket.IO rooms per order. The client emits a `subscribe:order` event → server joins the socket to a room → server broadcasts updates only to that room's members.

### Description
A more architecturally sound approach. The public page is identical to Approach A (form → tracking view), but the WebSocket layer is smarter:

**Server changes** (`server.js`):
- Listen for `subscribe:order` events with `{ orderId: string }`
- Join the socket to room `order:<orderId>`
- In `router.render`, after `io.emit('order:update', ...)` (global broadcast for KDS), also emit to `io.to(room).emit('order:update', payload)`

**Client changes**:
- `useOrderTracker` composable, after resolving the order, emits `subscribe:order { orderId }` on the socket
- Listens only for `order:update` events (no client-side filtering needed — the room ensures only relevant events arrive)
- On unmount, emits `unsubscribe:order { orderId }` to leave the room

The customer portal reuses the same pattern: tracking multiple orders means subscribing to multiple rooms.

### Key Design Decisions
- **Dual broadcast**: global broadcast preserved for KDS; room-scoped broadcast added for customers
- **No auth token** on subscribe — any client can request any room; security relies on order ID being non-trivial to guess
- **Order ID (`ord-xxx`) is the room key** — room names are opaque UUIDs, not sequential numbers
- **Server tracks room membership** — Socket.IO's built-in room management; no additional data structures

### Trade-offs
| Gain | Sacrifice |
|------|-----------|
| Clients only receive relevant events | Server.js changes required (tested, but risk to existing broadcast) |
| Scales better than client-filtering (O(updates) not O(clients)×O(updates)) | Slightly more complex protocol (subscribe/unsubscribe lifecycle) |
| Order ID as room key provides mild security (UUIDs unguessable) | Public tracking URL exposes order UUID — same leak surface as A if UUID is in the URL |
| Room cleanup is automatic (Socket.IO leaves rooms on disconnect) | Must handle edge case: client subscribes before order exists in db.json |

### Probability: 0.82
### Complexity: Medium (~7 files: server.js changes + 1 route, 2 views, 1 composable, 1 store)

### Risks
- **Server.js regression**: modifying `router.render` could break existing KDS broadcasts. Mitigation: leave the global `io.emit` untouched and add a second scoped emit.
- **Room memory**: if clients subscribe but never disconnect (zombie tabs), room membership grows unbounded. Socket.IO handles this gracefully on disconnect, but abrupt tab closes have a ~60s ping timeout window.
- **No authentication on subscribe**: a malicious client could subscribe to any order UUID if they can guess it. Since order UUIDs are unguessable (`ord-xxx` with random suffix), this is low risk, but not zero.

---

## 5. Approach C — Phone-Based Customer Identity with Pinia Store

**Summary**: Adds a lightweight customer identity layer. Customer enters phone number → receives OTP (simulated) → a Pinia store holds their session → they can see a full order history with live updates, not just one order at a time.

### Description
This approach introduces a customer concept without a full auth system. The flow:

1. **Customer credentials**: phone number (OTP simulated via console.log or a dev-only `/api/otp` endpoint)
2. **Backend**: db.json gains a `customers` resource with `{ id, phone, name, orderIds[] }`. Orders get a `customerId` field.
3. **Frontend**: new Pinia store `useCustomerStore` with `session: { customerId, phone } | null` backed by localStorage
4. **Portal page** at `/portal`: shows all orders belonging to the logged-in customer. Each order card has live status via WebSocket room scoping (room = `customer:<customerId>`).
5. **Guest tracking** still exists at `/track` for one-off lookups without login

Server changes:
- `router.render` emits to both the global room (KDS) and `customer:<order.customerId>` room
- On connection, if the socket provides an `auth.customerId`, auto-join to `customer:<customerId>`
- New endpoint `GET /customers/:id/orders` to return all orders for a customer

### Key Design Decisions
- **Phone-based OTP avoids password management** — minimal friction, no password reset flow
- **Customer orders by `customerId`** — relational join, not text search on `customerName`
- **Pinia store + localStorage** = session persists across refreshes without a backend token
- **Room per customer** means one WebSocket connection receives updates for all that customer's orders
- **Guest tracking remains independent** — `/track` does not require login

### Trade-offs
| Gain | Sacrifice |
|------|-----------|
| Full order history, not just one order | Requires new `customers` resource in db.json |
| Customer identity enables future features (favorites, reorder, loyalty points) | OTP flow adds complexity (even if simulated) |
| Room per customer is more scalable than room per order | Existing orders lack `customerId` — data migration needed |
| Portal feels like a real product feature | Auth store is new pattern in codebase; no auth guards exist yet |

### Probability: 0.80
### Complexity: High (~12 files: db.json schema changes, server.js changes, store, 2 routes, 3 views, composable, OTP component)

### Risks
- **Simulated OTP** is not real auth — customers could enter any phone and see those orders. In production, OTP would need Twilio/msg91 integration, but for this scope, `console.log` suffices.
- **Data migration**: 12 existing orders don't have `customerId`. Either assign a default "walk-in" customer or make `customerId` optional and allow guest tracking.
- **Feature creep**: phone-based identity invites wanting profile pages, saved addresses, order history filters — scope must be held.

---

## 6. Approach D — QR-Code-First Embedded Token (Low Probability)

**Summary**: Each order gets a unique short tracking token on creation. The QR code printed on the receipt/packaging encodes `/track/<token>`. Customer scans → lands directly on the tracking page. No form, no phone, no identity.

### Description
The polar opposite of Approach A's form-first UX. The assumption: the kitchen prints receipts or stickers for packaging. Each receipt carries a QR code. The QR contains the tracking URL with a unique token.

**Server changes**:
- `router.render` auto-generates a `trackingToken` (8-char nanoid) for new orders: `order.trackingToken = nanoid(8)`
- Token is stored in db.json alongside the order
- New endpoint `GET /orders?trackingToken=<token>` (json-server query) or `GET /tracking/<token>` that returns the order
- Socket.IO room per token: `io.to(`track:${token}`).emit(...)`

**Frontend**:
- Route `/track/:token` — no form, immediate resolution
- On mount, extracts token from URL, calls API to resolve order
- Subscribes to WebSocket room via `subscribe:tracking { token }`
- Shows live timeline

**QR generation**: handled at order creation time (could be a URL like `https://cloudkitchen.example/track/abc12345`). The token is also displayed as text on the receipt for customers who can't scan.

### Key Design Decisions
- Token space: 8 chars of base62 = ~218 trillion combinations — unguessable
- No customer identity at all — the token IS the auth
- QR eliminates friction (scan, done), but text fallback is needed
- Token can be used for multi-order tracking (same token for all items in a catering order)

### Trade-offs
| Gain | Sacrifice |
|------|-----------|
| Zero-friction UX — scan and watch | Requires QR on every receipt/packaging |
| Token is cryptographically unguessable (unlike order number) | Lost receipt = lost tracking (no recovery without customer support) |
| No form, no login, no OTP | Each order is isolated — no "my orders" list without collecting tokens |
| Token generation is cheap | Need a new dependency (nanoid) or manual UUID truncation |
| Can be combined with any identity approach later | Initial implementation requires both server and frontend work |

### Probability: 0.08
### Complexity: Medium (~6 files: server.js changes, new route, tracking view, QR utility composable)

### Risks
- **QR dependency**: generating QR codes client-side requires `qrcode` npm package or a canvas-based lib. The print system may not support it.
- **Receipt assumption**: if this cloud kitchen doesn't print receipts (digital-only, WhatsApp orders), QR is useless.
- **Token collision**: 8-char nanoid has collision risk at ~1% with 4M tokens. Mitigation: use 12 chars.
- **Offline tracking**: if the customer loses network after loading the page, they miss updates. PWA service worker could cache the last known status.

---

## 7. Approach E — Event Sourcing with SSE Fallback (Low Probability)

**Summary**: Abandons WebSocket for public tracking entirely. The server maintains an append-only event log for each order. Public page connects via Server-Sent Events (SSE). Internal KDS continues using WebSocket. Two parallel real-time systems.

### Description
A fundamentally different architectural choice. Instead of a single WebSocket bus for everyone, split the real-time layer:

**Internal (KDS)**: unchanged — Socket.IO, global broadcasts, room scoping.

**Public (tracking)**: pure SSE via `EventSource` API:
- Server maintains an in-memory event log per order: `[{ timestamp, status, message }]`
- New endpoint `GET /api/orders/:id/stream` returns SSE stream
- When staff changes order status in KDS, `router.render` pushes to both:
  1. `io.emit('order:update', ...)` (Socket.IO — KDS)
  2. The SSE event log for that order (append to in-memory `Map<orderId, EventSource[]>`) and flush to all listening SSE connections
- SSE clients auto-reconnect on network loss with `Last-Event-ID` to replay missed events

**Frontend**:
- `useOrderTrackerSSE` composable creates an `EventSource` to `/api/orders/${id}/stream`
- Parses incoming `event` and `data` fields, updates reactive order state
- On disconnect, `EventSource` auto-reconnects (browser native)
- No Socket.IO client library loaded on the public page

### Key Design Decisions
- SSE is simpler than WebSocket for one-directional server→client
- Browser-native `EventSource` — no socket.io-client dependency on public page
- SSE works through HTTP proxies and load balancers that may block WebSocket upgrade
- In-memory event log survives only the server process lifetime; db.json is the source of truth on reload
- `Last-Event-ID` header on reconnect replays missed events

### Trade-offs
| Gain | Sacrifice |
|------|-----------|
| No Socket.IO client on public page (lighter bundle) | Two real-time systems to maintain (Socket.IO + SSE) |
| SSE works through any HTTP proxy (no upgrade issues) | SSE is one-directional (server→client only); no subscribe/unsubscribe protocol |
| Browser-native reconnection with event IDs | Limited to 6 concurrent SSE connections per browser (HTTP/1.1 limit) |
| Each order stream is isolated — no cross-order leakage | Server must maintain in-memory Map of SSE response writers — memory grows with active trackers |
| Falls back gracefully to polling if SSE fails | SSE is not supported in older browsers (IE11, some mobile browsers) |

### Probability: 0.06
### Complexity: High (~10 files: server.js SSE endpoint, SSE composable, in-memory event store, route, views, test coverage)

### Risks
- **Two real-time stacks**: every future feature that needs updates must be implemented in both Socket.IO and SSE, or a decision made to deprecate one — architectural debt.
- **In-memory state**: if the server restarts, in-flight SSE connections are lost and the event log is empty. Clients reconnect and get `Last-Event-ID=0`, losing the in-progress status until the next update.
- **Connection limit**: browsers limit SSE connections to 6 per domain. A customer with 7+ tracking tabs would hit this.
- **json-server doesn't support streaming**: the SSE endpoint can't be part of json-server's router. Must be added as a custom Express middleware before `app.use(router)`, or switch to a different server.

---

## 8. Approach F — WebSocket-Less Polling with SWR Pattern (Low Probability)

**Summary**: No persistent connection for public tracking. Use TanStack Vue Query with aggressive `refetchInterval` (3 seconds) and stale-while-revalidate. The public page is just a well-crafted polling loop. Zero server changes.

### Description
The simplest possible implementation, but deliberately non-real-time. Every 3 seconds, the tracking page re-fetches the order from `api/orders/${id}`. TanStack Vue Query handles caching, deduplication, and background refetch.

**How it works**:
- `/track/:orderId` route resolves the order via `useQuery` with `refetchInterval: 3000`
- The order card and timeline update naturally when the query returns new data
- `staleTime: 0` ensures the query always fetches on interval
- No WebSocket connection at all on the public page
- The singleton socket (from `useOrderFeed`) is not imported — the public page is WebSocket-free

**Optimizations**:
- Add `?since=<timestamp>` to the API call so the server can return 304 Not Modified if nothing changed (requires server change, so optional)
- Use `keepPreviousData: true` to avoid flash of empty state on refetch
- `structuralSharing: true` (TanStack default) minimizes re-renders when data is unchanged

**For the customer portal**: same pattern — query key `['customer-orders', customerId]` with 3s refetch interval. No WebSocket, no Pinia store.

### Key Design Decisions
- **Zero server.js changes** — fastest possible implementation
- **No handshake, no connection management** — HTTP request/response is stateless
- **3s interval is the latency floor** — customer never sees changes faster than 3 seconds after they happen
- **TanStack handles deduplication** — if the same order is tracked in two tabs, only one API call goes out
- **No browser compatibility concerns** — works on every HTTP client ever made

### Trade-offs
| Gain | Sacrifice |
|------|-----------|
| Zero server changes | 3-second latency on status changes (not truly real-time) |
| No WebSocket dependency on public page | Bandwidth waste: every client polls every 3s even if nothing changed |
| TanStack handles all caching/retry automatically | Phone battery impact from continuous 3s polling |
| Works through any proxy, any CDN, any firewall | Not scalable beyond a few hundred concurrent trackers |
| Prefetches instantly on page load (no connection setup time) | Polling is fundamentally wasteful compared to push |
| Easiest to test and debug (plain HTTP) | Feels "laggy" compared to native app expectations |

### Probability: 0.05
### Complexity: Low (~3 files: 1 route, 1 tracking view, no new composables)

### Risks
- **Rate limiting on json-server**: json-server is single-threaded and synchronous. At 1000 customers polling every 3s = 333 req/s on the orders endpoint. The existing KDS also polls. The server may buckle.
- **3s is too slow for kitchen expectations**: KDS users expect instant updates. But this is a *customer* feature — customers can tolerate a few seconds.
- **No offline support**: unlike WebSocket, polling has no state to recover if the network drops; the next poll simply succeeds or fails.
- **UX perception**: customers who watch the screen may see the status "jump" from `pending` to `ready` without seeing `preparing` if the poll timing is unlucky and the kitchen moves fast.

---

## 9. Diversity Verification

| Dimension | A (client-filter) | B (room scope) | C (phone+Pinia) | D (QR token) | E (SSE) | F (polling) |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|
| Server changes | None | Moderate | Heavy | Moderate | Heavy | None |
| Identity depth | None | None | Phone-based | Token-based | None | None |
| Real-time mechanism | Shared WS | Shared WS | Shared WS | Shared WS | SSE only | REST poll |
| Client complexity | Low | Low | Medium | Low | Medium | Minimal |
| Security | Poor | Medium | Medium | High | Medium | Poor |
| Future-proofing | Low | Medium | High | Medium | Low | Low |
| UX quality | Good | Good | Best | Best | Good | Acceptable |
| Lines of new code | ~180 | ~280 | ~450 | ~320 | ~500 | ~100 |

The six approaches are genuinely distinct, spanning:

- **Real-time transport**: shared WebSocket (A, B, C, D) vs. SSE (E) vs. no persistent connection (F)
- **Identity**: anonymous (A, B, E, F) vs. token (D) vs. lightweight auth (C)
- **Server involvement**: zero changes (A, F) vs. room/token logic (B, D) vs. new resources (C) vs. new streaming layer (E)
- **Lookup UX**: form-based (A, B, C) vs. URL-embedded (D, E, F)
- **State management**: composable-only (A, B, D) vs. Pinia store (C) vs. TanStack-only (F) vs. in-memory server log (E)

No two approaches occupy the same region. They range from "ship in 2 hours with zero risk" (F) to "architectural overhaul with dual real-time systems" (E).

---

## 10. Recommendation Summary (For Next Phase)

| If your priority is… | Choose |
|----------------------|--------|
| Fastest time-to-market, minimal risk | **A** — ship in hours |
| Balance of quality and speed | **B** — room scoping, no identity |
| Customer relationship features down the line | **C** — phone identity, portal |
| Novel frictionless UX + security | **D** — QR + token |
| WebSocket-free public surface | **F** — polling with SWR |
| Maximum architectural purity | **E** — event sourcing + SSE |

For a phased rollout: **start with B** (room scoping for correctness) then **layer C** (customer portal with Pinia) as a second phase. Approach A is a viable even-simpler starting point if the team wants to avoid any server changes initially.
