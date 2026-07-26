# Customer-Facing Live Order Tracking — Proposal Pruning (Round 2)

**Date:** 2026-07-15  
**Evaluator:** Meta Judge (automated)  
**Method:** Weighted-sum scoring across 5 criteria (1–5 scale)  
**Selection:** Top 3 of 18 proposals for full development

---

## Vote

```
VOTE: C-A, A2, B-C (ranked 1st, 2nd, 3rd)
SCORES:
  C-A (Composable Overlay):     4.40/5.0
  A2 (Dual-Mode + PIN):         4.10/5.0
  B-C (Phone-Based Identity):   4.05/5.0
  B-A (Client-Filter):          3.80/5.0
  A3 (Full Auth + Rooms):       3.70/5.0
  C-B (Dedicated Socket):       3.65/5.0
  C-F (Pinia Store):            3.65/5.0
  C-C (Server-Scoped Rooms):    3.60/5.0
  A1 (Guest-Only Lookup):       3.40/5.0
  B-B (Room Scope):             3.35/5.0
  A5 (SSE/WS Split):            3.20/5.0
  B-F (Polling SWR):            2.90/5.0
  C-D (Polling-First):          2.90/5.0
  A4 (Hashed Token):            2.75/5.0
  B-D (QR Token):               2.50/5.0
  B-E (SSE Event Sourcing):     2.35/5.0
  A6 (Widget SDK):              2.30/5.0
  C-E (Widget/MFE):             2.30/5.0
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
| **A2** | 4 → 1.00 | 5 → 1.25 | 4 → 0.80 | 4 → 0.60 | 3 → 0.45 | **4.10** |
| **B-C** | 3 → 0.75 | 5 → 1.25 | 5 → 1.00 | 4 → 0.60 | 3 → 0.45 | **4.05** |
| B-A | 5 → 1.25 | 3 → 0.75 | 3 → 0.60 | 4 → 0.60 | 4 → 0.60 | 3.80 |
| A3 | 2 → 0.50 | 4 → 1.00 | 5 → 1.00 | 5 → 0.75 | 3 → 0.45 | 3.70 |
| C-B | 4 → 1.00 | 4 → 1.00 | 3 → 0.60 | 4 → 0.60 | 3 → 0.45 | 3.65 |
| C-F | 5 → 1.25 | 3 → 0.75 | 3 → 0.60 | 4 → 0.60 | 3 → 0.45 | 3.65 |
| C-C | 3 → 0.75 | 4 → 1.00 | 4 → 0.80 | 4 → 0.60 | 3 → 0.45 | 3.60 |
| A1 | 5 → 1.25 | 2 → 0.50 | 3 → 0.60 | 4 → 0.60 | 3 → 0.45 | 3.40 |
| B-B | 3 → 0.75 | 3 → 0.75 | 4 → 0.80 | 4 → 0.60 | 3 → 0.45 | 3.35 |
| A5 | 3 → 0.75 | 3 → 0.75 | 4 → 0.80 | 3 → 0.45 | 3 → 0.45 | 3.20 |
| B-F | 5 → 1.25 | 2 → 0.50 | 2 → 0.40 | 3 → 0.45 | 2 → 0.30 | 2.90 |
| C-D | 5 → 1.25 | 2 → 0.50 | 2 → 0.40 | 3 → 0.45 | 2 → 0.30 | 2.90 |
| A4 | 4 → 1.00 | 1 → 0.25 | 3 → 0.60 | 4 → 0.60 | 2 → 0.30 | 2.75 |
| B-D | 3 → 0.75 | 1 → 0.25 | 3 → 0.60 | 4 → 0.60 | 2 → 0.30 | 2.50 |
| B-E | 2 → 0.50 | 2 → 0.50 | 3 → 0.60 | 3 → 0.45 | 2 → 0.30 | 2.35 |
| A6 | 2 → 0.50 | 2 → 0.50 | 2 → 0.40 | 4 → 0.60 | 2 → 0.30 | 2.30 |
| C-E | 2 → 0.50 | 2 → 0.50 | 2 → 0.40 | 4 → 0.60 | 2 → 0.30 | 2.30 |

---

## Top 3 — Ranked

### 1st: C-A "Composable Overlay" (4.40)

**Proposal C-A** from Set C is the strongest proposal across all criteria. It scores a perfect **5** on feasibility (zero server changes, reuses existing singleton WS, follows every existing pattern) and a **5** on technical specificity (names every file, composable, route, module, and API method). It addresses both features — guest tracking via order-number input and customer portal via localStorage customerId — earning a **4** on requirements coverage (minor gap: no explicit error/loading state descriptions). Solution quality potential is **4/5** owing to its clean composable-based design that cleanly extends existing patterns like `useOrderFeed` without modifying them. Risk management scores **4/5** — it calls out bandwidth waste, auth fragility, and scalability limits with honest mitigations framed as MVP vs. production concerns.

**Why it wins:** C-A requires no foundational changes, ships both required features, is the most actionable proposal (every file named), and embraces the stack's constraints rather than fighting them.

### 2nd: A2 "Dual-Mode Guest + Customer with LocalStorage Auth" (4.10)

**Proposal A2** from Set A scores a perfect **5** on requirements coverage — it is the only proposal that fully and explicitly addresses both features with a coherent dual-mode design. The guest `/track` page and customer `/orders` portal are both fully specified, including PIN-based identity, a `useCustomerStore` Pinia store, and shared `useOrderTracker` composable. Feasibility is **4/5** — adding `customerId` to the Order type and seeding `db.json` is a small data model change but works within the stack. Solution quality is **4/5** — the portal would show all orders with live updates, and the PIN approach is pragmatic. Technical specificity is **4/5** — names files, store, composable, routes, data model changes. Risk management is **3/5** — identifies pseudo-auth concerns and localStorage fragility but doesn't fully mitigate them.

**Why it wins:** A2 delivers a complete dual-mode solution with the best requirements coverage. The PIN-based identity is a pragmatic middle ground between no-auth (A1) and over-engineered JWT (A3).

### 3rd: B-C "Phone-Based Customer Identity with Pinia Store" (4.05)

**Proposal B-C** from Set B scores a perfect **5** on both requirements coverage and solution quality potential. The phone-based OTP identity model is the most thought-through customer portal experience among all proposals, with a real (simulated) identity flow, order history, and room-per-customer scoping. The solution quality is unmatched — OTP flow, Pinia store, customer orders by `customerId`, and guest tracking standing independently would produce the richest UX. Feasibility is **3/5** (~12 files, new `customers` resource, data migration, server changes) and risk management is **3/5** (simulated OTP is not real auth, data migration needed, feature creep risk). However, the quality bar it would set makes it worth the extra implementation effort.

**Why it wins:** B-C produces the best *result* — a real-feeling customer portal with identity, history, and live updates. It bridges the gap from MVP to production more credibly than any other proposal.

---

## Rationale

### Why these three?

The top three proposals share a critical property: they **address both features** (public tracking + customer portal) within the existing stack constraints. Every proposal that scored below 3.70 fails on at least one of these requirements:

- **A1, A4, B-D** — guest-only, no portal → requirements coverage 1–2
- **B-F, C-D** — polling-based, not truly real-time → quality 2
- **A6, C-E, B-E** — architectural overhauls (widgets, SSE, dual transport) → feasibility 2
- **A3, C-C, B-B** — server room scoping is architecturally clean but requires server changes → feasibility 3

**C-A** is the pragmatic MVP champion: zero server risk, maximum codebase alignment, and clearly actionable. **A2** and **B-C** both propose credible identity mechanisms that enable the customer portal — A2 with a lighter touch (PIN in localStorage) and B-C with a richer but more complex approach (phone-based OTP).

### Notable excluded proposals

- **B-A (3.80)** and **A3 (3.70)** — Both strong proposals. B-A is essentially C-A's counterpart from Set B (client-side filtering, zero server changes) but scores lower on requirements coverage because its customer portal is merely a "list of tracked numbers" rather than a true order-history-by-customer portal. A3 (JWT + rooms) produces the most production-ready architecture but feasibility is crippled by the current json-server environment — it's the right long-term target but wrong MVP choice.

- **C-F (3.65)** — The Pinia store approach is interesting and feasible, but the TanStack Query + Pinia conflict risk and the "load all orders client-side" pattern don't scale.

- **A5 (3.20)** — SSE/WS hybrid is novel but the dual-transport maintenance burden and vague customer portal spec drag it down.

### Low-probability proposals (A4, A5, A6, B-D, B-E, B-F, C-D, C-E)

All scored ≤3.20. These were explicitly labeled as "diverse" or "low probability" by their authors and were included for solution-space coverage. They explore genuinely different mechanisms (tokens, QR, SSE, polling, widgets) but none fully address both required features within the stack constraints. They serve as useful counterfactuals but are not development candidates.

---

## Concerns About Selected Proposals

### C-A "Composable Overlay"

| Concern | Detail |
|---|---|
| **No customer identity beyond localStorage** | Customer portal relies on a `customerId` stored in localStorage — this is not real auth. Any user can inspect/modify their `customerId` and see another customer's orders. Proposal acknowledges this but doesn't mitigate it. Acceptable for MVP; must be flagged as tech debt. |
| **Client-side WS filtering at scale** | Every customer client receives all `order:update` broadcasts from the kitchen, discarding 95%+ of events. At 50+ concurrent customers this becomes wasteful. Proposal identifies this but has no interim scaling strategy (e.g., throttling the filter, or moving to room scoping in phase 2). |
| **No loading/error states explicitly described** | The composable and views are well-named but the proposal doesn't detail skeleton loaders, error boundaries, or the "order not found" experience. These must be designed during implementation. |
| **Singleton socket listener management** | If `useOrderFeed` already has a listener for `['orders']` query key, adding a second listener to the same socket for per-order updates could cause duplicate processing or cache conflicts. Need clear separation of listener responsibilities. |

### A2 "Dual-Mode + PIN"

| Concern | Detail |
|---|---|
| **PIN-in-localStorage is fragile** | PINs stored in localStorage are trivially readable, not hashed (proposal mentions "fast hash" but hashing in the browser is pointless — the hash itself is the secret). A device clear or browser data wipe loses all customer identity. No recovery mechanism. |
| **Two WebSocket singletons** | Proposal creates a separate `useCustomerFeed` singleton alongside the existing KDS `useOrderFeed`. Two Socket.IO connections from the same page may cause browser connection limit issues in edge cases, and the dual-lifecycle management adds complexity. |
| **Data migration risk** | Adding `customerId` to all existing orders in `db.json` requires a migration script. If existing orders have inconsistent `customerName` formatting, the mapping to synthetic customer IDs may produce incorrect associations. |
| **No guest privacy for order numbers** | Guest tracking still uses sequential order numbers, which are guessable. Proposal inherits A1's privacy weakness for the guest path. Consider adding a tracking token (A4-style) as an enhancement. |

### B-C "Phone-Based Identity with Pinia"

| Concern | Detail |
|---|---|
| **Simulated OTP is not real security** | The OTP is "simulated via console.log" — any user can enter any phone number and see that customer's orders. This is effectively no security. The proposal acknowledges this but doesn't quantify the risk or provide a migration path to real OTP (Twilio, etc.). |
| **High implementation complexity (~12 files)** | Most files to change of any selected proposal. Requires schema migration (`customers` resource, `customerId` on orders), server.js changes (room scoping, OTP endpoint), and significant new frontend code. Regression risk on existing KDS broadcast. |
| **Feature creep risk** | Phone-based identity naturally invites profile pages, saved addresses, order history filters, and reorder functionality. Proposal flags this but has no explicit scope guard. The implementation must be strictly held to the two required features. |
| **Existing orders lack customerId** | All historical orders need `customerId` assignment. Proposal suggests "default walk-in customer or make optional" — both approaches have UX implications. Walk-in = no portal access for existing orders; optional = inconsistent data model. |

---

## Phased Implementation Recommendation

| Phase | Proposal | Rationale |
|---|---|---|
| **Phase 1 (MVP)** | **C-A** → guest tracking + portal with localStorage ID | Ship fastest. Zero server changes. Learn what customers actually need. |
| **Phase 2 (identity)** | **A2** → add PIN-based identity, improve portal | Adds real identity without JWT overhead. Migration from C-A is straightforward — replace `localStorage customerId` with PIN store. |
| **Phase 3 (production)** | **B-C** → phone OTP, room scoping, full portal | Only when json-server is replaced with a real backend. B-C's phone identity and room scoping become production-ready on a proper server. |

This sequence ensures incremental delivery: C-A ships in days, A2 layers identity in weeks, B-C productionizes when infrastructure matures. No phase blocks the next — each is backward-compatible with the prior.
