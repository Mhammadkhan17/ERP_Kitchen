# Customer-Facing Live Order Tracking — Proposal Pruning (Round 3)

**Date:** 2026-07-15  
**Evaluator:** Judge Agent (automated)  
**Method:** Weighted-sum scoring across 5 criteria (1–5 scale), independent re-evaluation  
**Selection:** Top 3 of 18 proposals for full development

---

## Vote

```
VOTE: C-A, A2, C-C (ranked 1st, 2nd, 3rd)
SCORES:
  C-A (Composable Overlay):        4.40/5.0
  A2 (Dual-Mode + PIN):            4.05/5.0
  C-C (Server-Scoped Rooms):       3.98/5.0
  A3 (Full Auth + Rooms):          3.65/5.0
  C-F (Pinia Store):               3.63/5.0
  A1 (Guest-Only Lookup):          3.63/5.0
  B-A (Client-Filter):             3.63/5.0
  B-B (Room Scope):                3.55/5.0
  B-C (Phone-Based Identity):      3.53/5.0
  C-B (Dedicated Socket):          3.50/5.0
  A4 (Hashed Token):               3.28/5.0
  C-D (Polling-First):             3.23/5.0
  A5 (SSE/WS Split):               3.18/5.0
  B-F (Polling SWR):               3.10/5.0
  B-D (QR Token):                  3.00/5.0
  C-E (Widget/MFE):                2.53/5.0
  A6 (Widget SDK):                 2.43/5.0
  B-E (SSE Event Sourcing):        2.43/5.0
CRITERIA:
  feasibility:             weighted 0.25
  requirements_coverage:   weighted 0.25
  solution_quality_potential: weighted 0.20
  technical_specificity:   weighted 0.15
  risk_management:         weighted 0.15
```

---

## Scoring Table

| Proposal | Feas. (×0.25) | Req. Cov. (×0.25) | Quality (×0.20) | Specificity (×0.15) | Risk (×0.15) | **Final** |
|---|---|---|---|---|---|---|
| **C-A** | 5 → 1.25 | 4 → 1.00 | 4 → 0.80 | 5 → 0.75 | 4 → 0.60 | **4.40** |
| **A2** | 4 → 1.00 | 4.5 → 1.125 | 4 → 0.80 | 4.5 → 0.675 | 3 → 0.45 | **4.05** |
| **C-C** | 3.5 → 0.875 | 4 → 1.00 | 4.5 → 0.90 | 4.5 → 0.675 | 3.5 → 0.525 | **3.98** |
| A3 | 2 → 0.50 | 4.5 → 1.125 | 4.5 → 0.90 | 4.5 → 0.675 | 3 → 0.45 | 3.65 |
| C-F | 4.5 → 1.125 | 3.5 → 0.875 | 3.5 → 0.70 | 4 → 0.60 | 2.5 → 0.375 | 3.63 |
| A1 | 4.5 → 1.125 | 2 → 0.50 | 4 → 0.80 | 4.5 → 0.675 | 3.5 → 0.525 | 3.63 |
| B-A | 5 → 1.25 | 2.5 → 0.625 | 3.5 → 0.70 | 4 → 0.60 | 3 → 0.45 | 3.63 |
| B-B | 3.5 → 0.875 | 3 → 0.75 | 4 → 0.80 | 4 → 0.60 | 3.5 → 0.525 | 3.55 |
| B-C | 2.5 → 0.625 | 4.5 → 1.125 | 4 → 0.80 | 4 → 0.60 | 2.5 → 0.375 | 3.53 |
| C-B | 3.5 → 0.875 | 3.5 → 0.875 | 3.5 → 0.70 | 4 → 0.60 | 3 → 0.45 | 3.50 |
| A4 | 4 → 1.00 | 2 → 0.50 | 3.5 → 0.70 | 4 → 0.60 | 3 → 0.45 | 3.28 |
| C-D | 4.5 → 1.125 | 3 → 0.75 | 2.5 → 0.50 | 3.5 → 0.525 | 2.5 → 0.375 | 3.23 |
| A5 | 3 → 0.75 | 3.5 → 0.875 | 3.5 → 0.70 | 3.5 → 0.525 | 2.5 → 0.375 | 3.18 |
| B-F | 5 → 1.25 | 2.5 → 0.625 | 2 → 0.40 | 4 → 0.60 | 2 → 0.30 | 3.10 |
| B-D | 3.5 → 0.875 | 2 → 0.50 | 3.5 → 0.70 | 3.5 → 0.525 | 2.5 → 0.375 | 3.00 |
| C-E | 2.5 → 0.625 | 2.5 → 0.625 | 2.5 → 0.50 | 3.5 → 0.525 | 2 → 0.30 | 2.53 |
| A6 | 2 → 0.50 | 2.5 → 0.625 | 2.5 → 0.50 | 3 → 0.45 | 2 → 0.30 | 2.43 |
| B-E | 2 → 0.50 | 2 → 0.50 | 3 → 0.60 | 3.5 → 0.525 | 2 → 0.30 | 2.43 |

---

## Top 3 — Ranked

### 1st: C-A "Composable Overlay" (4.40)

**Proposal C-A** from Set C retains the top position. It scores a perfect **5** on feasibility — zero server changes, reuses the singleton `useOrderFeed` Socket.IO connection, and scopes all additions to a new `src/modules/tracking/` folder without touching any existing KDS/inventory/menu code. Technical specificity is also **5/5**: every file is named (`useCustomerOrders.ts`, `OrderTracking.vue`, `CustomerPortal.vue`, `StatusTimeline.vue`, `OrderCardCompact.vue`), routes are specified (`/track`, `/portal`), and the API extension pattern is clear (`api.orders.list()` with `?customerId=X`). Requirements coverage is **4/5** — it addresses both features thoroughly, uses localStorage `customerId` for the portal identity gap, and explains client-side WS filtering. The only gap is that loading/error/empty states are not explicitly described. Risk management is **4/5** — bandwidth waste and auth fragility are identified with honest MVP-vs-production framing. Solution quality potential is **4/5** — the composable overlay design produces clean separation of concerns and consistent PrimeVue/UnoCSS styling.

**Why it wins:** C-A is the only proposal that simultaneously achieves zero server risk, full dual-feature coverage, maximum codebase alignment, and concrete actionability. It embraces the stack's constraints rather than fighting them.

### 2nd: A2 "Dual-Mode Guest + Customer with LocalStorage Auth" (4.05)

**Proposal A2** from Set A scores the highest requirements coverage at **4.5/5**. It is the most complete dual-mode design among all proposals — guest `/track` page, customer `/orders` portal, `/register` page for PIN-based identity, and a shared `useOrderTracker` composable. The `customerId` + `customerPin` data model changes prepare the ground for real auth in the future. Technical specificity is **4.5/5**: names the Pinia store (`useCustomerStore`), both socket singletons (`useCustomerFeed`), routes, and data migration approach. Feasibility is **4/5** — requires adding fields to `Order` type and seeding `db.json` but no server.js changes. Solution quality is **4/5** — the dual-mode with portal and PIN would produce a compelling UX. Risk management is **3/5** — PIN-in-localStorage is fragile (trivially readable, lost on device clear), two WS singletons may conflict, and guest tracking retains sequential-order-number guessing.

**Why it wins:** A2 delivers the most complete feature set with the best requirements coverage. The PIN-based identity is a pragmatic middle ground between no-auth (A1) and over-engineered JWT (A3).

### 3rd: C-C "Server-Scoped Rooms" (3.98)

**Proposal C-C** from Set C is the architecturally strongest approach. It scores **4.5/5** on both solution quality potential and technical specificity. Socket.IO rooms are the correct pattern for scoped broadcasts — the server emits `order:update` only to `order:<orderId>` (guest) or `customer:<customerId>` (portal) rooms, eliminating bandwidth waste and providing server-enforced security. The room join/leave protocol (`join`, `leave` events) is clearly specified with naming conventions. Feasibility is **3.5/5** — requires server.js changes (room join handler, room emit in `router.render`) and a `customerId` field on the Order type, but the KDS global broadcast is preserved for backward compatibility. Risk management is **3.5/5** — identifies the fetch-then-join race condition and the KDS migration concern, with reasonable mitigations (dual broadcast, acknowledge race window).

**Why it wins:** C-C is the best long-term architecture. Room scoping solves the WS filtering problem at the source, scales efficiently, and provides a server-enforced security boundary. It is the natural upgrade path from C-A.

---

## Rationale

### Why these three?

The top three proposals share a critical property: they **address both required features** while working within the existing stack constraints, disagreeing only on the WS scoping strategy and identity depth.

| Dimension | C-A | A2 | C-C |
|-----------|-----|-----|-----|
| Server changes | None | None (data model only) | Room join/emit |
| WS strategy | Shared singleton + client filter | Two singletons + client filter | Server-scoped rooms |
| Identity | localStorage customerId | PIN in localStorage | customerId FK |
| Guest UX | Order number input | Order number input | Order fetch → join room |
| Portal UX | Orders filtered by customerId | PIN login → all orders | Join customer room → all orders |
| Risk level | Lowest | Medium | Medium-High |

**C-A** is the pragmatic MVP champion: zero server risk, maximum codebase alignment, and immediately actionable. **A2** delivers the most complete feature set with the richest portal experience. **C-C** provides the correct architectural foundation that C-A and A2 both lack — server-enforced WS scoping that scales.

These three form a natural **progressive enhancement** path: C-A ships first, A2's identity model layers on top, and C-C's room scoping replaces client-side filtering when traffic grows.

### Notable excluded proposals

- **A3 (Full JWT + Rooms, 3.65)** — Production-ready architecture but requires auth middleware, password hashing, JWT management, and room scoping in json-server. Feasibility score of **2** reflects that this is over-engineered for the current dev environment. A3 is the correct end-state target but wrong MVP choice.

- **C-F (Pinia Store, 3.63)** — Interesting store-centric design but the coupling between Pinia and the WS singleton creates testability concerns, and the potential TanStack Query cache conflict is a real risk. The "load all orders client-side" pattern doesn't scale.

- **A1 (Guest-Only Lookup, 3.63)** and **B-A (Client-Filter, 3.63)** — Both strong guest-tracking proposals but score low on requirements coverage (2.0 and 2.5 respectively) because their customer portal is either absent (A1) or reduced to a "list of tracked numbers" (B-A). Neither is a complete solution.

- **B-C (Phone Identity, 3.53)** — Round 2's third pick. Re-evaluation downgrades this proposal: the simulated OTP (console.log) is effectively no security, the implementation cost is high (~12 files, new resource, data migration, server changes), and the mitigations are vague. B-C's phone-based identity model is architecturally interesting but the risk-adjusted score doesn't support selection over C-C.

- **B-B (Room Scoping, 3.55)** — Similar to C-C but less specific on the join/leave protocol and with weaker customer portal coverage. C-C is the stronger room-scoping proposal.

- **A4, A5, A6, B-D, B-E, B-F, C-D, C-E** — All scored ≤3.28. These were labeled as "diverse" or "low probability" and explore genuinely different mechanisms (tokens, SSE, widgets, polling, QR). None fully address both required features within the stack constraints. They serve as useful architectural counterfactuals but are not development candidates.

### Validations Check

| Validation | C-A | A2 | C-C |
|---|---|---|---|
| **Existing patterns** (WS singleton, api/client, lazy routes, PrimeVue 4, UnoCSS, module structure) | ✅ Singleton reused, api/client extended, new module folder | ✅ Singleton extended, api/client unchanged, new module folder | ⚠️ Room join requires server.js changes but client patterns preserved |
| **Auth gap** (must explain portal without login) | ✅ localStorage customerId | ✅ PIN-based localStorage session | ⚠️ customerId FK assumed — no explicit portal identity mechanism |
| **WS constraint** (global broadcasts, client filtering) | ✅ Client-side filter by order number / customerId | ✅ Client-side filter via shared composable | ✅ Server-side room scoping — no client filtering needed |
| **Route structure** (flat routes, /kds redirect, public vs internal) | ✅ Routes above AppLayout, separate layout | ✅ Public routes outside AppLayout, portal inside | ✅ Same pattern as C-A |

---

## Concerns About Selected Proposals

### C-A "Composable Overlay"

| Concern | Detail |
|---|---|
| **No customer identity beyond localStorage** | Customer portal relies on a `customerId` stored in localStorage — any user can inspect/modify their `customerId` via DevTools and see another customer's orders. The proposal acknowledges this but doesn't mitigate it. Acceptable for MVP; must be flagged as tech debt in the implementation spec. |
| **Client-side WS filtering at scale** | Every customer client receives all `order:update` broadcasts, discarding 95%+ of events. At 50+ concurrent customers this becomes wasteful — Socket.IO message parsing cost is non-trivial. No interim scaling strategy (e.g., throttling or moving to rooms). |
| **No loading/error/empty state specification** | The composable and views are well-named but no details on skeleton loaders, error boundaries, "order not found" state, or network-offline indicators. These must be designed during implementation. |
| **Singleton listener leak risk** | If `useOrderFeed` already handles `['orders']` query key updates, adding a second `order:update` listener for per-order tracking could cause duplicate cache invalidation or missed updates. Need clear separation: the existing listener handles the full orders list; the tracking listener handles individual tracked orders. |
| **Route structure ambiguity** | Proposal says routes are "outside AppLayout" but doesn't specify whether this means (a) a separate `PublicLayout` component, (b) root-level routes with no layout, or (c) routes under a minimal shell. The implementation must decide. |

### A2 "Dual-Mode + PIN"

| Concern | Detail |
|---|---|
| **PIN-in-localStorage is not security** | PINs stored in localStorage are trivially readable. The proposal mentions "fast hash" but client-side hashing provides no security — the hash IS the secret. A browser data wipe loses all customer identity with no recovery. Device sharing scenarios break entirely. |
| **Two WebSocket singletons** | Creating a separate `useCustomerFeed` singleton alongside the existing KDS `useOrderFeed` means two Socket.IO connections from the same page. Browser connection limits (6 per domain for HTTP/1.1, 100 for HTTP/2) are unlikely to be hit at 2, but the dual lifecycle management (connect/disconnect/reconnect) adds complexity. If both singletons reconnect on network loss, they may race. |
| **Guest privacy for order numbers** | Guest tracking uses sequential order numbers (2001, 2002...) which are trivially guessable. An adversary can iterate to watch any order. Proposal inherits this from A1 without mitigation. |
| **Data migration risk** | Adding `customerId` to all existing orders in `db.json` requires a migration script. If `customerName` formatting is inconsistent (e.g., "John D.", "john.doe@email.com", "John Doe"), the synthetic customer ID mapping will produce incorrect associations. No validation strategy described. |
| **No PIN reset or recovery** | If a customer forgets their PIN, there is no recovery mechanism — the localStorage-based "account" is effectively lost. Proposal doesn't address this. |

### C-C "Server-Scoped Rooms"

| Concern | Detail |
|---|---|
| **Server.js regression risk** | Adding room join/leave handlers and room-scoped emits to `router.render` is a moderate server.js change. The existing global `io.emit('order:update', ...)` must be preserved for KDS clients that don't join rooms. A bug in the room emit path could cause KDS to miss updates. Mitigation: keep both broadcasts and diff-test the room path. |
| **Race condition: fetch then join** | Client must first `GET /orders?orderNumber=X` to resolve the order, then emit `join order:${id}` to subscribe to the room. If a status change occurs between the fetch and the join, the client misses it until the next change. Mitigation: (a) the initial fetch returns the current status, (b) the WebSocket can have a small buffer on the server side (though json-server doesn't support this easily). |
| **Customer portal identity is underspecified** | For the portal to join `customer:<customerId>`, the user must have a `customerId`. The proposal doesn't explain how the user obtains this ID — localStorage? Query param? Session cookie? No identity mechanism is proposed for the portal path. |
| **No client-count scaling strategy** | Each order update triggers a room broadcast. If thousands of guest clients are tracking the same order (e.g., a catering event), the single room broadcast goes to all of them — the same bandwidth cost as global broadcast. For popular orders, this negates the room advantage. |
| **KDS migration to rooms** | The current KDS relies on the global broadcast. If rooms later replace the global broadcast entirely, both KDS and tracking clients need to be updated simultaneously. No migration plan is proposed. |

---

## Phased Implementation Recommendation

| Phase | Focus | Approach | Rationale |
|---|---|---|---|
| **Phase 1 (MVP)** | Ship both features with zero server changes | **C-A** Composable Overlay | Fastest path: guest tracking + portal with localStorage identity. Reuses singleton socket, client-side filtering. Learn what customers need before investing in infrastructure. |
| **Phase 2 (identity)** | Add real customer identity | **A2** PIN model on top of C-A | Replace localStorage `customerId` with PIN-based session. Add `customerId` field to orders. Portal shows authenticated order history. Migration from C-A is straightforward. |
| **Phase 3 (infrastructure)** | Server-scoped WS rooms | **C-C** room scoping | Replace client-side filtering with server-side room scoping. Requires server.js changes but eliminates bandwidth waste and provides server-enforced security. Only justified when concurrent customer count exceeds ~50. |

This sequence ensures incremental, backward-compatible delivery: C-A ships in days, A2 layers identity in weeks, C-C productionizes the WS layer when scale demands it. No phase blocks the next.
