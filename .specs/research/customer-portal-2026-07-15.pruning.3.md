# Customer Portal — Pruning Round: Top 3 Selection

**Date:** 2026-07-15
**Judge:** Automated evaluator
**Spec:** `customer-portal-2026-07-15.meta-judge-evaluation.md`

---

## Evaluation Report

```yaml
meta:
  total_proposals_evaluated: 18
  eliminated: 15
  selected: 3
  elimination_breakdown:
    clarity_fail: 0
    feasibility_below_threshold: 5
    architecture_below_threshold: 3
    req_alignment_below_threshold: 2
    ranked_below_top_3: 5

ranking:
  - rank: 1
    source: proposals.a.md
    approach: "A — Minimal Viable Portal"
    score_normalized: 93.78
    eliminated: false
    verdict: SELECTED
    summary: "Lowest-risk, fastest-delivery approach. Adds src/modules/customer/ as a new module, restructures router into / (CustomerLayout) and /admin (AppLayout) groups with a RedirectShim.vue for legacy paths. Cart is a localStorage-backed composable (useCustomerCart). Phone-based identity (useCustomerSession). Zero backend changes. Scores maximum on architecture (20/20) for clean composable split and data flow boundaries."

  - rank: 2
    source: proposals.a.md
    approach: "B — Admin-in-Subdirectory with Shim Layer"
    score_normalized: 93.78
    eliminated: false
    verdict: SELECTED
    summary: "Extracts admin routes into a separate file (routes/admin.ts), adds a beforeEach guard for legacy path redirects, enhances PublicLayout → CustomerLayout. Slightly more boilerplate than A but equally safe. Scores maximum on architecture (20/20) and ties with A on overall score. Differentiated from A by route-file separation strategy and beforeEach guard approach."

  - rank: 3
    source: proposals.a.md
    approach: "C — Gradual Migration with Feature Flags"
    score_normalized: 84.89
    eliminated: false
    verdict: SELECTED
    summary: "Three-phase approach: (1) build portal alongside existing routes, (2) introduce localStorage feature flag to gate admin migration, (3) remove flag. Safest rollback story — if portal breaks, don't flip the flag. Scores slightly lower on feasibility (11/15) due to incremental safety concerns (phased approach means codebase lives in an in-between state) and architecture (18/20) due to Phase 1 route collision risk (/menu admin vs /menu/browse customer). Included for diversity of migration strategy."

eliminated_candidates:
  - source: proposals.a.md
    approach: "D — Server-Generated Customer Sessions"
    score_normalized: 71.56
    eliminated: true
    reason: "Ranked below top 3 (score 71.56). Introduces server-side identity concern but otherwise similar to A with lower architecture score (16/20 — weaker on component modularity and data flow)."

  - source: proposals.a.md
    approach: "E — IFrame-Embedded Micro-Frontend"
    score_normalized: null
    eliminated: true
    reason: "Feasibility below threshold (< 8). Introduces major new dependency pattern (postMessage bridge, dual PrimeVue bundles, separate Vite build). Req alignment: fails req_8 (admin routes not moved — explicitly rejected). Architecture score < 10."

  - source: proposals.a.md
    approach: "F — Progressive Enhancement via Service Worker"
    score_normalized: null
    eliminated: true
    reason: "Feasibility below threshold (< 8). Introduces Service Worker, IndexedDB, idb-keyval, vite-plugin-pwa — four new dependencies/patterns. Effort estimate (6-8 days) but no breakdown. Incremental safety: 0 (big-bang SW infrastructure before any customer feature works)."

  - source: proposals.b.md
    approach: "1 — Route Prefix Restructure + Cart Module"
    score_normalized: 89.33
    eliminated: true
    reason: "Ranked below top 3 (score 89.33). Architecturally near-identical to A (proposals.a). Auth model score 3/5 (UUID session mentioned but less detailed than phone-based pattern). Does not add sufficient diversity beyond the three selected candidates."

  - source: proposals.b.md
    approach: "2 — Layout-Switching Root with Role Detection"
    score_normalized: null
    eliminated: true
    reason: "Architecture below threshold (< 10, scored 9/20). Route design score 0 — explicitly rejects /admin prefix requirement ('route paths don't need /admin prefix'). Flat route table with role-based layout swapping creates ambiguous URLs and no clear path migration story."

  - source: proposals.b.md
    approach: "3 — Dynamic Admin Prefix via Runtime Config"
    score_normalized: 69.78
    eliminated: true
    reason: "Ranked below top 3 (score 69.78). Introduces config.json fetch at startup (tech stack risk 3), inject/provide pattern for ADMIN_PREFIX, and factory functions for route generation. Over-engineered for a json-server backend. Effort estimate without breakdown."

  - source: proposals.b.md
    approach: "4 — Independent Customer SPA"
    score_normalized: null
    eliminated: true
    reason: "Feasibility below threshold (< 8). Two independent Vue app instances, multi-entry Vite build, separate router/Pinia instances. Tech stack risk 0 (multi-entry, TypeScript project references, dual runtime). Effort estimate (5-7 days) with no breakdown."

  - source: proposals.b.md
    approach: "5 — Middleware-Based Route Rewriting"
    score_normalized: null
    eliminated: true
    reason: "Architecture below threshold (< 10, scored 9/20). Route design score 0 — all routes at root level with no /admin prefix. Middleware gating instead of structural separation. Route name ambiguity risk identified but not mitigated."

  - source: proposals.b.md
    approach: "6 — State-Driven Single Surface"
    score_normalized: null
    eliminated: true
    reason: "Feasibility below threshold (< 8, scored 6/15). Tech stack risk 0 (useCustomerView state machine is a non-standard pattern). Incremental safety 3 (only additive for customer but state machine is a big architectural bet). Architecture score < 10."

  - source: proposals.c.md
    approach: "1 — Progressive Enhancement"
    score_normalized: 93.78
    eliminated: true
    reason: "Ranked below top 3 despite equal score (93.78). Architecturally identical to A (proposals.a) — same route nesting, same cart composable pattern, same phone-based identity. Does not add diversity. A (proposals.a) retained as the canonical representative of this approach due to slightly richer detail (explicit composable names, file structure, trade-off analysis)."

  - source: proposals.c.md
    approach: "2 — Feature-Sliced Customer Module"
    score_normalized: 69.78
    eliminated: true
    reason: "Ranked below top 3 (score 69.78). Introduces Pinia store for cart (over-engineered for json-server backend). Tech stack risk 3 (Pinia exists in deps but unused — new pattern). Feasibility 9/15. Architecture 14/20 (weaker on route design — factory functions not fully elaborated, auth model lacking detail)."

  - source: proposals.c.md
    approach: "3 — Domain-Driven Route Restructure"
    score_normalized: 69.78
    eliminated: true
    reason: "Ranked below top 3 (score 69.78). meta.domain tagging and dynamic layout component add indirection without clear benefit over simpler prefix approaches. Feasibility 9/15. Architecture 14/20 (weaker on component modularity — no composable breakdown, auth model lacks session specifics)."

  - source: proposals.c.md
    approach: "4 — Server-Backed Cart Resource"
    score_normalized: 60.44
    eliminated: true
    reason: "Ranked below top 3 (score 60.44). Requires server.js changes (custom routes, new carts resource, auto-increment logic). Feasibility 8/15 (at threshold — tech stack risk 0 for server changes). Architecture 12/20. Risk score 3 (aware but vague mitigations for orphan carts, concurrent edits)."

  - source: proposals.c.md
    approach: "5 — Socket-First Order Management"
    score_normalized: null
    eliminated: true
    reason: "Feasibility below threshold (< 8). Socket.IO-based mutations bypass REST entirely. Direct db.json writes bypass json-server consistency guarantees. Tech stack risk 0 (bypasses existing REST pattern). Effort 5-7 days with no breakdown. Risk of db.json file corruption under concurrent writes."

  - source: proposals.c.md
    approach: "6 — Offline-First PWA Customer Portal"
    score_normalized: null
    eliminated: true
    reason: "Feasibility below threshold (< 8). Very high complexity (8-10 days). Introduces Service Worker, IndexedDB, vite-plugin-pwa, navigator.sendBeacon. Effort estimate without breakdown. Incremental safety 0. Over-engineered for json-server backend with no conflict resolution for offline queue."

evaluation_notes:
  - "All three selected candidates come from proposals.a.md because that document produced the most diverse set of three distinct migration strategies (one-shot restructure, separate route files + guard, phased feature flag) while proposals.b.md and proposals.c.md clustered around minor variations of the same prefix-restructure approach."
  - "Proposals.a.md Approach A and proposals.c.md Approach 1 are architecturally identical. A (proposals.a) retained as canonical due to greater detail in composable naming, file structure, and trade-off analysis."
  - "Proposals.b.md Approach 1 scored 89.33 (4th place) but was excluded because it does not add diversity beyond the three selected candidates — same prefix-restructure strategy as A, same localStorage cart pattern, same phone-based identity."
  - "No proposals failed the clarity qualifier — all 18 provided sufficient architectural detail to identify files, composables, route tables, and data flow."
  - "The three selected approaches differ in migration strategy (one-shot vs. route-file-split vs. phased-flag), risk profile (low-low-medium), and implementation cost (2-3, 3-4, 4-5 days)."
```
