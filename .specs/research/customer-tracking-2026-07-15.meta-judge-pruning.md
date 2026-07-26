```yaml
meta:
  title: "Customer-Facing Live Order Tracking — Proposal Pruning"
  task: >
    Design and implement a customer-facing live order tracking feature for a Cloud Kitchen ERP.
    Includes (1) public tracking page — a guest enters an order number and sees real-time status,
    and (2) customer portal — logged-in customers see all their orders with live updates.
  artifact_type: proposals
  artifact_description: >
    High-level approach documents with probability estimates, architecture sketches,
    component trees, data flow diagrams, and risk assessments. Not full implementations.
  selection_count: 3
  evaluation_focus:
    - Feasibility
    - Alignment with requirements
    - Potential for high-quality result
    - Risk manageability

criteria:
  - id: feasibility
    label: Feasibility
    weight: 0.25
    description: >
      Can this approach be implemented within the existing stack with reasonable effort?
      Does it work within the current architecture (no auth, singleton WS, flat routes,
      json-server, no customerId on Order type) or does it require foundational changes?
    rubric:
      5: >
        Fully implementable with existing stack. All changes are scoped to adding new
        modules/views/routes without modifying existing KDS/inventory/menu/analytics
        code. Works within current auth-less, flat-route, global-WS-broadcast constraints.
      4: >
        Mostly implementable. Requires 1-2 small additions to shared infrastructure
        (e.g., adding fields to Order type, extending server.js) but no architectural
        overhaul. No changes to existing module code.
      3: >
        Requires moderate foundational changes (e.g., adding an auth system, modifying
        the WS singleton pattern, restructuring routes). Some risk of regressions in
        existing modules.
      2: >
        Requires significant architectural changes (new server endpoints, auth system,
        WebSocket room management, data model migration). High effort-to-value ratio.
      1: >
        Not feasible within the current stack. Would require a complete backend rewrite,
        new database, or authentication provider.

  - id: requirements_coverage
    label: Requirements Coverage
    weight: 0.25
    description: >
      How completely does the proposal address both features (public tracking page and
      customer portal) and all stated constraints (stack, auth-less, route structure,
      WS broadcast pattern, json-server backend)?
    rubric:
      5: >
        Fully addresses both features with explicit handling of all constraints.
        Names specific files, routes, components, and composables. Includes plan for
        the auth-less customer portal (e.g., localStorage-based identity, session
        cookie, or pragmatic mock). Addresses the global WS broadcast — explains how
        client-side filtering works. Covers error states, loading states, and empty states.
      4: >
        Addresses both features thoroughly. Clear plan for fitting into the existing
        route structure and WS pattern. May have minor gaps (e.g., mentions auth
        as "future work" but provides a viable interim approach).
      3: >
        Addresses both features but at a high level. Missing details on how the
        customer portal works without auth. Doesn't fully address the WS broadcast
        filtering or route integration.
      2: >
        Addresses one feature well but the other superficially. Major gaps in
        constraint handling (e.g., assumes auth exists, ignores flat route structure).
      1: >
        Fails to address core requirements. Misses key constraints or proposes
        solutions incompatible with the existing system.

  - id: solution_quality_potential
    label: Solution Quality Potential
    weight: 0.20
    description: >
      How good would the resulting implementation be? Considers UX quality (real-time
      feel, loading states, error handling), code quality (type safety, composable
      reuse, testability), and visual polish (PrimeVue integration, UnoCSS usage).
    rubric:
      5: >
        Would produce a polished UX with skeleton loaders, optimistic updates,
        proper error boundaries, and real-time indicators. Type-safe throughout.
        Reuses existing composables (useOrderFeed, useOrderFlow) or extends them
        cleanly. First-class PrimeVue components with UnoCSS styling matching existing
        modules. Testable design with separated concerns.
      4: >
        Would produce a good UX with loading/error/empty states. Mostly type-safe.
        Some composable reuse. Good visual consistency with existing modules.
        Reasonably testable.
      3: >
        Would produce a functional but basic UX. Minimal loading/error states.
        Some duplicated logic. Visually acceptable but not pixel-perfect.
        Moderate testability.
      2: >
        Would produce a working but rough UX. Sparse error handling. Tight coupling
        to existing modules. Visual drift from existing app style.
      1: >
        Would produce a poor UX. No loading/error states. Fragile implementation.
        Visually inconsistent.

  - id: technical_specificity
    label: Technical Specificity
    weight: 0.15
    description: >
      How concrete and actionable is the proposal? Does it name specific files,
      components, composables, types, routes, and data structures? Are the
      probability estimates grounded in specific risks?
    rubric:
      5: >
        Named files, components, composables, types, and routes for every addition.
        Specific data structures (interfaces/types) for new entities. Concrete
        probability estimates with reasoning tied to specific technical risks.
        Diagrams or pseudo-code for the critical path.
      4: >
        Most additions are named. Some pseudo-code or type signatures. Probability
        estimates are present and reasonable, though reasoning may be generic.
      3: >
        High-level architecture with some named components. Probability estimates
        present but may be vague. Missing details on data structures or route design.
      2: >
        Mostly conceptual. Few specific file/component names. Probability estimates
        are guesswork or missing.
      1: >
        Entirely conceptual. No specific implementation details. No probability
        estimates or empty justifications.

  - id: risk_management
    label: Risk Manageability
    weight: 0.15
    description: >
      How well does the proposal identify, assess, and mitigate risks? Key risks
      include: no auth system, global WS broadcast (no room scoping), no customerId
      on Order type, flat route structure with /kds redirect, json-server limitations
      (no real DB queries), and potential regression in existing KDS functionality.
    rubric:
      5: >
        Explicitly identifies all relevant risks with clear mitigations. Has a
        rollback or incremental adoption strategy. Addresses the auth gap creatively
        (e.g., anonymous sessions, order-reference tokens) rather than deferring it.
        Considers WS message volume and client-side filtering cost.
      4: >
        Identifies most key risks with reasonable mitigations. May defer 1-2 risks
        to "future work" but has a viable interim approach. Some consideration of
        edge cases.
      3: >
        Identifies some risks but mitigations are vague or generic ("test thoroughly").
        Defers auth or WS filtering without a clear interim plan.
      2: >
        Identifies few risks. Mitigations are absent or unrealistic. No consideration
        of auth or WS constraints.
      1: >
        No risk identification. Assumes everything "just works." No mitigations.

validations:
  - id: existing-patterns
    description: Must follow existing code conventions
    check: >
      Proposal should use singleton WS pattern (not create new Socket.IO instances),
      extend api/client.ts rather than create new Axios instances, use Vue Router lazy
      loading, follow PrimeVue 4 composition API patterns, use UnoCSS utility classes,
      and follow the existing module directory structure.
  - id: auth-gap
    description: Must address the absence of authentication
    check: >
      Proposal must explicitly state how the "customer portal" works without a login
      system. Acceptable approaches include: localStorage-based session mock, query
      parameter tokens, order-reference tokens (e.g., order number + phone last 4),
      or a pragmatic "demo mode" that shows all orders. Proposals that assume auth
      exists are penalized.
  - id: ws-constraint
    description: Must work with global order:update broadcasts
    check: >
      Proposal must explain how client-side filtering of global WS events works
      without server-side room scoping. Should consider whether the existing singleton
      in useOrderFeed.ts can be reused or needs extension.
  - id: route-structure
    description: Must integrate with flat route hierarchy
    check: >
      Proposal must specify how customer routes (public tracking, customer portal)
      fit under or alongside AppLayout without breaking the /kds auto-redirect. Should
      consider separate layouts for public pages vs. authenticated dashboard.

scoring:
  method: weighted_sum
  scale: 1-5
  weights:
    feasibility: 0.25
    requirements_coverage: 0.25
    solution_quality_potential: 0.20
    technical_specificity: 0.15
    risk_management: 0.15
  tiebreaker:
    - feasibility
    - requirements_coverage
    - solution_quality_potential
    - technical_specificity
    - risk_management

judging_instructions:
  process:
    - step: 1
      action: "Read all proposals in full before scoring any single proposal"
    - step: 2
      action: "Score each proposal on all 5 criteria using the rubrics"
    - step: 3
      action: "Calculate final_score = weighted sum of criterion scores"
    - step: 4
      action: "Sort by final_score descending; apply tiebreaker sequence if needed"
    - step: 5
      action: "Select top 3; write rationale for each selection and why bottom proposals were excluded"
  output:
    format: >
      YAML block within markdown document. Include all scores, top 3 ranking, rationale,
      and any concerns about the selected proposals. Follow the existing convention in
      .specs/research/*.pruning.*.md
    sections:
      - scores (list of all proposals with criteria scores and final_score)
      - top_3 (ranked list with proposal_id and final_score)
      - rationale (explanation for top 3 and notable bottom proposals)
      - concerns (actionable concerns about each selected proposal)

domain_context:
  order_type_fields: >
    Current Order type has: id, orderNumber, source, customerName, items, totalAmount,
    status (pending|preparing|ready|dispatched|cancelled), brandId, timestamps
    (placedAt, startedAt, readyAt, dispatchedAt), prepTimeTarget. No customerId,
    customerEmail, or phone fields exist.
  server_capabilities: >
    json-server with router.render interceptor. No custom routes, no database queries
    beyond json-server defaults, no room-scoped WS emits. All order:update broadcasts
    go to every connected client.
  singleton_ws: >
    useOrderFeed.ts maintains a singleton Socket.IO instance. It currently hardcodes
    order:update handling via queryClient.setQueryData for the ['orders'] query key.
    New consumers would need to either extend this handler or add separate listeners.
  route_infrastructure: >
    All existing routes are children of AppLayout. Root path '/' redirects to '/kds'.
    No public/guest routes, no auth guards, no named views for customer-facing pages.
```

# Evaluation Specification — Customer-Facing Live Order Tracking

## Purpose

This specification defines rubrics and processes for evaluating high-level solution
proposals for the customer-facing live order tracking feature. It is used by judge
agents to score, rank, and select the top 3 proposals for full development.

## Usage

Judges read all proposals, score each on the 5 criteria using the rubrics above,
calculate weighted final scores, apply tiebreakers, and produce a ranked output
following the YAML schema.

## Key Domain Constraints

| Constraint | Implication for Proposals |
|---|---|
| No auth system | Customer portal must use a lightweight session mechanism (localStorage, token param, demo mode) |
| No `customerId` on `Order` | Public tracking works by orderNumber lookup; portal must filter by some surrogate key |
| Global `order:update` broadcasts | Client must filter incoming WS events to only matching orders |
| Flat routes under AppLayout | Public tracking page may need a separate layout or route above AppLayout |
| json-server backend | No complex queries; filtering happens client-side or via query params |
| Singleton Socket.IO | Proposal must either extend the existing singleton or add a second connection |
