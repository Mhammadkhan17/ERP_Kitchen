# Proposals B — Cloud Kitchen ERP: Design & WebSocket Remediation

**Date:** 2026-07-15
**Scope:** Component design inconsistencies, CSS/style issues, WebSocket implementation flaws
**Stack:** Vue 3 + TypeScript + Vite 6 + UnoCSS 0.65 + PrimeVue 4 + TanStack Vue Query 5 + Pinia 2 + Vue Router 4 + Axios + Socket.IO

---

## Step 1: Problem Decomposition

### Core Problem
The frontend has three uncoupled categories of technical debt that degrade UX, increase maintenance cost, and prevent reliable real-time order updates. Each category has distinct root causes and requires a different remediation strategy.

### Key Constraints
1. Must work with existing stack — no new major dependencies
2. Must maintain backward compatibility with `db.json` and `server.js` API (json-server + Socket.IO)
3. Must keep the industrial color palette (`#F8F9FA` ground, `#1A1D1F` text, `#E85D3A` accent)
4. Vite proxy handles `/api` → `localhost:3001` — WebSocket is direct (no proxy)
5. `presetWind()` only in UnoCSS — no `presetIcons()`, no `presetAttributify()`
6. PrimeVue uses a custom Aura-based `KitchenPreset` with orange primary palette

### Subproblems
| ID | Subproblem | Category |
|---|---|---|
| P1 | Undefined `.field` CSS class used on 15+ form wrappers | CSS/Style |
| P2 | Phosphor icon `i-ph-plus-bold` used instead of PrimeIcons `pi pi-plus` | Components |
| P3 | Absolute-positioned tooltip in `SalesChart.vue` inside `flex-col` without `relative` parent | Components |
| P4 | Inconsistent card styling — some use `card` shortcut, some use inline border styles | Components |
| P5 | Missing active/selected state on filter button group in `AnalyticsDashboard.vue` | Components |
| P6 | `text-primary-400` class in `RecipeBuilder.vue` references undefined UnoCSS color family | CSS/Style |
| P7 | `border-gray-200` (#E5E7EB) in shortcuts vs `border-[#E9ECEF]` used inline — arbitrary color drift | CSS/Style |
| P8 | Missing loading/skeleton states on analytics, inventory, and menu pages | CSS/Style |
| P9 | Hardcoded `http://localhost:3001` URL in `useOrderFeed.ts` | WebSocket |
| P10 | `transports: ['websocket']` only — no HTTP polling fallback | WebSocket |
| P11 | No `connect_error` handler | WebSocket |
| P12 | Ignores real-time event payload — re-fetches all orders from REST instead of patching cache | WebSocket |
| P13 | No auth/credentials passed to Socket.IO | WebSocket |
| P14 | Server's welcome `connected` event ignored | WebSocket |

### Evaluation Criteria
1. **Completeness**: All 14 subproblems addressed
2. **Consistency**: Single visual language across all 4 modules
3. **Performance**: No unnecessary REST calls on WebSocket updates
4. **Resilience**: WebSocket connection survives network interruptions
5. **Maintainability**: Pattern-duplication reduced (DRY design tokens)
6. **Observability**: Connection state is visible to operators

---

## Step 2: Solution Space Mapping

### Architecture Patterns
- **Centralized Design Token System**: Single source of truth for colors, spacing, typography via UnoCSS theme or CSS custom properties
- **Layer-Based Component Architecture**: Separate structure (layout), skin (visual), and behavior (interaction)
- **WebSocket Proxy Pattern**: Route WS through Vite proxy or use environment variable for server URL
- **Optimistic Cache Patching**: Apply mutations directly to TanStack Query cache instead of invalidating

### Implementation Strategies
- **Eager (big-bang)**: Refactor all components in one pass — highest consistency, highest risk
- **Incremental (module-by-module)**: Fix one module at a time — lower risk, longer timeline
- **Utility-First (define shortcuts first)**: Add missing UnoCSS shortcuts, then sweep components
- **Wrapped-Components (abstraction)**: Create `<AppCard>`, `<AppField>`, `<AppTooltip>` wrappers

### Trade-off Axes
| Axis | Left Pole | Right Pole |
|---|---|---|
| Consistency | Monolithic design system, strict | Per-module freedom, pragmatic |
| Risk | Low-risk incremental changes | High-risk big-bang rewrite |
| Effort | Minimal changes (patch only) | Comprehensive refactor |
| Future-proofing | Quick fix now, may re-emerge | Structural fix prevents recurrence |
| Real-time perf | Naive re-fetch (simple) | Optimistic cache patch (efficient) |

---

## Step 3: Six Approaches

---

### Approach A: "Foundation First" — Design Token Layer + Incremental Component Sweep + WebSocket Hardening

**Summary:** Establish a proper design token layer in UnoCSS, then sweep all components module-by-module to use the token system, while hardening the WebSocket client with cache patching and fallback transports.

**Description:**
Start by extending `uno.config.ts` with the missing design primitives. Add `primary` color family (mapped to the existing `brand` palette since the PrimeVue preset already defines `primary`), add a `field` shortcut definition, and optionally add `presetIcons()` if Phosphor icons are desired (otherwise fix the single `i-ph-plus-bold` instance to use `pi pi-plus`). Add the `surface-ground`, `surface-card`, `text-primary`, `text-secondary`, and `border` colors to the UnoCSS theme so that utility classes like `text-primary` and `border-default` resolve consistently.

Then proceed module-by-module through the four modules in dependency order (Layout → KDS → Inventory → Menu → Analytics). For each module: replace inline `style` color values with semantic UnoCSS classes, replace `class="field"` with `class="flex flex-col gap-1.5"` (or define `field` as a shortcut), unify card wrappers to use the `card` shortcut (or remove `card` from classes where inline overrides conflict), and add skeleton loading states using `animate-pulse` divs.

For the WebSocket, change `useOrderFeed.ts` to use `window.location.origin` derived URL (or an env var), add `transports: ['websocket', 'polling']`, add `connect_error` handler with exponential backoff, listen for the server's `connected` event, and most importantly — use `queryClient.setQueryData` to optimistically patch the individual order in the `['orders']` cache with the payload received from `order:update`, eliminating the full REST re-fetch.

**Key Design Decisions:**
- Use UnoCSS theme extension (not CSS custom properties) as the source of truth for colors — this keeps all design tokens in one file and aligns with the `presetWind` utility-first approach
- Fix `.field` by defining it as a shortcut (`flex flex-col gap-1.5`) rather than removing usage — preserves existing template structure
- Use `queryClient.setQueryData` with a functional updater that finds and replaces the updated order in the array cache — avoids breaking other subscribers
- Derive WS URL from `window.location` (port 3001 via env var `VITE_WS_PORT`) or fallback to the Vite proxy path

**Trade-offs:**
- *Gain:* All 14 subproblems addressed; single token source prevents color drift; WebSocket becomes resilient and efficient
- *Sacrifice:* Requires touching ~20 files; moderate effort; adds env var configuration surface

**Probability:** 0.85
**Complexity:** Medium
**Risks:** Missing an inline `style` during the sweep; env var not set in production; cache updater must handle null/empty edge cases

---

### Approach B: "CSS Custom Properties Takeover" — Replace UnoCSS Colors with CSS Variables + Minimal WS Fix

**Summary:** Eliminate all UnoCSS arbitrary color values (`[#...]`) and semantic color classes (`text-gray-900`) by centralizing all colors into CSS custom properties, then patch only the most critical WebSocket flaws.

**Description:**
Move all color token definitions from UnoCSS theme into `main.css` CSS custom properties (many already exist: `--surface-ground`, `--text-primary`, etc.). Extend the set to cover every color value used across the app — `--text-secondary`, `--border`, `--status-pending`, `--status-preparing`, `--status-ready`, `--status-dispatched`, `--accent`, plus all semantic aliases. Then sweep every Vue file: replace `text-[#1A1D1F]` → `var(--text-primary)`, `text-[#6C757D]` → `var(--text-secondary)`, `border-[#E9ECEF]` → `var(--border)`, etc. Use inline `style` bindings or `<style>` blocks rather than UnoCSS arbitrary values for these custom property references.

This approach rejects the utility-first color strategy in favor of CSS custom properties, which enables runtime theming, reduces class string bloat, and eliminates the UnoCSS arbitrary-value parser's limitations.

For the U...ndefined `.field` class: add a `.field` rule in `main.css` (`display: flex; flex-direction: column; gap: 0.375rem`). This is the lowest-effort way to make the existing markup work.

For WebSocket: change the URL to an env var, add `polling` fallback, and add a `connect_error` handler. Skip the cache-patching optimization — keep the re-fetch approach as it's simpler and proven, just make the connection more reliable.

**Key Design Decisions:**
- CSS custom properties over UnoCSS colors — avoids the `text-primary-400` undefined family problem at the root; enables easy dark mode later
- Fix `.field` at the CSS level (not UnoCSS shortcut) — zero template changes required
- Deliberately skip cache patching — accepts the redundant REST call in exchange for simpler code and fewer moving parts
- Env var for WS URL with fallback to `http://localhost:3001` for backward compatibility

**Trade-offs:**
- *Gain:* Very low template churn; fixes color inconsistency permanently; enables future theming; low WebSocket risk
- *Sacrifice:* Abandons utility-first purity; mixes CSS-in-JS (inline styles) with UnoCSS; leaves one REST re-fetch on every WS event; does not address loading/skeleton states

**Probability:** 0.82
**Complexity:** Low
**Risks:** CSS custom property cascading issues; forgetting to add a property; browser support is fine (IE11 not in scope)

---

### Approach C: "Wrapped Abstractions" — Build Component Layer + Full WS Rewrite

**Summary:** Create reusable wrapper components (`AppCard`, `AppField`, `AppStatCard`, `AppLoadingSkeleton`) that enforce design consistency by encapsulation, then rewrite the entire WebSocket layer as a dedicated composable with full cache integration.

**Description:**
Instead of fixing individual class inconsistencies, build a small component library in `src/components/ui/`:
- `<AppCard>` — renders a themed card wrapper with the `card` styling, accepts `padding` and `variant` props
- `<AppField>` — renders a labeled field wrapper with consistent gap, error state, and label styling
- `<AppStatCard>` — opinionated KPI card with title, value, trend, icon slot
- `<AppTooltip>` — portal-based tooltip that avoids positioning bugs
- `<AppSkeleton>` — configurable skeleton loader (bar, card, table-row, chart variants)

Then refactor all module components to use these wrappers. This creates a firebreak: any future component must use the wrappers, which automatically enforces visual consistency.

Rewrite `useOrderFeed.ts` as a dedicated singleton composable that:
1. Connects once and shares the socket across callers (module-level singleton)
2. Listens to `order:update` and calls `queryClient.setQueryData` with a functional updater that finds the order by ID and merges the new status/timestamps
3. Exposes reactive `connected`, `lastEvent`, `error` refs
4. Uses env var URL + polling fallback + connect_error handler + auth token from Pinia store
5. Listens to the server's `connected` event and logs it

**Key Design Decisions:**
- Wrapper components over utility classes — stronger enforcement mechanism; self-documenting
- Singleton WebSocket composable — prevents multiple connections from different views
- Functional cache updater using `structuredClone` or spread — prevents mutation of cached data
- Pinia store for auth token — keeps WS auth in sync with app auth state (future-proof)

**Trade-offs:**
- *Gain:* Strongest consistency enforcement; WS is production-ready; easy to test (mock wrappers)
- *Sacrifice:* Highest initial effort; new component files to maintain; wrapper indirection may feel over-engineered for simple views; runtime cost of extra component instances

**Probability:** 0.08 (diverse — exploration of component-library approach)
**Complexity:** High
**Risks:** Over-abstraction; PrimeVue components already provide many of these primitives; may conflict with PrimeVue's own theming system

---

### Approach D: "Pragmatic Patch Only" — Minimal Template Fixes + WS Connection Stabilization Only

**Summary:** Fix only the broken/missing classes and icon with surgical template edits, stabilize the WebSocket connection without cache patching, and defer all structural improvements.

**Description:**
Scope is strictly subproblems that produce visible bugs or console errors today:
1. Replace `i-ph-plus-bold` → `pi pi-plus` in `WastageLog.vue` (broken icon)
2. Add `position: relative` to the bar container in `SalesChart.vue` or replace the absolute tooltip with PrimeVue `Tooltip` component
3. Add a `field` CSS class definition to `main.css` or replace `class="field"` with `class="flex flex-col gap-1.5"` in StockAdjustment and IngredientForm
4. Replace `text-primary-400` → `text-orange-400` in `RecipeBuilder.vue` (no class definition for `primary` in UnoCSS)
5. Change WS `transports` to include `polling`, add `connect_error` handler, listen for `connected` event
6. Derive WS URL from an env var (`import.meta.env.VITE_WS_URL`) with fallback to `http://localhost:3001`

Everything else — color drift, inconsistent card styling, missing loading states, missing button active states, cache patching — is explicitly deferred.

**Key Design Decisions:**
- Fix only what is broken — no refactoring of working code
- WS connection stabilization but no cache optimization — the re-fetch is wasteful but functionally correct
- `.field` handled whichever way requires fewer edits (probably CSS rule in `main.css`)

**Trade-offs:**
- *Gain:* Extremely low effort; minimal risk of regression; can be done in <2 hours
- *Sacrifice:* All systemic issues remain; color drift continues; no loading states; every WS event triggers N+1 REST calls; no auth on WS

**Probability:** 0.80
**Complexity:** Low
**Risks:** Technical debt accumulates; next developer encounters same inconsistencies; WS still unusable under poor network conditions (no fallback to polling isn't just a preference — without it, WS-only mode fails entirely behind proxies)

---

### Approach E: "Runtime Theme Engine" — Dynamic CSS Variable Injection + WS Over Socket.IO Admin UI

**Summary:** Replace static UnoCSS with a runtime theme engine that injects CSS variables via Pinia, and add a Socket.IO Admin UI dashboard for WebSocket observability, all while keeping existing templates mostly unchanged.

**Description:**
Create a `useTheme` Pinia store that holds all design tokens as reactive properties and injects them as CSS custom properties on the document root via `watchEffect`. The theme store reads from a `theme.config.ts` file (copy of the token values from `uno.config.ts` and `main.css`). This enables:
- Live theme switching (brand swap, dark mode)
- A debug overlay showing all current token values
- Eliminates the need for hardcoded `[#...]` values — components reference `var(--token-name)` instead

For WebSocket, instead of just fixing the client, add the `@socket.io/admin-ui` package to `server.js` for a real-time dashboard showing connected clients, events, and message volume. On the client, create a `useSocketDebug` composable that logs all events in development mode and exposes metrics (reconnect count, last ping, messages received).

Reconcile the `.field` issue by adding it as a CSS rule, and fix the icon and tooltip issues surgically. Accept the cache-patching skip — the Admin UI provides enough visibility that the REST re-fetch cost is transparent.

**Key Design Decisions:**
- Runtime theme injection instead of build-time UnoCSS — enables live editing and dark mode
- Admin UI for WS observability — shifts focus from "fix WS" to "monitor WS"
- Defer cache patching — the server sends ~200 bytes per event; the REST call is ~2KB; the savings is marginal for this data volume

**Trade-offs:**
- *Gain:* Powerful theming capability; excellent WS observability; future dark mode is free
- *Sacrifice:* Over-engineered for current needs; `@socket.io/admin-ui` is a production dependency; runtime theme injection may conflict with PrimeVue's own theme system; most CSS values are still hardcoded in templates

**Probability:** 0.05 (diverse — unconventional runtime approach)
**Complexity:** High
**Risks:** PrimeVue theme conflicts; runtime injection can cause FOUC; Admin UI exposes internal details; team must learn a custom theming system on top of PrimeVue's

---

### Approach F: "WS-First, CSS-Last" — Full WebSocket Rewrite with Event Sourcing + Minimal CSS Gate

**Summary:** Completely rewrite the WebSocket layer as an event-sourced state manager that replaces the REST orders query entirely, while applying a CSS "gate" that catches class/color violations at build time.

**Description:**
Abandon the REST-first approach for orders. The new WebSocket composable maintains its own reactive `Map<string, Order>` store, seeded by the initial REST fetch but thereafter updated exclusively via WebSocket events. The server is extended to emit `order:created`, `order:status-changed`, and `order:deleted` event types (with full payload). The TanStack Query hook `useQuery(['orders'])` is replaced by a composable `useOrders()` that returns the reactive map as a computed array, with zero TanStack Query involvement for the hot path. This eliminates cache invalidation entirely and provides sub-millisecond updates.

For the WebSocket connection: URL from env var, `['websocket', 'polling']` transports, `connect_error` handler, auth via token passed in `auth` option, reconnect with jitter, and a health-check ping every 10 seconds.

For CSS: implement a small `eslint-plugin-uno` or stylelint rule that bans arbitrary `[#...]` values and enforces the use of either UnoCSS theme tokens or CSS variables. This is a CI gate, not a runtime fix. The `field` class is added to UnoCSS shortcuts. The icon and tooltip bugs are fixed manually.

**Key Design Decisions:**
- Event-sourced order state — eliminates the REST dependency for real-time updates; sub-millisecond reactivity
- Remove TanStack Query from the hot path — the query cache was designed for stale-while-revalidate, not real-time event sourcing
- Lint rule for CSS consistency — prevents new violations without refactoring existing ones (clean-as-you-go)
- Auth token passed as Socket.IO `auth` option — automatically re-sent on reconnection

**Trade-offs:**
- *Gain:* Best possible real-time performance; eliminates REST re-fetch entirely; lint gate prevents new CSS drift
- *Sacrifice:* Dual state management (reactive map + TanStack Query for non-WS entities); conceptual complexity; team must learn event-sourced patterns; does not fix existing color drift (only prevents new ones)

**Probability:** 0.06 (diverse — event sourcing is atypical for this scale)
**Complexity:** High
**Risks:** Race condition between initial REST fetch and first WS event; full event replay on reconnect not implemented; server must be extended to emit typed events; existing code expects `useQuery` return shape

---

## Step 4: Diversity Verification

| Criterion | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| Approach differs from others | Baseline | CSS-vars instead of tokens | Component wrappers | Minimal only | Runtime theme + Admin UI | Event sourcing + lint |
| Different region of solution space | Token + sweep | Custom properties | Abstraction layer | Surgery | Runtime engine | State architecture |
| Conventional? | Yes | Yes | Borderline | Yes | No | No |
| WebSocket depth | Medium (cache patch) | Low (stabilize only) | High (singleton + cache) | Low (stabilize only) | Medium (Admin UI) | High (event source) |
| CSS depth | High (token sweep) | High (var migration) | High (wrapper layer) | Low (targeted fixes) | Medium (runtime) | Low (lint gate only) |

Approaches A, B, D are high-probability incremental fixes. Approaches C, E, F explore distinct architectural philosophies (component abstraction, runtime theming, event sourcing) that would lead to meaningfully different codebases.

---

## Appendix: Subproblem Coverage Matrix

| Subproblem | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| P1: undefined `.field` | ✓ shortcut | ✓ CSS rule | ✓ AppField | ✓ either | ✓ CSS rule | ✓ shortcut |
| P2: Phosphor icon | ✓ fix inline | ✓ fix inline | ✓ fix inline | ✓ fix inline | ✓ fix inline | ✓ fix inline |
| P3: broken tooltip | ✓ reposition | ✓ reposition | ✓ AppTooltip | ✓ relative fix | ✓ reposition | ✓ fix inline |
| P4: card inconsistency | ✓ unify shortcut | ✓ leave as-is | ✓ AppCard | ✗ defer | ✓ leave as-is | ✗ lint only |
| P5: missing active state | ✓ add ring/class | ✓ add ring/class | ✓ via wrapper | ✗ defer | ✓ add ring/class | ✗ lint only |
| P6: undefined `text-primary-400` | ✓ add `primary` theme | ✓ use CSS var | ✓ via wrapper | ✓ replace with orange | ✓ runtime token | ✗ lint only |
| P7: color drift | ✓ token alignment | ✓ CSS vars fix | ✓ wrapper enforces | ✗ defer | ✓ runtime injection | ✗ CI gate only |
| P8: missing skeletons | ✓ add per module | ✗ defer | ✓ AppSkeleton | ✗ defer | ✗ defer | ✗ defer |
| P9: hardcoded URL | ✓ env var | ✓ env var | ✓ env var | ✓ env var | ✓ env var | ✓ env var |
| P10: no polling fallback | ✓ add `polling` | ✓ add `polling` | ✓ add `polling` | ✓ add `polling` | ✓ add `polling` | ✓ add `polling` |
| P11: no connect_error handler | ✓ add handler | ✓ add handler | ✓ add handler | ✓ add handler | ✓ add handler | ✓ add handler |
| P12: ignores event payload | ✓ cache patch | ✗ re-fetch | ✓ cache patch | ✗ re-fetch | ✗ re-fetch | ✓ event source |
| P13: no auth/credentials | ✓ add auth option | ✗ no auth | ✓ Pinia auth | ✗ no auth | ✓ add auth option | ✓ add auth option |
| P14: `connected` event ignored | ✓ listen | ✓ listen | ✓ listen | ✓ listen | ✓ listen | ✓ listen |

**Key:** ✓ = addressed, ✗ = deferred/not addressed
