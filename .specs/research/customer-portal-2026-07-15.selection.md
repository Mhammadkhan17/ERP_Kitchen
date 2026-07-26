# Customer Portal — Proposal Selection

**Date:** 2026-07-15

## Vote Tallies

| Proposal | Judge 1 | Judge 3 | Total Points |
|---|---|---|---|
| **A-A (Minimal Viable Portal)** | 1st (3pts) | 1st (3pts) | **6** |
| **A-B (Admin-in-Subdirectory with Shim Layer)** | 3rd (1pt) | 2nd (2pts) | **3** |
| **B-1 (Route Prefix Restructure + Cart Module)** | 2nd (2pts) | — | **2** |
| A-C (Gradual Migration with Feature Flags) | — | 3rd (1pt) | 1 |

*Note: Judge 2 did not produce output (result was empty). Tally based on 2 judges.*

## Selected Proposals (Top 3)

1. **A-A — Minimal Viable Portal** (6 pts, consensus #1)
   - **Source:** `proposals.a.md` — Approach A
   - **Core idea:** Add `src/modules/customer/`, restructure router into `/` (CustomerLayout) and `/admin` (AppLayout), localStorage cart composable, phone-based identity.
   - **Why selected:** Unanimous #1. Fastest delivery (2-3 days), zero backend changes, purely additive, reuses existing patterns exactly.

2. **A-B — Admin-in-Subdirectory with Shim Layer** (3 pts, consensus #2)
   - **Source:** `proposals.a.md` — Approach B
   - **Core idea:** Extract admin routes into separate file, `beforeEach` guard for legacy redirects, enhanced `PublicLayout` → `CustomerLayout`.
   - **Why selected:** Best long-term code organization. Separate route files, backward-compatible guard, most complete view/component inventory.

3. **B-1 — Route Prefix Restructure + Cart Module** (2 pts, consensus #3)
   - **Source:** `proposals.b.md` — Approach 1
   - **Core idea:** Same router restructure but with UUID-based guest sessions (no phone gate = real-time works for every visitor), namespaced query keys, explicit risk documentation.
   - **Why selected:** Strongest risk awareness (redirect loop, cache collision, API gap mitigations). UUID identity model ensures Socket.IO real-time works for all visitors without requiring phone number.

## Consensus Rationale

All three selected proposals converge on the same core architecture:
- **Router:** Two top-level groups — `/` (customer) and `/admin` (existing admin)
- **Cart:** localStorage-backed composable (not Pinia, not server-side)
- **Orders:** Extend `api.orders` with `update()` (PATCH items) and `delete()` (cancel)
- **Customer identity:** Lightweight, no real auth — localStorage-based session
- **WebSocket:** Reuse existing `order:update` with client-side filtering by customerId
- **No backend changes:** All operations map to existing json-server REST endpoints

Key differentiators to synthesize across the 3:
- **From A-B:** Route file separation (`routes/admin.ts` + `routes/customer.ts`) and `beforeEach` redirect guard
- **From B-1:** UUID guest session model (no phone gate), namespaced query keys, risk mitigations
- **From A-A:** Core composable structure (`useCustomerCart`, `useCustomerSession`, `useCustomerOrders`), RedirectShim pattern
