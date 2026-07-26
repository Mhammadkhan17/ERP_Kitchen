# Customer Portal — Proposal Pruning Evaluation

**Date:** 2026-07-15
**Evaluator:** Judge Agent
**Input:** 18 proposals across 3 files (A: 6, B: 6, C: 6)

---

## Elimination Summary

| Proposal | File | Req Align | Feasibility | Architecture | Risk | Final | Verdict |
|---|---|---|---|---|---|---|---|
| A-A (Minimal Viable Portal) | A | 5 (×.30) | 15 (×.25) | 20 (×.25) | 1 (×.20) | **92.89** | ✅ Selected |
| A-B (Admin-in-Subdirectory) | A | 5 (×.30) | 13 (×.25) | 20 (×.25) | 2 (×.20) | **90.22** | ✅ Selected |
| A-C (Gradual Migration) | A | 4 (×.30) | 13 (×.25) | 18 (×.25) | 2 (×.20) | **83.11** | Honorable mention |
| A-D (Server Sessions) | A | 2 (×.30) | 13 (×.25) | 16 (×.25) | 2 (×.20) | **73.33** | Withdrawn |
| A-E (IFrame Micro-Frontend) | A | 2 (×.30) | 6 (×.25) | — | — | — | ❌ Feasibility < 8 |
| A-F (SW + Offline Cart) | A | 2 (×.30) | 3 (×.25) | — | — | — | ❌ Feasibility < 8 |
| B-1 (Route Prefix Restructure) | B | 5 (×.30) | 13 (×.25) | 20 (×.25) | 2 (×.20) | **90.22** | ✅ Selected |
| B-2 (Layout-Switching) | B | 0 (×.30) | — | — | — | — | ❌ Req align: req_8 rejected |
| B-3 (Dynamic Prefix) | B | 2 (×.30) | 9 (×.25) | 12 (×.25) | 2 (×.20) | **55.56** | Withdrawn |
| B-4 (Dual SPA) | B | 4 (×.30) | 3 (×.25) | — | — | — | ❌ Feasibility < 8 |
| B-5 (Middleware Rewrite) | B | 0 (×.30) | — | — | — | — | ❌ Req align: req_8 rejected |
| B-6 (State Machine) | B | 4 (×.30) | 6 (×.25) | — | — | — | ❌ Feasibility < 8 |
| C-1 (Progressive Enhancement) | C | 5 (×.30) | 15 (×.25) | 20 (×.25) | 2 (×.20) | **91.56** | Withdrawn (duplicate of A-A) |
| C-2 (Feature-Sliced Module) | C | 4 (×.30) | 13 (×.25) | 16 (×.25) | 2 (×.20) | **78.67** | Withdrawn |
| C-3 (Domain-Driven) | C | 5 (×.30) | 11 (×.25) | 16 (×.25) | 2 (×.20) | **76.89** | Withdrawn |
| C-4 (Server Cart) | C | 4 (×.30) | 3 (×.25) | — | — | — | ❌ Feasibility < 8 |
| C-5 (Socket-First) | C | 4 (×.30) | 3 (×.25) | — | — | — | ❌ Feasibility < 8 |
| C-6 (Offline PWA) | C | 4 (×.30) | 0 (×.25) | — | — | — | ❌ Feasibility < 8 |

---

## Elimination Gates

### Gate 1: Clarity Qualifier (Pass/Fail)
All 18 proposals pass — they each specify files, composables, route structure, and data flow at sufficient detail for a developer familiar with the codebase to implement.

### Gate 2: Requirement Alignment (req_alignment < 2 → eliminated)
**Eliminated: B-2, B-5**
- **B-2** (Layout-Switching): Explicitly rejects req_8 ("No path prefix needed — admin routes remain at root"), stating that role-based layout switching replaces path prefixing. This is a direct contradiction of the requirement to move admin routes under `/admin/*`.
- **B-5** (Middleware Rewrite): Keeps all routes at root level with guard-based access control. "Zero URL changes — all existing links work without modification." Fails req_8.

### Gate 3: Feasibility (feasibility < 8 → eliminated)
**Eliminated: A-E (6), A-F (3), B-4 (3), B-6 (6), C-4 (3), C-5 (3), C-6 (0)**
All eliminated proposals either introduce major new dependencies (IFrame dual-app, Service Worker, IndexedDB), require server-side changes (custom json-server middleware, direct `db.json` writes), or have effort estimates exceeding reasonable scope (8-10 days). The eliminated proposals have tech_stack_risk scores of 0 — they cannot be built with the existing stack alone.

### Gate 4: Architecture (architecture < 10 → eliminated)
All remaining candidates pass this gate (scores range 12-20).

---

## Withdrawn Candidates

After elimination, 9 proposals remain. The following are withdrawn because they are inferior on at least one axis without compensating strength:

1. **C-1 (91.56)** — Withdrawn because it is architecturally identical to A-A (same approach, same author cluster, same score profile). A-A has slightly sharper precision on effort estimate (2-3 days with breakdown).
2. **A-C (83.11)** — Withdrawn despite solid scores. The phased feature-flag approach adds deployment complexity and tech debt for marginal safety benefit over A-A/B-1. The intermediate "in-between" state (Phase 1-2) creates route confusion documented in its own trade-offs.
3. **C-2 (78.67)** — Withdrawn. Pinia for cart is over-engineered for a json-server app (acknowledged in its own trade-offs). Missing explicit Socket.IO coverage. Route factory abstraction adds indirection without clear benefit.
4. **C-3 (76.89)** — Withdrawn. `meta.domain` tagging requires touching every route record, increasing risk of regression. Dynamic layout component may cause unnecessary re-renders. Lower architecture score (16) due to less detail on composable modularity.
5. **A-D (73.33)** — Withdrawn. Server-generated guest sessions pollute `customers` resource with ephemeral records. Missing detail on order modification and cancellation flows. Scores lower on req_alignment (2) due to shallow coverage of mutation requirements.
6. **B-3 (55.56)** — Withdrawn. Focuses on prefix mechanism but lacks depth on customer features (menu, cart, orders, WebSocket, auth). Runtime config fetch increases TTI. Deep links break across config changes.

---

## Top 3 Selected Proposals

### #1 — A-A "Minimal Viable Portal" (Score: 92.89)

| Axis | Raw Score | Weighted |
|---|---|---|
| Requirement Alignment | 5 / 5 | 1.50 |
| Feasibility & Effort | 15 / 15 | 3.75 |
| Architectural Quality | 20 / 20 | 5.00 |
| Risk & Mitigation | 1 / 5 | 0.20 |

**Strengths:**
- All 12 requirements (10 essential + 2 non-essential) addressed with clear implementation plan
- Zero new dependencies, zero backend changes, zero existing module changes
- Minimal 2-3 day effort estimate — smallest delta of any proposal
- Purely additive: new `src/modules/customer/` module, router prefix addition, existing admin routes untouched
- Clear composable breakdown: `useCustomerCart` (localStorage-backed `Map`), `useCustomerSession` (phone-based), `useCustomerOrders` (extends existing patterns with cancel + modify)
- Phone-based identity reuses existing `customers` resource and `CustomerPortal.vue` pattern
- Extends `api.orders` with generic `update()` for PATCH-based modification — json-server native
- Socket.IO reuse via client-side `customerId` filtering in `useCustomerOrders`

**Weaknesses:**
- Risk section is thin (score 1/5): only 2 minor risks identified (phone exclusion, tab conflict); no explicit treatment of route conflict, WS coordination with admin, broken admin rollback, or scope boundaries
- Phone-only identity is a UX constraint that may require enhancement (acknowledged in proposal)
- Guest customers without resolved `customerId` won't receive real-time updates

**Why it wins:** Lowest risk, fastest delivery, closest alignment with existing patterns. The risk weakness is common across all proposals and easily addressed during development with a follow-up risk register.

---

### #2 — B-1 "Route Prefix Restructure + Cart Module" (Score: 90.22)

| Axis | Raw Score | Weighted |
|---|---|---|
| Requirement Alignment | 5 / 5 | 1.50 |
| Feasibility & Effort | 13 / 15 | 3.25 |
| Architectural Quality | 20 / 20 | 5.00 |
| Risk & Mitigation | 2 / 5 | 0.40 |

**Strengths:**
- All essential requirements addressed with clear implementation depth
- UUID-based session instead of phone-gated identity — every customer (including guests) gets real-time updates
- Best risk coverage among all proposals: explicitly identifies redirect loop (with mitigation), query cache collision between admin/customer (with namespaced key strategy), and API gap (with new `orders.update` / `orders.delete` methods)
- Clear route hierarchy: `/admin/*` group, `/*` customer group, `beforeEach` guard with `?redirected=1` query param for backward compatibility
- Dedicated `useCustomerOrderFeed.ts` composable for customer-scoped WebSocket — separates concerns from admin `useOrderFeed`
- New `modules/customer-order/` module avoids polluting existing `order-status` module

**Weaknesses:**
- Higher complexity than A-A (Medium vs Low)
- No day-level effort breakdown (just "Medium complexity")
- `beforeEach` guard with `?redirected=1` is elegant but adds hidden behavior that may surprise debuggers
- No explicit scope boundaries or rollback plan documented

**Why it's selected:** Best risk management of any proposal. The UUID session approach addresses a real gap in A-A (guest real-time updates). Slightly higher effort than A-A but justified by better identity coverage and risk awareness.

---

### #3 — A-B "Admin-in-Subdirectory with Shim Layer" (Score: 90.22)

| Axis | Raw Score | Weighted |
|---|---|---|
| Requirement Alignment | 5 / 5 | 1.50 |
| Feasibility & Effort | 13 / 15 | 3.25 |
| Architectural Quality | 20 / 20 | 5.00 |
| Risk & Mitigation | 2 / 5 | 0.40 |

**Strengths:**
- All essential requirements addressed comprehensively
- Best route file organization of any proposal: `src/router/routes/admin.ts` + `customer.ts` merged in `index.ts` — prevents the router from becoming a monolith as the app grows
- `beforeEach` guard for backward compatibility — **zero bookmark breakage risk**; all existing links continue to work
- Detailed view inventory: `MenuBrowse.vue`, `CartDrawer.vue`, `CheckoutPage.vue`, `OrderHistory.vue`, `OrderDetail.vue` — complete page-level specification
- Reuses `useCustomerOrders` from `order-status` module with extension rather than duplication — honors DRY principle
- Explicitly acknowledges `/track` route must stay on `PublicLayout` (not `CustomerLayout`) — shows attention to edge cases

**Weaknesses:**
- Uses phone-based identity (same limitation as A-A)
- `order-status` module now straddles two contexts (guest tracking + logged-in portal) — potential future confusion
- Slightly higher effort than A-A (3-4 days vs 2-3)
- No scope boundaries or rollback plan

**Why it's selected:** Best long-term code organization. The separate route files and backward-compatible guard make this the most maintainable option as the customer portal grows beyond MVP. Complements A-A (build fast) and B-1 (manage risk) with a focus on codebase health.

---

## Consolidated Recommendation

| Order | Proposal | Key Differentiator | When to Choose |
|---|---|---|---|
| 1st | A-A "Minimal Viable Portal" | Speed & simplicity | If shipping in < 3 days is the priority |
| 2nd | B-1 "Route Prefix + Cart Module" | Risk awareness + UUID identity | If guest customer experience and real-time parity matter in v1 |
| 3rd | A-B "Admin-in-Subdirectory" | Codebase maintainability | If the team expects rapid iteration after launch |

**All three proposals share the same fundamental architecture:**
- Router restructure into `/admin/*` and `/*` groups
- localStorage-backed cart composable (no server cart)
- Client-side Socket.IO filtering by `customerId`
- Phone or UUID-based session identity
- Zero backend changes (json-server PATCH + POST only)
- New `src/modules/customer/` module following existing patterns

**The top 3 can be combined:** Use A-A's composable structure, B-1's UUID session model and risk mitigations, and A-B's route file organization. All three are compatible without conflict.
