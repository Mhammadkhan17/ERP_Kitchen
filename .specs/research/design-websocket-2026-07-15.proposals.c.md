# Design Proposals — Cloud Kitchen ERP Remediation

**Date:** 2026-07-15  
**Author:** AI Design Agent (opencode)  
**Status:** Draft / Exploration  
**Scope:** Component design inconsistencies, CSS/style issues, WebSocket implementation flaws

---

## Step 1: Problem Decomposition

### Core Problem
The ERP frontend was scaffolded rapidly and has accumulated three distinct categories of technical debt that degrade UX, maintainability, and real-time reliability. The fixes must coexist with an already-working application and not destabilize existing flows.

### Key Constraints
1. **Stack is frozen** — Vue 3 (Composition API, `<script setup>`), TypeScript, Vite 6, UnoCSS 0.65 (presetWind only), PrimeVue 4 (KitchenPreset Aura-based), TanStack Vue Query 5, Pinia 2, Vue Router 4, Axios, Socket.IO.
2. **Backward compatibility** — Must work with existing `db.json` schema and `server.js` (json-server + Socket.IO broadcast).
3. **Industrial palette** — Ground `#F8F9FA`, text `#1A1D1F`, accent `#E85D3A`. No deviations.
4. **4 modules** — kds, inventory, menu, analytics. Cross-module coupling exists (order→inventory deduction flow).
5. **No breaking PrimeVue upgrades** — Must work within KitchenPreset and existing PrimeVue 4 configuration.

### Subproblems

| # | Subproblem | Affected Files | Severity |
|---|-----------|---------------|----------|
| P1 | Undefined `field` CSS class used as form wrapper | StockAdjustment.vue, IngredientForm.vue | Medium — cosmetic but pervasive (8+ usages) |
| P2 | Phosphor icon class `i-ph-plus-bold` — not loaded | WastageLog.vue:61 | Medium — broken CTA button icon |
| P3 | Tooltip `absolute` inside `flex-col` without `relative` parent | SalesChart.vue:39 | High — tooltip renders at wrong position |
| P4 | Inconsistent card styling — `card` shortcut vs inline borders | BrandPerformance, StockAdjustment, OrderCard vs SalesChart, TopSellingTable, KpiCard, WastageLog | Medium — visual drift |
| P5 | Missing active state on filter buttons | AnalyticsDashboard.vue:31-33 | Low — no user feedback on selected period |
| P6 | No icon preset in UnoCSS — `i-*` classes dead | uno.config.ts | Medium — any future `i-*` usage silently fails |
| P7 | Arbitrary border-color inconsistency: `gray-200` (#E5E7EB) vs `border-[#E9ECEF]` | Shortcuts vs inline styles | Low — 3px delta invisible to eye |
| P8 | Missing `field` class definition | uno.config.ts / main.css | Medium — needed by P1 |
| P9 | No loading/skeleton states on several pages | AnalyticsDashboard, BrandPerformance, RecipeBuilder | Medium — flash-of-empty on slow connections |
| P10 | `text-primary-400` references undefined UnoCSS color family `primary` | RecipeBuilder.vue:43 | Medium — icon color won't render |
| P11 | Hardcoded WS server URL `http://localhost:3001` | useOrderFeed.ts:11 | High — breaks in production/non-localhost |
| P12 | `transports: ['websocket']` only — no HTTP fallback | useOrderFeed.ts:12 | High — fail-closed if WS blocked |
| P13 | No `connect_error` handler | useOrderFeed.ts | Medium — silent connection failures |
| P14 | Ignores real-time event payload — re-fetches all orders | useOrderFeed.ts:22-24 | High — defeats purpose of WebSocket |
| P15 | No auth/credentials in connection | useOrderFeed.ts:11-16 | Medium — no session propagation |
| P16 | Server's `connected` welcome event ignored | useOrderFeed.ts:18-20 | Low — missed opportunity for handshake verification |

### Evaluation Criteria
1. **Completeness** — what % of the 16 subproblems does the approach address
2. **Minimalism** — lines changed / files touched / risk surface
3. **Consistency** — does the approach establish patterns that prevent future drift
4. **Real-time correctness** — does the WS fix actually reduce network/REST load vs just shuffling code
5. **Backward compatibility** — zero breakage with existing `db.json` and `server.js`

---

## Step 2: Solution Space Map

### Architecture Dimensions
- **CSS strategy**: Monolithic (add all missing classes to uno.config/main.css) vs Scoped (define per-component or per-module)
- **Icon approach**: Drop Phosphor entirely (use pi-* everywhere) vs Add icon preset to UnoCSS
- **Card styling**: Canonical (force all cards into `card` shortcut) vs Laissez-faire (accept variety, fix only broken ones)
- **WS payload handling**: Cache-patch (update Vue Query cache from event payload directly) vs Re-fetch (current approach but with proper event filtering)
- **WS transport**: Dual-transport (WebSocket + polling fallback) vs Enforce-WebSocket (fail fast, show error)
- **Configuration**: Runtime env vars vs Build-time defines vs Hardcoded with override
- **Auth strategy**: None (dev-only) vs Cookie/session-based vs Token-passing
- **Skeleton approach**: Atomic skeletons (per-component) vs Route-level loading vs Suspense boundaries

### Trade-off Axes
```
Simplicity ─────────────────────────────── Robustness
    |                                            |
    |  Fix only broken icons (replace i-ph with  |
    |  pi) vs Add icon preset + full migration   |
    |                                            |
Performance ────────────────────────────── Correctness
    |                                            |
    |  Re-fetch all orders (dumb, simple)        |
    |  vs Patch cache from WS payload (fast,     |
    |     fragile if payload shape diverges)     |
    |                                            |
Local Dev ────────────────────────────── Production
    |                                            |
    |  Hardcoded localhost (works now) vs        |
    |  VITE_API_URL + import.meta.env            |
    |                                            |
```

---

## Step 3: Six Approaches

---

### Approach A — "Minimum Viable Polish"
**Probability: 0.90 | Complexity: Low**

**Summary:** Fix only the definitively broken things — replace the Phosphor icon, add `field` class, wrap the tooltip with `relative`, replace `text-primary-400` with a resolved color, add `connect_error` handler, add HTTP polling fallback. Do not refactor card patterns or add env config.

**Detailed description:**
Triage every subproblem strictly by "is it currently broken or merely inconsistent". P2 (broken icon), P3 (broken tooltip), P8 (missing field class), P10 (undefined color class), P12 (no HTTP fallback), and P13 (no connect_error handler) are broken. Everything else is cosmetic or a nice-to-have. Fix these 6 issues with minimal diff surface. The `field` class gets added to `main.css` as a simple `.field { display: flex; flex-direction: column; gap: 0.375rem; }`. The Phosphor icon gets replaced inline with `pi pi-plus`. The tooltip gets its parent wrapped in `relative`. `text-primary-400` becomes `text-orange-400` (matches `brand-400` which is `#fb923c`, close enough to PrimeVue primary-400). For the WS, add `transports: ['websocket', 'polling']` and attach an `on('connect_error', ...)` handler that sets `connected` to false and logs.

**Key design decisions:**
- Do NOT add icon preset to UnoCSS — simply never use `i-*` classes; enforce `pi-*` convention via code review
- Do NOT unify card styles — the visual difference between `card` and inline borders is negligible (0.003 delta)
- Do NOT add skeleton states — they are not broken, just suboptimal
- Do NOT env-config the WS URL — add a comment and leave as localhost for now

**Trade-offs:**
- Gain: ~30 lines changed, ~8 files touched, high confidence of no regression
- Sacrifice: Leaves P11 (hardcoded URL), P14 (re-fetch instead of patch), P15 (no auth), P16 (ignored event), P4 (card inconsistency), P5 (filter states), P6 (icon preset), P7 (border delta), P9 (skeletons) untouched

**Complexity: Low** — each fix is a one-liner or small block, no new modules
**Risk:** Extremely low. No structural changes. The WS `transports` addition could mask connectivity issues silently.

---

### Approach B — "Consolidated Design System"
**Probability: 0.85 | Complexity: Medium**

**Summary:** Create a single source of truth for all visual inconsistency issues by extending `uno.config.ts` with missing shortcut definitions and theme extensions, then audit every component against it in one pass.

**Detailed description:**
Address P1, P4, P5, P6, P7, P8, P10 as a batch. Extend `uno.config.ts`:
- Add `field` shortcut: `'field': 'flex flex-col gap-1.5'`
- Add `presetIcons()` from `@unocss/preset-icons` with a collection whitelist so `i-*` Phosphor classes resolve (or alternately, add `presetIcons` with only `ph` collection)
- Add `primary` color family to `theme.colors` matching the PrimeVue KitchenPreset palette so `text-primary-400` resolves
- Add `card` variations: `card-compact: 'card p-4'`, `card-bordered: 'card border-[#E9ECEF]'` to absorb the inline-style approaches
- Add `btn-filter` shortcut for the analytics filter buttons with `:active`/`:focus` ring styles
- Audit all 18 Vue files and replace inline `border-[#E9ECEF]` with `card-bordered`; replace inline `bg-white border border-[#E9ECEF] rounded-xl p-5` with `card`

**Key design decisions:**
- Use UnoCSS shortcuts as the design token layer rather than CSS custom properties
- Add `presetIcons()` with selective collections (`ph`) to avoid bloated bundle; this actually makes `i-ph-plus-bold` resolve instead of replacing it
- Normalize border color to `border-gray-200` (#E5E7EB) which is already the shortcut value; replace all `border-[#E9ECEF]` with `border-gray-200`

**Trade-offs:**
- Gain: Unified design token system; all 5 CSS subproblems solved; future components get consistent shortcuts for free; icon preset enables Phosphor usage across the app
- Sacrifice: Adds ~40KB to bundle for icon preset (mitigated by selective collection whitelist); requires touching 18+ files for class renames; risk of visual regression if `#E9ECEF` to `#E5E7EB` shift is noticeable in specific lighting

**Complexity: Medium** — requires careful audit of every CSS class usage across all modules
**Risk:** Bundle size bloat from presetIcons (mitigated by selective collections). Visual regression from border color normalization requires sign-off.

---

### Approach C — "Real-Time Overhaul"
**Probability: 0.80 | Complexity: High**

**Summary:** Focus exclusively on the WebSocket subsystem. Rewrite `useOrderFeed.ts` as a robust real-time connector with payload-driven cache patching, dual-transport, auth, and a typed event contract. Leave CSS/component issues for another pass.

**Detailed description:**
Replace `useOrderFeed.ts` entirely. Key design:
1. **Transport**: `transports: ['websocket', 'polling']` with explicit `upgrade: true`. Fallback to long-polling on WS failure.
2. **URL resolution**: Use `import.meta.env.VITE_WS_URL ?? window.location.origin.replace(/^http/, 'ws')` — works in dev and production.
3. **Cache-patching**: On `order:update`, receive `{ id, status, orderNumber }` payload and use `queryClient.setQueryData(['orders'], ...)` to surgically update the cached order's status/timestamp rather than invalidating everything. Add a 500ms debounce guard to batch rapid updates.
4. **Error handling**: Register `on('connect_error', ...)` that sets `connected.value = false` with a structured error object. Attempt reconnection with exponential backoff capped at 30s.
5. **Auth**: Pass `auth: { token: localStorage.getItem('ws_token') }` and `withCredentials: true`.
6. **Server event**: Listen for the server's `connected` welcome event and verify the handshake message matches expected format; set `connected` to true only after receiving it.
7. **Reconnection gating**: Export a `ready` ref that goes true only after successful `connected` handshake; the dashboard uses this to fade in the `live` indicator.

Create a typed interface `OrderUpdatePayload` to ensure type safety between server and client. Update `server.js` to emit richer payloads including `timestamps` updates.

**Key design decisions:**
- Use `queryClient.setQueryData` (surgical update) instead of `invalidateQueries` (re-fetch) — this is the core architectural change that makes WebSocket meaningful
- Do NOT touch CSS/component issues — pure WS remediation
- Update server.js payload shape to include `timestamps` so the client can patch cache without a subsequent REST call

**Trade-offs:**
- Gain: Eliminates REST re-fetch on every status update; works behind firewalls (polling fallback); proper connection lifecycle management; env-configurable
- Sacrifice: Cache-patching is fragile — if the server payload shape drifts from the typed interface, the cache gets corrupted with stale data. No test coverage for cache mutation logic. This is the highest-risk single change in any approach
- Leaves all 10 CSS/component subproblems unsolved

**Complexity: High** — new typed interface, cache mutation logic, server-side payload changes, fallback transport testing
**Risk:** Cache corruption if payload shape mismatches. Reconnection storms if server is flapping (mitigated by backoff). The `setQueryData` approach bypasses TanStack Query's normal cache lifecycle, potentially confusing devtools.

---

### Approach D — "Progressive Enhancement Lanes"
**Probability: 0.08 | Complexity: Medium**

**Summary:** Treat each of the three problem categories as independent, parallel workstreams (CSS, WS, Components) with isolated feature flags. Each lane is a separate PR that can be merged independently, reducing coordination overhead.

**Detailed description:**
Establish three parallel implementation lanes:
1. **CSS Lane**: Same as Approach B (consolidated design system) but behind a CSS custom property convention. All style changes go through `main.css` variables (`--field-gap`, `--card-border-color`, etc.) with UnoCSS shortcuts referencing those variables. Changes are applied gradually per-module using a `data-theme="v2"` attribute on module root elements until full rollout.
2. **Component Lane**: Fix P1-P5 as atomic commits. Each component gets a `// @design: v2` comment marker. The `field` class is defined per-component with scoped styles to avoid global pollution. The tooltip fix uses a composable (`useTooltipPosition`) that handles `relative` wrapping programmatically.
3. **WS Lane**: Same as Approach C but with a `useOrderFeed` v1/v2 adapter. V1 is current code, v2 is the rewrite. A `featureFlags.useRealTimeV2` ref controls which one activates, defaulting to v1. Gradual rollout by setting the flag in localStorage.

Each lane has its own test file and its own `CHANGELOG` section. The three PRs can be reviewed and merged in any order.

**Key design decisions:**
- Feature flags avoid cross-lane coupling — WS failures don't block CSS fixes
- Per-component scoped `field` styles instead of global — isolates risk
- The adapter pattern for WS allows A/B testing in production

**Trade-offs:**
- Gain: Safe parallelization, incremental deploy, rollback per-lane
- Sacrifice: Massive overhead — 3x the total lines changed, 3x the review surface, temporary adapter complexity in WS lane, CSS variables layer adds indirection. Feature flags need removal later.
- The per-component scoped styles for `field` means duplicating the same 3-line rule across 4+ components

**Complexity: Medium** (individually low, but coordination overhead is medium)
**Risk:** Feature flag tech debt (dead code removal forgotten). Scoped `field` duplication leads to style drift. The adapter layer in WS adds a path where both v1 and v2 run simultaneously, potentially doubling connections.

---

### Approach E — "Opt-in Codegen from a Design Manifest"
**Probability: 0.06 | Complexity: Very High**

**Summary:** Define an authoritative design manifest (YAML/JSON) that declares every CSS token, component pattern, and WS event contract. Write a codegen script (Node.js) that reads the manifest and updates all components automatically. Humans then review the diff.

**Detailed description:**
Create `design-manifest.yaml` with three sections:
```yaml
tokens:
  colors:
    border-default: '#E9ECEF'
    surface-ground: '#F8F9FA'
    text-primary: '#1A1D1F'
    accent: '#E85D3A'
  spacing:
    field-gap: '0.375rem'
    card-padding: '1.25rem'
  fonts:
    display: 'DM Sans'
    mono: 'JetBrains Mono'
    body: 'Inter'

component_patterns:
  field:
    template: '<div class="field"><label/><control/><error/></div>'
    classes: ['flex', 'flex-col', 'gap-1.5']
  card:
    variants:
      default: ['bg-white', 'rounded-xl', 'shadow-sm', 'border', 'border-gray-200', 'p-6']
      bordered: ['bg-white', 'rounded-xl', 'border', 'border-[#E9ECEF]', 'p-5']

ws_events:
  order:update:
    contract: '{ id: string, status: OrderStatus, orderNumber: number, timestamps: OrderTimestamps }'
    client_action: 'patch_cache'
    transport: ['websocket', 'polling']
```

Write `scripts/codegen.mjs` that:
1. Reads all `.vue` and `.ts` files in `src/`
2. Applies regex-based transformations: replace `class="field"` → ensure `field` shortcut exists in `uno.config.ts`, replace `i-ph-plus-bold` → `pi pi-plus`, replace `text-primary-400` → resolved value from manifest
3. Generates updated `uno.config.ts` with all shortcuts from the manifest
4. Generates `src/types/ws-events.ts` from the WS contract section
5. Patches `useOrderFeed.ts` to use generated types and the declared transport strategy

The script runs as `npm run design:sync` and outputs a diff. Humans review and approve.

**Key design decisions:**
- Source of truth is `design-manifest.yaml`, not the code — enforces discipline
- Regex transformations mean the codegen is brittle but fast; edge cases handled manually after diff review
- WS contract is codegen'd = type-safe by construction

**Trade-offs:**
- Gain: Single source of truth; reproducible transformations; WS types generated from manifest = zero drift
- Sacrifice: Codegen script is ~400-600 lines of fragile regex logic; initial authoring time is high; edge cases (dynamic classes, conditional bindings) must be handled manually; team must learn to edit manifest instead of source files

**Complexity: Very High** — design manifest + codegen script + review workflow + CI integration
**Risk:** Regex-based transforms miss edge cases (v-bind:class, computed classes, template literals). The manifest becomes stale if developers edit source files directly instead of updating it. Codegen script itself needs maintenance.

---

### Approach F — "Framework-Guided Rewrite of the Trinity"
**Probability: 0.04 | Complexity: Very High**

**Summary:** Replace the three most problematic subsystems with framework-native alternatives — swap custom CSS scaffolding for PrimeVue's built-in form layout components, replace the hand-rolled Kanban with PrimeVue DataView, and replace raw Socket.IO with TanStack Query's `subscription`-style pattern using `queryOptions`.

**Detailed description:**
1. **CSS/Forms**: Eliminate the `field` class entirely by using PrimeVue's `FloatLabel` and `IftaLabel` components for form fields. Replace all `<div class="field">` instances with `<FloatLabel>` wrappers. This is PrimeVue 4's sanctioned approach and provides consistent spacing + label animation for free.
2. **Cards/Containers**: Replace the bifurcated card patterns with PrimeVue's `Panel` component (`<Panel>` with `pt` passthrough for custom styling). Set `toggleable` where appropriate. This eliminates the need for a `card` shortcut entirely — stick to one PrimeVue container component.
3. **WS Layer**: Restructure `useOrderFeed.ts` around TanStack Query's `queryOptions` + `refetchInterval` subscription pattern. Instead of a direct Socket.IO connection, use a Pinia store that wraps the Socket.IO lifecycle and exposes a reactive `lastOrderUpdate` ref. Then use a `watch` + `queryClient.setQueryData` in the consuming component via a composable that returns the same shape as `useQuery`. This keeps the cache management inside TanStack Query's ecosystem rather than imperative `setQueryData` calls scattered in composables.
4. **Analytics filters**: Replace hand-rolled `<button>` group with PrimeVue's `SelectButton` component which has built-in active state management and keyboard navigation.
5. **Icons**: Audit every `i-*` class in the project and replace with `pi-*` equivalents. Remove `i-ph-plus-bold` in WastageLog.vue.

**Key design decisions:**
- Lean into PrimeVue as the design system rather than UnoCSS shortcuts — let PrimeVue's component API dictate layout patterns
- WS lives inside TanStack Query's subscription model, not as a standalone Socket.IO wrapper — keeps cache invalidation consistent
- Replacing `card` shortcut with `<Panel>` is a significant template change in 6 components

**Trade-offs:**
- Gain: Zero custom CSS classes for forms (`FloatLabel` handles it all); consistent card behavior via `Panel` (collapsible, templated headers, footer slots); WS is fully inside TanStack Query's reactivity model
- Sacrifice: Every form component needs template restructuring; `Panel` has different visual defaults than the custom `card` (must use `pt` passthrough to match existing look); `SelectButton` changes the click-target UX from the current button group; the WS subscription pattern is unconventional for TanStack Query and may confuse future maintainers
- Leaves `text-primary-400` issue unsolved unless `Panel` passthrough handles it (it doesn't)

**Complexity: Very High** — every form template changes, card pattern in 6 components changes, WS architecture inverted, introduces PrimeVue components not previously used (FloatLabel, Panel, SelectButton)
**Risk:** PrimeVue 4's `FloatLabel` has known issues with `Select` and `InputNumber` on initial render (label overlap). `Panel` passthrough styling is verbose (30+ lines of `pt` config per component). The `SelectButton` period selector may look visually different from the current button group. The WS subscription pattern via `watch` + `setQueryData` is fragile — if TanStack Query's cache schema changes (e.g., structural sharing), the subscription breaks silently.

---

## Step 4: Diversity Verification

| Criterion | A | B | C | D | E | F |
|-----------|---|---|---|---|---|---|
| Fixes broken icons | Yes | Yes* | No | Yes | Yes | Yes |
| Fixes WS flaws | Partial | No | Full | Full | Full | Partial |
| Fixes CSS inconsistencies | Minimal | Full | No | Full | Full | Full‡ |
| Adds skeleton states | No | No | No | No | No | No |
| Env-configurable WS | No | No | Yes | Yes | Codegen | No |
| Cache-patch vs Re-fetch | Re-fetch | Re-fetch | Patch | Patch | Patch | Patch† |
| New dependencies | No | presetIcons | No | No | yaml parser | No |
| Files touched | ~8 | ~20+ | ~4 | ~28+ | ~30+ | ~22+ |
| Lines changed | ~30 | ~200+ | ~150+ | ~350+ | ~500+ | ~400+ |
| Risk level | Very Low | Medium | High | Low-Med | High | Very High |

*Approach B uses `presetIcons` to make `i-*` work rather than replacing them.  
†Approach F uses a different patch mechanism (watch + setQueryData via Pinia store).  
‡Approach F replaces card/field patterns with PrimeVue components rather than fixing the CSS.

**Genuinely different or minor variations?**  
- A vs B: Different philosophy (minimalist vs systematic). A leaves inconsistencies; B embraces them.  
- C vs D: C is deep-WS-only; D is all-three-in-parallel. Different scope strategy.  
- E vs others: The only approach that introduces tooling/codegen. Meta-solution.  
- F vs B: Both fix CSS but via opposite strategies — B uses UnoCSS shortcuts, F uses PrimeVue components.  
- A vs F: Minimal touch vs maximum replacement. Ends of the spectrum.

All 6 occupy distinct regions of the solution space (tooling/process, architectural, scope-based, framework-driven, minimal-touch, design-system-driven).
