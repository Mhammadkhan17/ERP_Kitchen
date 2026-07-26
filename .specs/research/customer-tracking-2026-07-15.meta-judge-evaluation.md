```yaml
meta:
  title: "Customer-Facing Live Order Tracking — Full Solution Evaluation"
  task: >
    Design and implement a customer-facing live order tracking feature for a Cloud Kitchen ERP.
    Includes (1) public tracking page — a guest enters an order number and sees real-time status,
    and (2) customer portal — logged-in customers see all their orders with live updates.
  artifact_type: full_implementation
  artifact_description: >
    Complete solution specification documents with file paths, import paths, component trees,
    composable signatures, route definitions, type extensions, data flow diagrams, and
    integration points. Ready for direct implementation.
  number_of_solutions: 3

criteria:
  - id: architectural_integrity
    label: Architectural Integrity & Pattern Conformance
    weight: 0.20
    description: >
      How well does the solution fit into the existing architecture without unnecessary
      modification? Does it reuse the singleton Socket.IO from useOrderFeed.ts rather than
      creating new connections? Does it extend api/client.ts rather than creating new Axios
      instances? Does it follow the module directory structure (modules/<name>/views,
      modules/<name>/components, modules/<name>/composables)? Does it integrate with
      TanStack Vue Query 5 query keys and cache patterns? Does it work within the auth-less
      constraint (no login page, no guards, no auth store) rather than assuming auth exists?
    rubric:
      5: >
        Perfect pattern conformance. Reuses singleton WS (or extends it with a well-designed
        interface). Extends api/client.ts with new order lookup methods. Follows module
        directory structure exactly. Uses TanStack Vue Query for all data fetching with
        proper query keys and cache invalidation. Works entirely within the auth-less
        constraint. Zero changes to existing KDS/inventory/menu/analytics modules.
        Routes integrate cleanly without breaking /kds redirect.
      4: >
        Strong pattern conformance. Minor deviation (e.g., adds a modest utility file shared
        across modules, or creates one new Pinia store where a composable would suffice).
        No changes to existing module code. Still auth-compatible.
      3: >
        Moderate conformance. May create a separate WS connection instead of extending the
        singleton, or add a new Axios instance, or modify shared infrastructure in ways that
        risk regression. Still fits broadly within the architecture.
      2: >
        Weak conformance. Multiple pattern violations: new Socket.IO connections, new Axios
        instances, significant changes to existing shared code, or assumes auth exists.
      1: >
        Ignores existing architecture. Creates independent network layer, bypasses Vue Query,
        modifies server.js in ways that break existing WS behavior, or requires auth system.

  - id: requirements_completeness
    label: Requirements Completeness
    weight: 0.20
    description: >
      Does the solution fully address both features: (1) public tracking page where a guest
      enters an order number and sees real-time status, and (2) customer portal where
      logged-in customers see all their orders with live status updates? Are all states
      covered: loading, empty (no orders found), error (invalid order number, network failure),
      cancelled/dispatched terminal states, and real-time transition between states?
      For the customer portal, does the solution address identity without real auth?
    rubric:
      5: >
        Full coverage of both features with all states explicitly handled. Public tracking
        includes: order number input with validation, loading skeleton, order found view
        (items, timestamps, status), order not found error, network error, cancelled state,
        dispatched/completed state, and real-time status transitions via WS. Customer portal
        includes: identity creation/retrieval (localStorage, session, or token), order list
        with live updates, order detail view, empty state (no orders), and error handling.
        All states are specifically described with component names and data flow.
      4: >
        Both features covered with most states handled. May have minor gaps (e.g., handles
        order-not-found but not network error explicitly, or covers loading but not cancelled
        state). Identity mechanism for customer portal is addressed but may be minimal.
      3: >
        Both features covered functionally but states are uneven. One feature is detailed
        while the other is sketched. Some states missing (e.g., no empty state for customer
        portal, no error handling for invalid order number).
      2: >
        One feature fully detailed, other missing or superficial. States largely unaddressed.
        Customer portal identity mechanism not credibly solved.
      1: >
        Fails to address one or both features. Major missing pieces. No state handling.

  - id: real_time_implementation
    label: Real-Time Implementation Correctness
    weight: 0.18
    description: >
      How correctly and efficiently does the solution implement real-time updates via the
      existing Socket.IO infrastructure? Key challenges: (1) the server broadcasts order:update
      globally (no room scoping) so client-side filtering is required, (2) the singleton in
      useOrderFeed.ts currently hardcodes queryClient.setQueryData for the ['orders'] key,
      (3) incoming WS payloads contain only { id, status, orderNumber } — not the full order
      object. Does the solution correctly handle partial payloads? Does it use optimistic
      updates or rely entirely on WS events? Does it handle race conditions between WS events
      and query refetches? Does it handle socket reconnection gracefully (stale orders,
      missed events)?
    rubric:
      5: >
        Exemplary real-time implementation. Explains exactly how client-side filtering works
        (e.g., checks payload.orderNumber against the tracked order number, or payload.id
        against a Set of customer order IDs). Handles partial payloads correctly (merges
        status only, does not overwrite full order). Addresses race conditions (e.g., uses
        queryClient.setQueryData with a merge function, not a full replace). Covers
        reconnection: fetches fresh order data on reconnect to catch missed events. Handles
        the case where WS event arrives for an order not yet in cache (fetches it).
        Considers performance of O(n) filtering for many orders.
      4: >
        Good real-time implementation. Client-side filtering explained. Partial payload
        handling is reasonable (may merge status into cached order). Reconnection handling
        is addressed (e.g., invalidates queries on reconnect). One edge case may be
        unaddressed (e.g., WS event for uncached order falls back to full refetch).
      3: >
        Functional real-time implementation. Client-side filtering is present but may be
        naive (e.g., checks payload.id === currentOrderId). Partial payload handling may
        overwrite cached order entirely. Reconnection handling is mentioned but not detailed.
        Some risk of race conditions not addressed.
      2: >
        Weak real-time implementation. Filtering is unclear or missing (assumes server-side
        scoping that doesn't exist). May create a second Socket.IO connection unnecessarily.
        Reconnection not addressed. High risk of stale data or missed updates.
      1: >
        No real-time implementation or fundamentally incorrect approach. Ignores the global
        broadcast constraint. Does not use Socket.IO at all, relying only on polling.

  - id: code_structure_specificity
    label: Code Structure & Technical Specificity
    weight: 0.17
    description: >
      How concrete, actionable, and well-structured is the solution? Are all file paths
      specified (e.g., src/modules/tracking/composables/useOrderTracking.ts)? Are type
      definitions provided (new interfaces, type extensions, or type guards)? Are component
      interfaces defined (props, emits, slots)? Are composable signatures provided (inputs,
      outputs, side effects)? Are route definitions specified with names, paths, and
      component imports? Is the import graph clear and acyclic? Are there any circular
      dependency risks?
    rubric:
      5: >
        Every file is named with its full project path. Every new type/interface is defined.
        Every component has explicit props/emits/slots. Every composable has a typed
        signature. Route definitions are complete. The import graph is acyclic and
        documented. A developer could implement from the spec without design decisions.
      4: >
        Most files are named with full paths. Types are defined for the critical path.
        Component interfaces are specified for key components. Route definitions are
        present. Minor omissions (e.g., a utility function's signature is described but
        not typed). No circular dependencies.
      3: >
        Files are named but may use relative paths inconsistently. Types are mentioned
        but not fully defined. Component props are described but not explicitly listed.
        Route definitions are at the right level of detail but may skip some edge routes.
        Import structure is reasonable but could have coupling concerns.
      2: >
        Sparse naming — some files are implied rather than stated. Types are described
        verbally rather than defined. Component structure is vague. Route integration
        is hand-wavy. Import coupling issues may exist.
      1: >
        No file paths, no type definitions, no component interfaces. Purely architectural
        description without implementation detail.

  - id: error_handling_robustness
    label: Error Handling & Robustness
    weight: 0.10
    description: >
      How thoroughly does the solution address failure modes? Considers: network errors
      (API call failures), WebSocket disconnection/reconnection, invalid/malformed order
      numbers, order not found (404), server errors (500), JSON parse failures on payload,
      multiple rapid WS events for same order, stale browser tab with outdated cache,
      localStorage unavailability (private browsing), and concurrent API + WS updates.
    rubric:
      5: >
        Comprehensive error handling. Every failure mode listed above is explicitly addressed
        with specific behavior. User-visible error states are described (toast messages,
        inline error banners). Graceful degradation when WS disconnects (falls back to
        polling). localStorage access is wrapped in try/catch for private browsing. Error
        boundaries or per-component error states are used. Race conditions between WS and
        API are handled with merge semantics.
      4: >
        Strong error handling. Most failure modes addressed. WS disconnection has fallback
        behavior. User-facing error states are described. One or two edge cases may be
        acknowledged but not fully handled.
      3: >
        Basic error handling. Network errors and order-not-found are addressed. WS
        reconnection may be handled by Socket.IO defaults but no custom reconnection
        logic. localStorage not wrapped. Some edge cases unaddressed.
      2: >
        Minimal error handling. Only the most obvious errors (network failure) are
        addressed. No fallback for WS disconnection. No consideration of race conditions
        or edge cases.
      1: >
        No error handling. All errors are silent or crash the UI.

  - id: ui_ux_quality
    label: UI/UX Quality & Existing Conventions
    weight: 0.10
    description: >
      How well does the solution's UI align with the existing app's visual language?
      Uses PrimeVue 4 components (Tag, Chip, Button, Dialog) matching the existing KDS
      patterns? Uses UnoCSS utility classes and the project's shortcut conventions (card,
      btn-primary, input, field, skeleton, etc.)? Follows the existing color scheme and
      typography conventions (font-display for headings, font-mono for data, orange
      primary palette)? Provides appropriate loading states (skeleton components)?
      Provides appropriate empty states with messaging? For the public page, is the
      entry point (order number input) clear and accessible? Is the customer portal
      navigation sensible?
    rubric:
      5: >
        Pixel-perfect visual alignment with existing app. Uses same PrimeVue components
        with same patterns (Tag severity mapping, Chip source labels, Divider sections,
        Dialog for details). Uses UnoCSS shortcuts consistently. Loading uses skeleton
        classes. Empty states are informative. Public page has a clear, centered order
        input with subtle branding. Customer portal fits naturally into the app's layout.
        Status indicator for WS connection state is included (matching KDS "live"/"offline"
        pattern). All visual states are described.
      4: >
        Good visual alignment. Most components and styling follow existing conventions.
        May introduce 1-2 new patterns that are reasonable. Loading/empty states present.
        WS connection indicator included. Minor visual drift acceptable.
      3: >
        Functional UI. Uses PrimeVue but may not follow the exact component usage
        patterns (e.g., uses Button differently than OrderCard.vue). UnoCSS usage is
        inconsistent. Loading states use generic spinners instead of skeletons.
        Empty states are minimal. WS indicator may be missing.
      2: >
        Weak UI alignment. Different component choices. Little UnoCSS usage — heavy
        reliance on custom CSS or inline styles. Visual drift is noticeable. No WS
        connection indicator.
      1: >
        Ignores existing UI conventions. Different styling approach. No PrimeVue
        component usage consistent with the app.

  - id: testability_and_maintainability
    label: Testability & Maintainability
    weight: 0.05
    description: >
      How testable and maintainable is the solution? Are concerns separated (composables
      own data logic, views own layout, components own rendering)? Are composables
      designed to be unit-testable without mounting components (accept parameters,
      return reactive values, no side effects at module scope)? Are API interactions
      abstracted through api/client.ts for easy mocking? Is the WS interaction isolated
      in a composable rather than embedded in a view? Are there any mutable module-level
      variables or singletons that would make testing flaky? Does the solution avoid
      tight coupling to specific PrimeVue component implementations?
    rubric:
      5: >
        Excellent separation of concerns. All data logic is in composables with clean
        typed interfaces. Views are thin orchestrators. WS interaction is isolated and
        composable-based (reuses or extends useOrderFeed cleanly). API calls go through
        api/client.ts. No module-level mutable state outside of the existing singleton
        pattern. Composables are designed for unit testing (accept parameters, no implicit
        dependencies). Routes are lazy-loaded with no side effects at import time.
      4: >
        Good separation. Most logic is in composables. Some stray logic may be in view
        components but it's minor. API and WS abstractions are clean. Reasonably testable.
      3: >
        Adequate separation. Views contain some data logic. WS interaction may be
        partially embedded in components. API calls may bypass client.ts (direct axios
        usage). Testability is moderate — would need integration tests rather than unit.
      2: >
        Poor separation. Views are thick with data logic. WS and API calls are mixed into
        components. Hard to test without full DOM rendering.
      1: >
        Monolithic approach. No separation of concerns. All logic in views. Untestable.

validations:
  - id: socket-reuse
    description: Must work with the existing singleton WS pattern or extend it cleanly
    check: >
      Solution should not create new Socket.IO connections unless providing a strong
      justification. The singleton in useOrderFeed.ts should be reused, extended with
      a composable interface, or replaced with a more general singleton that both the
      KDS and customer tracking modules can use. Creating a second WS connection is
      acceptable only if the solution explains why the singleton pattern can't work
      and demonstrates that the alternative is not wasteful.

  - id: api-client-extension
    description: Must extend api/client.ts for new order lookup endpoints
    check: >
      New API methods (e.g., lookup by orderNumber, lookup by customer identity) must
      be added to the existing api/client.ts file, not in a separate API module. Must
      follow the existing method signature patterns (typed params, promise returns).
      Must respect the /api base URL proxy and 10s timeout.

  - id: type-extensions
    description: Must define any new types or type extensions explicitly
    check: >
      If new fields are needed on existing types (e.g., customerId, customerEmail, phone
      on Order), they must be explicitly added to src/types/index.ts as optional fields
      (to avoid breaking existing data). New types (e.g., TrackingSession, CustomerProfile)
      must be defined in the same file or adjacent to the module using them.

  - id: route-integration
    description: Must integrate with the existing flat route hierarchy
    check: >
      Customer-facing routes must not break the existing '/' → '/kds' redirect. Public
      tracking page may be a top-level route (outside AppLayout children) or a child with
      a blank layout. Customer portal must work within or alongside AppLayout without
      requiring guards. All routes must use lazy loading (dynamic import).

  - id: no-auth-assumption
    description: Must not assume an authentication system exists
    check: >
      The solution must not rely on login pages, auth guards, auth stores, route guards,
      or token-based middleware. Customer portal identity must use lightweight mechanisms:
      localStorage session ID, order-reference tokens, query parameter tokens, or
      pragmatic demo mode. Any "auth" must be clearly labeled as a mock/interim solution.

  - id: server-compatibility
    description: Must work with json-server capabilities
    check: >
      Any server changes must be explicitly documented. If server.js is modified (e.g.,
      new routes, custom middleware, room scoping), the solution must specify the exact
      changes and verify they don't break existing KDS order:update broadcasts. If no
      server changes are needed, the solution must confirm this explicitly.

  - id: webSocket-payload-limitations
    description: Must handle the limited WS payload correctly
    check: >
      Server emits order:update with only { id, status, orderNumber }. The solution
      must not assume the full Order object arrives via WS. Solutions must handle
      merging partial status updates into cached Order objects retrieved via REST.

  - id: loading-initial-states
    description: Must handle loading, empty, and error states for every view
    check: >
      Every view must define behavior for: initial loading, empty data, network error,
      invalid input, and real-time transition. The public tracking page must handle:
      pre-search (empty input), searching (loading), found (display), not found,
      error, and terminal states (cancelled, dispatched). The customer portal must
      handle: loading, no orders, orders list, error, and live updates.

scoring:
  method: weighted_sum
  scale: 1-5
  weights:
    architectural_integrity: 0.20
    requirements_completeness: 0.20
    real_time_implementation: 0.18
    code_structure_specificity: 0.17
    error_handling_robustness: 0.10
    ui_ux_quality: 0.10
    testability_and_maintainability: 0.05
  tiebreaker:
    - architectural_integrity
    - requirements_completeness
    - real_time_implementation
    - code_structure_specificity
    - error_handling_robustness
    - ui_ux_quality
    - testability_and_maintainability

judging_instructions:
  process:
    - step: 1
      action: "Read all 3 solution files in full before scoring any single solution"
    - step: 2
      action: >
        For each solution, evaluate on all 7 criteria. Review the existing code context
        (src/router/index.ts, src/api/client.ts, src/modules/kds/composables/useOrderFeed.ts,
        src/types/index.ts, server.js, uno.config.ts) to verify pattern conformance claims.
    - step: 3
      action: "Calculate final_score = weighted sum of criterion scores"
    - step: 4
      action: "Compare solutions: note which solution excels on which criterion and why"
    - step: 5
      action: "Produce final VOTE for the best overall solution"
  output:
    format: >
      Structured report with exact header format. YAML scores block followed by
      narrative evaluation. Each criterion score must include evidence (specific
      quotes or observations from the solution) and comparative notes.
    header_format:
      - "VOTE: [Solution A/B/C]"
      - "SCORES: Solution A: X.X/5.0, Solution B: X.X/5.0, Solution C: X.X/5.0"
      - "CRITERIA: architectural_integrity: X.X/5.0, requirements_completeness: X.X/5.0, ..."
    sections:
      - comparative_analysis: >
          Per-criterion comparison of all 3 solutions, highlighting relative strengths
          and weaknesses. Must include specific evidence (quotes, line references, or
          structural observations) for each score.
      - vote_rationale: >
          Explanation of why the chosen solution is best overall. Must reference
          criterion scores and comparative advantages.
      - improvement_notes: >
          Specific, actionable suggestions for improving each solution. Not general
          feedback — concrete changes with rationale.

domain_context:
  order_type: >
    Current Order type (src/types/index.ts:56-67) has fields: id, orderNumber, source,
    customerName, items (OrderItem[] with menuItemId, name, quantity, unitPrice,
    specialInstructions?), totalAmount, status (pending|preparing|ready|dispatched|cancelled),
    brandId, timestamps (placedAt, startedAt, readyAt, dispatchedAt), prepTimeTarget.
    Note: no customerId, customerEmail, or phone field exists.

  ws_payload: >
    Server.js router.render (line 36-43) emits order:update with payload:
    { id: order.id, status: order.status, orderNumber: order.orderNumber }.
    The full Order object must be fetched via REST GET /orders/:id.

  singleton_ws: >
    useOrderFeed.ts (src/modules/kds/composables/useOrderFeed.ts) creates a single
    Socket.IO singleton. It currently listens for 'order:update' and updates the
    ['orders'] TanStack Query cache. The listener is not extensible — it's hardcoded.
    Consumers must either: (a) add their own listeners via singletonSocket.on(...),
    (b) refactor the composable to accept handlers, or (c) create a separate WS
    connection (not recommended unless justified).

  api_client: >
    api/client.ts has an orders namespace with list(), get(id), create(data),
    updateStatus(id, status). New methods like getByOrderNumber(num) or listByCustomerId(id)
    must be added here. The http instance uses baseURL '/api' and 10s timeout.

  route_structure: >
    All existing routes (src/router/index.ts) are children of AppLayout under '/'.
    Root '/' redirects to '/kds'. No public/guest routes exist. Customer routes need
    to fit within this hierarchy or use a separate top-level route.

  existing_ui_patterns: >
    Key patterns: OrderCard.vue uses font-display for order number, font-mono for timer,
    chip for source label, Tag with severity mapping (warn/info/success/contrast/danger),
    Button for actions. AppLayout has AppDrawer (navigation) and AppHeader (mobile).
    UnoCSS shortcuts defined: card, btn-primary, btn-secondary, input, field, skeleton,
    skeleton-card, skeleton-text, skeleton-heading, badge, chip, page-header, etc.
    Color palette: orange-600 primary, gray-50 background, brand colors for status.

  server_capabilities: >
    json-server 0.17 with router.render interceptor. Supports GET/POST/PATCH/PUT/DELETE.
    Query filtering via query params (e.g., ?orderNumber=2001). No custom routes, no
    middleware beyond the timestamp injection and WS broadcast. Any server-side changes
    must be backward-compatible with existing KDS operations.

  existing_customer_portal_identity: >
    No authentication system exists in the frontend. There is no login page, no auth
    guards, no auth store, no token management. localStorage.getItem('auth_token') is
    referenced in useOrderFeed.ts line 24 but the token is never set by any current code.
    Customer portal identity must work without real auth.
```
