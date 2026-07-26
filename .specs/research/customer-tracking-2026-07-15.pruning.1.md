```yaml
evaluation:
  meta:
    judge_id: 1
    proposal_count: 18
    select_count: 3
    weights:
      feasibility: 0.25
      requirements_coverage: 0.25
      solution_quality_potential: 0.20
      technical_specificity: 0.15
      risk_management: 0.15
  scores:
    - proposal_id: a-a1
      label: "Guest-Only Order-Number Lookup"
      feasibility: 5
      requirements_coverage: 2
      solution_quality_potential: 4
      technical_specificity: 5
      risk_management: 3
      final_score: 3.75
    - proposal_id: a-a2
      label: "Dual-Mode: Guest + Customer with LocalStorage Auth"
      feasibility: 4
      requirements_coverage: 5
      solution_quality_potential: 4
      technical_specificity: 5
      risk_management: 4
      final_score: 4.40
    - proposal_id: a-a3
      label: "Full Customer Portal with JWT + Server Room Scoping"
      feasibility: 2
      requirements_coverage: 5
      solution_quality_potential: 5
      technical_specificity: 5
      risk_management: 3
      final_score: 3.95
    - proposal_id: a-a4
      label: "Hashed-Order-Token Guest Tracking"
      feasibility: 4
      requirements_coverage: 2
      solution_quality_potential: 3
      technical_specificity: 4
      risk_management: 3
      final_score: 3.15
    - proposal_id: a-a5
      label: "SSE Public / WS Customer Split"
      feasibility: 2
      requirements_coverage: 3
      solution_quality_potential: 3
      technical_specificity: 4
      risk_management: 3
      final_score: 2.90
    - proposal_id: a-a6
      label: "Embeddable Widget SDK"
      feasibility: 1
      requirements_coverage: 2
      solution_quality_potential: 2
      technical_specificity: 4
      risk_management: 2
      final_score: 2.05
    - proposal_id: b-a
      label: "Anonymous Order Lookup + Client-Side Filtering"
      feasibility: 5
      requirements_coverage: 2
      solution_quality_potential: 3
      technical_specificity: 4
      risk_management: 3
      final_score: 3.40
    - proposal_id: b-b
      label: "Anonymous Order Lookup + Server-Side Room Scoping"
      feasibility: 4
      requirements_coverage: 2
      solution_quality_potential: 4
      technical_specificity: 4
      risk_management: 4
      final_score: 3.50
    - proposal_id: b-c
      label: "Phone-Based Customer Identity with Pinia Store"
      feasibility: 3
      requirements_coverage: 5
      solution_quality_potential: 4
      technical_specificity: 4
      risk_management: 3
      final_score: 3.85
    - proposal_id: b-d
      label: "QR-Code-First Embedded Token"
      feasibility: 4
      requirements_coverage: 2
      solution_quality_potential: 3
      technical_specificity: 3
      risk_management: 3
      final_score: 3.00
    - proposal_id: b-e
      label: "Event Sourcing with SSE Fallback"
      feasibility: 1
      requirements_coverage: 2
      solution_quality_potential: 3
      technical_specificity: 4
      risk_management: 3
      final_score: 2.40
    - proposal_id: b-f
      label: "WebSocket-Less Polling with SWR Pattern"
      feasibility: 5
      requirements_coverage: 3
      solution_quality_potential: 2
      technical_specificity: 3
      risk_management: 3
      final_score: 3.30
    - proposal_id: c-a
      label: "Composable Overlay"
      feasibility: 5
      requirements_coverage: 4
      solution_quality_potential: 4
      technical_specificity: 4
      risk_management: 3
      final_score: 4.10
    - proposal_id: c-b
      label: "Dedicated Customer Socket"
      feasibility: 4
      requirements_coverage: 3.5
      solution_quality_potential: 4
      technical_specificity: 3
      risk_management: 3
      final_score: 3.58
    - proposal_id: c-c
      label: "Server-Scoped Rooms"
      feasibility: 4
      requirements_coverage: 5
      solution_quality_potential: 5
      technical_specificity: 5
      risk_management: 4
      final_score: 4.60
    - proposal_id: c-d
      label: "Polling-First, Progressive Enhancement"
      feasibility: 4
      requirements_coverage: 3
      solution_quality_potential: 2
      technical_specificity: 3
      risk_management: 3
      final_score: 3.05
    - proposal_id: c-e
      label: "Embeddable Widget / Micro-Frontend"
      feasibility: 1
      requirements_coverage: 2
      solution_quality_potential: 2
      technical_specificity: 4
      risk_management: 2
      final_score: 2.05
    - proposal_id: c-f
      label: "Reactively Scoped Pinia Store"
      feasibility: 5
      requirements_coverage: 4
      solution_quality_potential: 3.5
      technical_specificity: 4
      risk_management: 3
      final_score: 4.00
  top_3:
    - rank: 1
      proposal_id: c-c
      label: "Server-Scoped Rooms (File C)"
      final_score: 4.60
    - rank: 2
      proposal_id: a-a2
      label: "Dual-Mode: Guest + Customer with LocalStorage Auth (File A)"
      final_score: 4.40
    - rank: 3
      proposal_id: c-a
      label: "Composable Overlay (File C)"
      final_score: 4.10
  rationale:
    top_3:
      - rank: 1
        proposal_id: c-c
        reason: >-
          Clear winner across all dimensions. Combines the best architectural
          foundation (Socket.IO rooms — the idiomatic solution for scoped
          broadcasts) with full requirements coverage (both guest tracking via
          order-level rooms and customer portal via customer-level rooms).
          Handles the auth gap pragmatically by using customerId + localStorage
          rather than over-engineering JWT. The proposal is the most technically
          specific of the field — it names every composable, event, room pattern,
          and server.js change with pseudo-code. Risk management is strong,
          identifying the fetch-before-join race condition, dual-broadcast pattern,
          and KDS migration path. The moderate server.js work is well-scoped and
          does not touch any existing module code. Scalable to thousands of
          concurrent customers — unlike every client-filter approach.
      - rank: 2
        proposal_id: a-a2
        reason: >-
          Second place due to strong requirements coverage (5/5) — it is the only
          proposal in the high-probability cluster that fully designs BOTH the
          guest tracking page AND the customer portal end-to-end. The PIN-in-
          localStorage identity is a pragmatic, implementable answer to the auth
          gap. Data model changes (customerId on Order, customers resource) are
          forward-compatible with real auth. Technical specificity is excellent
          (named files, composable signatures, store design, route layout).
          Slightly behind C-C on architectural quality because client-side
          filtering of global WS broadcasts wastes bandwidth and the dual-singleton
          pattern (KDS + customer) adds connection management complexity. But for
          teams that want both features working in days, this is the most complete
          package.
      - rank: 3
        proposal_id: c-a
        reason: >-
          The highest-feasibility approach (5/5) with zero server changes and full
          reuse of the existing singleton WS. Covers both features with a clean
          composable abstraction and sensible module structure. Customer portal
          identity is handled via customerId stored in localStorage — lightweight
          and sufficient for MVP. The composable overlay pattern means this can be
          built without touching any existing KDS/inventory/menu/analytics code.
          Scores lower than #1 and #2 because its risk management is weaker
          (client-side filtering bandwidth waste is acknowledged but not mitigated;
          no real security boundary) and the composable design is less detailed
          than A-A2 or C-C. However, this is the safest pick for immediate
          delivery and can evolve into C-C (Server-Scoped Rooms) as a natural
          second phase.
    bottom_15:
      - proposal_id: a-a3
        weakness: >-
          Full JWT + auth system is over-engineered for the current json-server
          prototype. Feasibility drops to 2/5 because it requires a complete auth
          middleware layer, password hashing, token refresh, and route guards.
          The 10+ file footprint and risk of regressions in existing server.js
          behavior make this disproportionate to the task scope. Best deferred
          until a real backend replaces json-server.
      - proposal_id: b-c
        weakness: >-
          Phone-based OTP identity is the most complete auth solution among the
          high-probability proposals, but the simulated OTP (console.log) is not
          real auth — customers could enter any phone and see those orders.
          Requires 12+ files including server.js changes, a new customers resource,
          and data migration. The OTP flow adds complexity that is unjustified
          when localStorage-based identity achieves the same UX outcome for an MVP.
      - proposal_id: a-a1
        weakness: >-
          Only addresses guest tracking — no customer portal at all. While
          technically excellent (zero server changes, 3 files), it fails to meet
          half the stated requirements. The order-number guessing vulnerability
          is a genuine privacy concern with no mitigation.
      - proposal_id: c-f
        weakness: >-
          Solid zero-server-change approach using Pinia as the state hub, but the
          store couples WebSocket logic with UI state (testability concern) and
          risks becoming a god object. The TanStack Query cache / Pinia store
          duality is an unresolved tension. Slightly lower solution quality
          potential than C-A due to this coupling.
      - proposal_id: b-b
        weakness: >-
          Server-side room scoping is architecturally sound but only addresses
          guest tracking — the customer portal identity problem is not solved.
          Room join/leave lifecycle adds complexity without covering the full
          requirement set. C-C from File C is a strictly better version of this
          approach that also addresses the customer portal.
      - proposal_id: b-a
        weakness: >-
          Minimal server changes but fails the customer portal requirement. The
          "portal" is just a list of tracked numbers in localStorage — no real
          customer identity or order history. Overshadowed by C-A which covers
          the same ground more completely.
      - proposal_id: b-f
        weakness: >-
          Polling-only with no WebSocket. The 3-second polling interval defeats
          the "real-time" requirement. json-server rate limiting at scale is a
          genuine concern. Acceptable as a fallback but not as a primary approach.
      - proposal_id: a-a4
        weakness: >-
          The hashed-token concept adds real privacy value (unguessable tracking
          URLs) but is guest-only. Pairs naturally with A-A2 or C-C as a future
          enhancement rather than a standalone approach.
      - proposal_id: c-d
        weakness: >-
          Polling-first with WebSocket progressive enhancement. The 5-second
          polling baseline is not real-time. The WebSocket upgrade adds
          complexity without committing to a proper real-time architecture.
      - proposal_id: b-d
        weakness: >-
          QR-code-first UX eliminates the lookup form but is guest-only and
          depends on a receipt-printing workflow that may not apply to this
          cloud kitchen's operating model. QR generation adds a dependency.
      - proposal_id: a-a5
        weakness: >-
          SSE-for-guests + WS-for-customers split introduces two real-time
          transport systems to maintain. The server-side EventEmitter refactor
          plus SSE endpoint creates architectural debt disproportionate to the
          benefit. SSE connection limits and browser compatibility are additional
          risks.
      - proposal_id: b-e
        weakness: >-
          Event sourcing with SSE fallback is dramatically over-engineered for
          a json-server prototype. In-memory event log is lost on server restart.
          Two real-time stacks (Socket.IO + SSE) create permanent duplication
          of all real-time features.
      - proposal_id: a-a6
        weakness: >-
          Web Component widget SDK is architecturally misaligned with the Vue 3
          codebase. Shadow DOM breaks PrimeVue/UnoCSS styling. Separate build
          pipeline and dual-transport (polling default, optional WS) add
          maintenance burden. Style isolation gains do not justify the cost.
      - proposal_id: c-e
        weakness: >-
          Embeddable widget / micro-frontend with SSE is a parallel product, not
          an ERP feature. Two build pipelines, two codebases, iframe CORS issues,
          and style inconsistency make this the worst fit for the task. The
          SSE endpoint bypasses json-server entirely.
      - proposal_id: c-b
        weakness: >-
          Dedicated customer socket creates a second singleton connection for a
          questionable benefit — the same filtering can be done with the existing
          singleton. The server double-emit (order:update + customer:order:update)
          doubles Socket.IO traffic. Customer portal identity is not clearly
          addressed.
  concerns:
    - proposal_id: c-c
      concerns:
        - >-
          Room join race condition: the client must fetch the order first to get
          its ID, then join the room. If the order status changes between the
          fetch response and the room join, the client misses that update.
          Mitigation: after joining the room, re-fetch the order to reconcile
          any missed events, or use the server to send the current state as part
          of the room join acknowledgement.
        - >-
          Dual broadcast in server.js (global for KDS + room for customers)
          means the router.render interceptor emits two Socket.IO events per
          status change. This should be benchmarked: at ~1000 status changes/hour
          the overhead is negligible, but the pattern should be documented to
          prevent accidental double-processing in future features.
        - >-
          The customer portal still has no real auth — customerId is stored in
          localStorage and the room join is unauthenticated. A malicious user
          who discovers another customer's customerId (e.g., by inspecting the
          localStorage shape or guessing UUIDs) can subscribe to their room.
          For an MVP this is acceptable, but the transition path to real auth
          (validating room join against a JWT or session) should be documented
          explicitly rather than deferred indefinitely.
        - >-
          Room name collision risk: if both KDS and customer pages run in the
          same browser, the room naming convention (order: vs customer:) must
          be strictly namespaced to avoid cross-talk. The proposal uses
          order:{id} and customer:{id} which is clean, but the convention
          should be enforced as a constant rather than string interpolation
          spread across files.
    - proposal_id: a-a2
      concerns:
        - >-
          Two WebSocket singletons (existing useOrderFeed for KDS + new
          useCustomerFeed for tracking) may conflict on connection lifecycle.
          If both attempt to connect/disconnect independently, the customer
          socket could be torn down while KDS depends on its own connection.
          Mitigation: ensure the KDS singleton's connect/disconnect lifecycle
          is independent of the customer singleton. Consider a shared connection
          manager rather than two independent io() calls.
        - >-
          PIN-in-localStorage is not real security. The PIN is stored in plain
          text (or fast-hashed) in localStorage accessible via DevTools. This
          is acceptable for an MVP demo but should be clearly labeled as
          "demo mode" in the UI to avoid setting false security expectations
          with stakeholders or during client demos.
        - >-
          Data migration of existing orders: adding customerId to all existing
          orders requires a one-time db.json migration script. The proposal
          mentions seeding synthetic customer IDs from customerName, but this
          is lossy (duplicate customerNames, "Walk-in Customer" entries).
          Recommend making customerId optional (nullable) and only assigning
          it to orders created after the feature ships. Guest tracking works
          on customerId-less orders via orderNumber.
        - >-
          The two-views-per-order pattern (KDS detail dialog timeline vs.
          customer StatusTimeline) creates visual drift risk. Both render
          the same status progression but for different audiences. Consider
          extracting a shared StatusTimeline component in a common module
          rather than maintaining parallel implementations.
    - proposal_id: c-a
      concerns:
        - >-
          Client-side filtering of global order:update broadcasts means every
          customer's browser tab receives and processes ALL order status changes
          from the kitchen. At 200+ orders/day, this is ~800 broadcast events
          per day per client — negligible. But if this scales to thousands of
          concurrent customer connections, the server broadcasts each update
          to every connected client, creating O(n) multiplier on WS traffic.
          This is the core scalability limit of the approach and should be
          documented as the trigger point for migrating to server-side rooms (C-C).
        - >-
          The composable overlay relies on the existing useOrderFeed singleton,
          which currently hardcodes queryClient.setQueryData for the ['orders']
          query key. If the customer tracker uses a different query key
          (e.g., ['order', orderNumber]), the existing handler won't update it.
          The composable must add its own order:update listener to the socket,
          not rely on the existing handler. This is mentioned in the proposal
          but the interaction with the existing handler (duplicate processing?)
          needs resolution.
        - >-
          No security boundary at all — anyone who knows an order number can
          track it. For a public demo this is fine, but for any production
          deployment, order numbers are sequential and trivially guessable.
          The proposal acknowledges this but offers no mitigation within scope.
          At minimum, the tracking page should rate-limit lookups per IP
          (even a simple in-memory counter in server.js) to slow enumeration.
        - >-
          The customer portal identity via localStorage customerId is the
          weakest auth model among the top 3. There is no PIN, no token, no
          barrier — just a string in localStorage. This should be treated as
          a "demo only" feature and clearly communicated as such. When the
          team adds real auth, the composable interface remains the same
          (it accepts a customerId) — the source of that ID changes.
```

# Evaluation Report — Judge 1

## Process Summary

Read all 18 proposals across 3 files (A-A1 through A-A6, B-A through B-F, C-A through C-F). Each proposal was scored on 5 criteria (feasibility, requirements coverage, solution quality potential, technical specificity, risk management) using the 1–5 rubrics defined in the pruning evaluation specification. Weighted final scores were calculated using the defined weights (feasibility 0.25, requirements coverage 0.25, solution quality 0.20, technical specificity 0.15, risk management 0.15). Proposals sorted by final score descending; tiebreaker sequence applied per spec.

## Scoring Breakdown

### Top 3 Selection

| Rank | Proposal | File | Feas. | Req. Cov. | Sol. Qual. | Tech. Spec. | Risk Mgmt. | **Final** |
|------|----------|------|-------|-----------|------------|-------------|------------|-----------|
| 1 | **C-C: Server-Scoped Rooms** | C | 4 | 5 | 5 | 5 | 4 | **4.60** |
| 2 | **A-A2: Dual-Mode Guest + Customer** | A | 4 | 5 | 4 | 5 | 4 | **4.40** |
| 3 | **C-A: Composable Overlay** | C | 5 | 4 | 4 | 4 | 3 | **4.10** |

### Full Leaderboard

| Rank | Proposal | Feas. | Req. Cov. | Sol. Qual. | Tech. Spec. | Risk Mgmt. | **Final** |
|------|----------|-------|-----------|------------|-------------|------------|-----------|
| 1 | C-C: Server-Scoped Rooms (File C) | 4 | 5 | 5 | 5 | 4 | **4.60** |
| 2 | A-A2: Dual-Mode Guest + Customer (File A) | 4 | 5 | 4 | 5 | 4 | **4.40** |
| 3 | C-A: Composable Overlay (File C) | 5 | 4 | 4 | 4 | 3 | **4.10** |
| 4 | C-F: Reactively Scoped Pinia Store (File C) | 5 | 4 | 3.5 | 4 | 3 | **4.00** |
| 5 | A-A3: Full JWT + Server Rooms (File A) | 2 | 5 | 5 | 5 | 3 | **3.95** |
| 6 | B-C: Phone-Based Customer Identity (File B) | 3 | 5 | 4 | 4 | 3 | **3.85** |
| 7 | A-A1: Guest-Only Order-Number Lookup (File A) | 5 | 2 | 4 | 5 | 3 | **3.75** |
| 8 | C-B: Dedicated Customer Socket (File C) | 4 | 3.5 | 4 | 3 | 3 | **3.58** |
| 9 | B-B: Server-Side Room Scoping (File B) | 4 | 2 | 4 | 4 | 4 | **3.50** |
| 10 | B-A: Client-Side Filtering (File B) | 5 | 2 | 3 | 4 | 3 | **3.40** |
| 11 | B-F: Polling SWR (File B) | 5 | 3 | 2 | 3 | 3 | **3.30** |
| 12 | A-A4: Hashed-Order-Token (File A) | 4 | 2 | 3 | 4 | 3 | **3.15** |
| 13 | C-D: Polling-First Enhancement (File C) | 4 | 3 | 2 | 3 | 3 | **3.05** |
| 14 | B-D: QR-Code-First Token (File B) | 4 | 2 | 3 | 3 | 3 | **3.00** |
| 15 | A-A5: SSE/WS Split (File A) | 2 | 3 | 3 | 4 | 3 | **2.90** |
| 16 | B-E: Event Sourcing + SSE (File B) | 1 | 2 | 3 | 4 | 3 | **2.40** |
| 17 | A-A6: Embeddable Widget SDK (File A) | 1 | 2 | 2 | 4 | 2 | **2.05** |
| 18 | C-E: Embeddable Widget/MFE (File C) | 1 | 2 | 2 | 4 | 2 | **2.05** |

### Reasoning

**#1 C-C: Server-Scoped Rooms (File C) — 4.60**

The standout proposal. It solves the core architectural problem (global WS broadcast) with the idiomatic Socket.IO solution: rooms. The proposal addresses both required features with a unified, scalable pattern — order-level rooms for guest tracking, customer-level rooms for the portal. The auth gap is handled pragmatically (customerId + localStorage, no JWT over-engineering), matching the existing stack's maturity level. Technical specificity is exceptional: named composables (`useCustomerFeed`), event signatures (`join`, `order:update` room patterns), server.js pseudo-code, and explicit room naming conventions. Risk management is strong — the race condition between fetch and room join is called out with a clear mitigation. The proposal's phased evolution path (start with rooms, add auth later) is realistic and well-articulated.

The only knock is feasibility (4/5): server.js requires moderate changes (room join handler, dual broadcast in router.render), and the Order type needs a `customerId` field. But these changes are scoped and don't touch any existing module code.

**#2 A-A2: Dual-Mode: Guest + Customer (File A) — 4.40**

The most complete feature-level proposal. It is the only one in the top 5 to fully design both the public tracking page AND the customer portal with equal depth. The PIN-in-localStorage identity mechanism is the most pragmatic answer to the auth gap — implementable in hours, no new infrastructure, and clearly labeled as "not real security" to set expectations. Data model changes (`customerId` on Order, new `customers` resource) are forward-compatible with real auth. Technical specificity matches C-C: named files (`useCustomerStore`, `useOrderTracker`, `StatusTimeline`, `CustomerPortal`), store signatures, composable interfaces, route layout.

Slightly behind C-C because client-side filtering of global WS broadcasts is wasteful at scale (every customer browser processes all kitchen events), and the dual-singleton WS pattern (KDS + customer) adds connection management complexity. However, for teams prioritizing feature completeness over architectural purity, this is the strongest choice.

**#3 C-A: Composable Overlay (File C) — 4.10**

The safest bet for immediate delivery. Perfect feasibility (5/5): zero server changes, full reuse of the existing singleton WS, no data model changes required. The composable overlay pattern (`useCustomerOrders`) extends the existing query/socket infrastructure cleanly. Routes are placed outside AppLayout, following the flat route convention. Customer portal identity via localStorage `customerId` is the simplest possible approach.

Lower scores on risk management (3/5) pull it below #1 and #2. Client-side filtering bandwidth waste is acknowledged but not mitigated. No security boundary at all — anyone who knows an order number can track it. The composable's interaction with the existing `useOrderFeed` handler (which hardcodes `['orders']` query key invalidation) needs resolution. However, this proposal is the ideal starting point: it ships today, demonstrates both features, and naturally evolves into C-C (Server-Scoped Rooms) as Phase 2 when traffic grows.

### Tiebreak Resolution

No ties in the top 3. The closest rankings are:

- **#4 C-F (4.00)** vs **#3 C-A (4.10)**: C-A's higher solution quality (4 vs 3.5) breaks the tie, driven by cleaner separation of concerns (composable vs. Pinia store coupling WS + UI state).

- **#5 A-A3 (3.95)** vs **#6 B-C (3.85)**: A-A3's feasibility (2) is a serious drag. Despite perfect req cov and solution quality, the JWT overhaul is disproportionate. B-C's phone identity approach is more feasible (3) and nearly as complete.

- **#7 A-A1 (3.75)** vs **#8 C-B (3.58)**: A-A1's feasibility (5) and specificity (5) are excellent, but req cov (2) — guest only, no portal — is a hard ceiling. C-B addresses portal but its identity story is unclear.

### Key Observations Across the Field

**High-probability cluster (3.75–4.60):** The top 7 proposals share three traits: they name specific files and composables, they work with (not against) the existing singleton WS and json-server constraints, and they either solve or pragmatically sidestep the auth gap. The separation between them comes down to how they balance architectural correctness vs. speed of delivery.

**The auth gap is decisive:** Proposals that assumed auth exists or deferred it entirely (B-B, B-A) lost significant ground on requirements coverage. Proposals that provided a concrete answer — even a simple one like localStorage PIN (A-A2) or customerId (C-C, C-A) — scored consistently higher.

**Client-side filtering is a valid MVP but has a ceiling:** Three of the top 7 rely on client-side filtering of global WS broadcasts (A-A2, C-A, C-F, A-A1). This is fine for an MVP but the bandwidth/scalability implications are real. C-C's room-based approach is the only one that solves this at the architecture level, which is why it ranks #1.

**Over-engineering is the fatal flaw:** The bottom 5 proposals (A-A6, C-E, B-E, A-A5, B-D) all share disproportionate complexity relative to the task. JWT auth (A-A3) also suffers from this — perfect solution quality but feasibility of 2 makes it an expensive choice for a json-server prototype.

**Polling-only approaches are non-starters for "real-time":** B-F and C-D both score below 3.10 despite high feasibility. The stated requirement is "real-time status updates" — polling at 3-5 second intervals does not satisfy this, regardless of implementation simplicity.

### Next-Phase Recommendations

For the expansion phase, the top 3 proposals should be developed with attention to:

- **C-C's race condition** between fetch and room join must be resolved early — the simplest mitigation is a post-join re-fetch to reconcile missed events.

- **A-A2's two-singleton conflict** risk should be addressed by extracting a shared connection manager composable that both the KDS and customer sockets reference, rather than two independent `io()` calls.

- **C-A's client-filtering bandwidth cost** should be measured at the start to establish a baseline. If the kitchen processes >500 orders/day, the bandwidth waste may justify accelerating the migration to C-C's room-based approach.

- **All three proposals** should agree on a common `customerId` field shape and seed data strategy to avoid divergent data models. The recommended approach: make `customerId` optional (nullable string) on existing orders, only populate it for new orders, and use `orderNumber` as the fallback lookup for guest tracking.
