# Design & WebSocket Fix Proposals — Cloud Kitchen ERP

**Date:** 2026-07-15
**Scope:** Component inconsistencies, CSS/style drift, WebSocket flaws

---

## Step 1: Problem Decomposition

### Core Problem
The frontend was built rapidly with three categories of accumulated technical debt: (a) inconsistent component patterns that violate the project's own conventions, (b) CSS drift between UnoCSS shortcuts, inline styles, and undefined classes, and (c) a brittle real-time WebSocket integration that falls back to polling and ignores server payloads.

### Key Constraints
- Must work with Vue 3 + TypeScript + Vite 6 + UnoCSS 0.65 + PrimeVue 4 + TanStack Vue Query 5 + Pinia 2 + Vue Router 4 + Axios + Socket.IO
- `npm run start` concurrently runs json-server on `:3001` and Vite dev server with `/api` proxy
- `presetWind()` only in UnoCSS — no icon preset, no `primary` color palette (only `brand`)
- PrimeVue uses KitchenPreset (Aura-derivative) with orange primary palette
- Industrial color palette: `#F8F9FA` ground, `#1A1D1F` text, `#E85D3A` accent
- Must maintain backward compatibility with `db.json` and `server.js`

### Subproblems
1. **Undefined `field` class** — used in 2 views + 1 component, exists nowhere
2. **Broken Phosphor icon** (`i-ph-plus-bold`) in WastageLog — only PrimeIcons are imported
3. **Floating tooltip** in SalesChart — `absolute` div inside `flex-col` without `relative` container
4. **Card styling inconsistency** — 3 patterns: `card` shortcut, inline border classes, inline `style` attribute
5. **Missing button hover/active states** — filter buttons in AnalyticsDashboard
6. **Arbitrary color drift** — `border-gray-200` (`#E5E7EB`) in shortcuts vs `border-[#E9ECEF]` hardcoded inline
7. **Missing loading skeletons** — only OrderDashboard has them
8. **`text-primary-400` in RecipeBuilder** — references color family not in UnoCSS config
9. **Hardcoded WS URL** (`http://localhost:3001`)
10. **No WS polling fallback** — `transports: ['websocket']` only
11. **No `connect_error` handler**
12. **Cache re-fetch on WS event** — ignores `order:update` payload, invalidates entire query
13. **No auth/credentials** on WS connection
14. **Server `connected` event ignored** — emitted but never consumed

### Evaluation Criteria
- **Consistency** — do components within the same module follow the same patterns?
- **Correctness** — do tooltips position correctly? do icons render? do styles match?
- **Performance** — does WS avoid redundant REST calls?
- **Resilience** — does WS degrade gracefully when WebSocket transport fails?
- **Maintainability** — is the codebase self-consistent for the next developer?
- **Effort** — how many files are touched? how risky is the change?

---

## Step 2: Solution Space Dimensions

| Dimension | Spectrum |
|---|---|
| **Scope** | Narrow (fix only broken things) ↔ Broad (establish design system) |
| **CSS strategy** | Add missing classes ↔ Refactor all to shortcuts/design tokens |
| **WS payload handling** | Ignore payload (invalidate all) ↔ Patch cache atomically |
| **WS transport** | WebSocket-only ↔ Auto-fallback with polling |
| **Pattern enforcement** | Manual/guide ↔ Linter rules + automated |
| **Approach to icons** | Stick with PrimeIcons ↔ Add UnoCSS icon preset |

---

## Step 3: Six Approaches

---

### Approach A: "Minimal Repairs" (High Probability ~0.85)

**Summary:** Fix only the broken things — define the `field` class, swap the icon, add `relative` to the tooltip parent, replace `text-primary-400`, align border colors to the shortcut values, and add basic WS fallback (polling transport + connect_error handler). No architectural changes.

**Description:** This is the surgically minimal approach. In `main.css`, add `.field { display: flex; flex-direction: column; gap: 0.25rem; }`. Change the `i-ph-plus-bold` icon in WastageLog.vue to `pi pi-plus`. Wrap the SalesChart tooltip container with `class="relative"`. Replace `text-primary-400` in RecipeBuilder with `text-brand-400` (or the hex `#fb923c`) and add `primary` colors to UnoCSS theme. Normalize border colors by removing inline `border-[#E9ECEF]` usages — they match `border-gray-200` exactly (`#E5E7EB` vs `#E9ECEF` differ by 2 per channel; commit to `border-gray-200` from the shortcut).

For WebSocket: add `'polling'` to transports array, add `socket.value.on('connect_error', ...)` handler, and use the payload from `order:update` to optimistically update the query cache via `queryClient.setQueryData` instead of `invalidateQueries`. Read `VITE_WS_URL` from `import.meta.env` with a fallback to `''` (empty string = same origin).

**Key Decisions:**
- Fixes are localized to the files with bugs — minimal diff
- Border colors normalized to shortcut values (not the other way around)
- WS payload consumed to patch cache; full invalidation kept as a backup after a delay
- No refactoring of card patterns — accepts inconsistency as a future concern

**Trade-offs:**
- (+) ~5-8 files changed, low risk, can be done in a single PR
- (+) Preserves all existing layout behavior
- (-) Card styling inconsistency remains (3 competing patterns)
- (-) No loading skeletons added outside KDS
- (-) No systematic lint rule to prevent regression

**Probability:** 0.85
**Complexity:** Low
**Risks:** WS cache patching could cause stale UI if the payload shape doesn't match the cache schema — mitigated by a delayed refetch.

---

### Approach B: "Design Token Unification" (High Probability ~0.82)

**Summary:** Eliminate all inline color/radius/sizing literals across all 21 Vue files by defining a complete design token layer in UnoCSS and `main.css`, then refactoring every component to use only tokens and shortcuts.

**Description:** First, extend the UnoCSS theme with `primary` colors (copied from `brand` — they're identical), a `surface` palette matching the CSS vars, and well as border, font, and spacing tokens. Create new shortcuts: `card-default` (using `border-gray-200`), `card-bordered` (using `border-[var(--border-color)]`), `input-field` (label + input stacking), and `btn-filter` (for analytics filter buttons with hover/active). Then systematically replace every inline hex color with a token class. For example, `text-[#1A1D1F]` becomes `text-primary-text`, `bg-[#F8F9FA]` becomes `bg-ground`, `border-[#E9ECEF]` becomes `border-border` (or `border-gray-200`). All `field` class usages get `input-field`.

This standardizes the card pattern: every card-like container uses either `card` (for the shortcut) or `card-bordered` (for the non-shadow variant used by BrandPerformance). The SalesChart tooltip gets proper `relative` + `invisible`/`visible` group pattern. Loading skeletons are added for InventoryList, MenuList, and RecipeBuilder using a shared `skeleton` utility class.

**Key Decisions:**
- Token names match CSS custom properties (for readability)
- All 21 .vue files touched — systematic find-and-replace
- Cards unified to the shortcut pattern
- `primary-*` color family added to UnoCSS to fix RecipeBuilder

**Trade-offs:**
- (+) Complete visual consistency — one color source of truth
- (+) Adds loading skeletons to all data views
- (-) High churn — touches every Vue file, high review burden
- (-) Risk of missed literals or regressions in visual appearance (every hex change must be verified)

**Probability:** 0.82
**Complexity:** Medium
**Risks:** Hex value mismatch during replacement — `#E5E7EB` vs `#E9ECEF` are visually close but not identical. Need to decide which is canonical and verify each change.

---

### Approach C: "WS-First Architecture" (High Probability ~0.80)

**Summary:** Focus primarily on the WebSocket layer, treating the CSS issues as secondary. Rewrite `useOrderFeed` as a properly resilient real-time transport with optimistic cache patching, auth, and error recovery, then add a new Pinia store for KDS order state that decouples the KDS from TanStack Query's REST polling.

**Description:** Replace `useOrderFeed.ts` entirely. The new composable connects via Socket.IO with `transports: ['websocket', 'polling']`, reads the server URL from `import.meta.env.VITE_WS_URL || ''` (empty string = relative/current origin), sends auth token via `auth: { token }`, and listens for `connect_error` with exponential backoff. On `order:update`, instead of calling `invalidateQueries`, parse the payload (`{ id, status, orderNumber }`) and call `queryClient.setQueryData(['orders'], old => old.map(o => o.id === payload.id ? { ...o, status: payload.status } : o))`. This is an O(n) patch that avoids a network round-trip. Also listen for the server's `connected` event.

Separately, create a Pinia store `useKdsStore` that holds the orders array and derives column groupings. The store listens to the WebSocket feed and also provides `fetchOrders()` as a fallback. This decouples the KDS view from TanStack Query entirely for order data, making it a true real-time experience. The `useOrderFeed` composable becomes a thin adapter between the socket and the store.

CSS fixes are handled minimally: define `.field` in main.css, swap the icon, add `relative` to the tooltip.

**Key Decisions:**
- WebSocket is elevated to a first-class data source with Pinia store
- TanStack Query retains its role for non-real-time modules (inventory, menu, analytics)
- CSS fixes are scoped to only broken things

**Trade-offs:**
- (+) Real-time KDS is genuinely real-time — no REST fallback on WS update
- (+) Pinia store provides a single source of truth for KDS, testable in isolation
- (+) Auth and error recovery make WS production-ready
- (-) KDS now has two data sources (Pinia + Query) — mental overhead for new devs
- (-) CSS inconsistencies untouched outside KDS
- (-) Higher complexity for a single-module fix

**Probability:** 0.80
**Complexity:** Medium-High
**Risks:** Race conditions between WS updates and REST mutations (the `useOrderFlow` mutation also invalidates queries). The store could show stale data if WS drops messages. Mitigated by periodic REST sync.

---

### Approach D: "Design System Extraction" (Diversity pick, Probability ~0.08)

**Summary:** Extract a proper component library from the existing codebase. Create `BaseCard`, `BaseButton`, `BaseFormField`, `BaseTooltip`, `SkeletonLoader` wrapper components that encapsulate all styling decisions, then refactor every view to use them. The UnoCSS config gets a complete `primary` palette and new shortcuts are removed in favor of component props.

**Description:** Build a `src/components/ui/` directory with reusable primitives: `UiCard` (supports `variant: 'default' | 'bordered'` and handles shadow, border radius, padding), `UiFormField` (wraps label + input + error in the `field` layout, eliminating the `field` class), `UiTooltip` (uses PrimeVue Tooltip or a custom positioned overlay with proper relative/anchor logic), and `UiSkeleton` (a pulse placeholder with configurable shape). Then refactor all 21 views to use these components instead of raw divs with UnoCSS classes.

For example, each `card` or `bg-white rounded-xl...` becomes `<UiCard>...</UiCard>`. Each form group `<div class="field"><label>...</label><input/></div>` becomes `<UiFormField label="..."><InputText .../></UiFormField>`. This eliminates the possibility of class drift entirely — the styling lives in one place per component.

The WebSocket changes follow Approach C's pattern, but also extract the WS connection logic into `src/services/socket.ts` as a singleton that multiple stores/composables can subscribe to, rather than creating per-instance connections.

**Key Decisions:**
- Components, not shortcuts, become the styling API
- WS connection becomes a singleton service (avoids duplicate sockets if multiple views use KDS)
- Existing PrimeVue components are wrapped, not replaced

**Trade-offs:**
- (+) Maximum consistency — one code path for every card, button, form field
- (+) Eliminates class drift as a category of bug
- (-) Very high churn — 21 views + new component files
- (-) Introduces abstraction overhead — developers must learn the component API
- (-) Unclear separation from PrimeVue — could confuse when to use `<UiCard>` vs `<Panel>`

**Probability:** 0.08
**Complexity:** High
**Risks:** Over-engineering — the existing codebase is small enough that component extraction may not pay off. Risk of "wrapper hell" where every PrimeVue component gets a thin wrapper that adds no value.

---

### Approach E: "Linter-Enforced Convention" (Diversity pick, Probability ~0.06)

**Summary:** Don't fix the code directly — instead, define the conventions in a typed ESLint plugin + Stylelint config that catches inline colors, undefined classes, missing loading states, and WS anti-patterns. Then write codemods (jscodeshift/ts-morph scripts) that auto-fix 80% of violations. Manual fixes handle the rest.

**Description:** Create `eslint-plugin-erp-conventions` with custom rules: `no-inline-hex-color` (flags any `style` binding or `class` with hex color), `no-undefined-utility` (flags classes like `field` or `text-primary-400` that aren't in UnoCSS or main.css), `require-skeleton` (data-table components must have a `loading` state wired), `require-ws-fallback` (Socket.IO transport must include `'polling'`), `no-hardcoded-ws-url` (WS URL must come from env). Build codemods using ts-morph that: (a) replace inline hex colors with their CSS variable equivalents by matching against a palette map, (b) insert `.field { ... }` into main.css, (c) replace `i-ph-plus-bold` with `pi pi-plus`, (d) wrap tooltip containers with `relative`.

Run the codemod, review the diff, fix the remaining 20% manually. For WS, apply the same `useOrderFeed` rewrite as Approach A but enforce it with a lint rule that the `transports` array must include `'polling'` and the URL must be from env. Then CI blocks any new PR that introduces inline colors or missing loading skeletons.

**Key Decisions:**
- Convention is enforced by CI, not by manual review
- Codemods make the fix repeatable across branches
- WS enforcement is lint-based (prevent regression)

**Trade-offs:**
- (+) Prevents regression — same bugs can't reappear
- (+) Codemod can be re-run after future changes
- (-) High upfront investment (plugin + codemod)
- (-) Codemods may produce imperfect output, needing manual cleanup
- (-) 20% manual fixes still needed for edge cases

**Probability:** 0.06
**Complexity:** High
**Risks:** ESLint plugin API for Vue SFCs is complex (need Vue parser). Codemod false positives could introduce breakage. The team may not buy into heavy linting.

---

### Approach F: "Hybrid Module Rewrite" (Diversity pick, Probability ~0.04)

**Summary:** Abandon fixing the existing code incrementally. Instead, rewrite the KDS module from scratch as a standalone real-time micro-frontend embedded via iframe or Web Component, communicating with the main app through a shared Pinia store + postMessage. The Vue components get rebuilt with a unified design system (using only `card` shortcut, no inline styles). The other modules get minimal fixes. The WS layer becomes a dedicated service worker that maintains the socket connection even when the KDS tab is hidden.

**Description:** Create a new `src/modules/kds-next/` directory. Rebuild OrderDashboard, OrderCard, KdsColumn, and OrderTimer using only PrimeVue components and UnoCSS shortcuts — no inline `style` attributes, no hardcoded colors. The new KDS communicates with the backend via a shared WebSocket service worker (`src/services/ws-worker.ts`) that runs in a dedicated thread and forwards events via postMessage. This keeps the socket alive even when the user navigates to other modules. The Pinia store `useKdsStore` lives in the main app and subscribes to the worker's messages.

The old KDS module is kept as a fallback behind a feature flag (`VITE_USE_LEGACY_KDS`). Once the new module is validated in production for a week, the old code is deleted.

For the CSS issues in other modules, apply the minimal fix from Approach A: define `.field`, swap icon, add `relative`. Don't touch inline colors — the rewrite focus is on KDS only.

**Key Decisions:**
- KDS is the highest-value module (real-time, kitchen ops) — worth rewriting
- Service worker keeps WS alive across navigation
- Feature flag allows gradual rollout
- Other modules get band-aid fixes only

**Trade-offs:**
- (+) New KDS is clean, consistent, and fast
- (+) WS survives tab switches and navigation
- (-) Massive duplication during transition (two KDS modules)
- (-) Service worker adds complexity for a single-module feature
- (-) Other modules remain inconsistent

**Probability:** 0.04
**Complexity:** High
**Risks:** Service worker debugging is hard. The feature flag doubles the testing surface. If the rewrite takes too long, the band-aid fixes on other modules may need to be revisited.

---

## Step 4: Diversity Verification

| Approach | Scope | Solution Style | WS Handling | CSS Strategy | Risk Profile |
|---|---|---|---|---|---|
| **A** | All modules | Patch fixes | Consume payload + fallback | Add missing classes + normalize borders | Low |
| **B** | All modules | Systematic refactor | Same as A | Token-driven, all files touched | Medium |
| **C** | KDS-focused | Architectural | Rewrite + Pinia store | Minimal fixes only | Medium |
| **D** | All modules | Component extraction | Singleton service | Eliminate raw classes entirely | High |
| **E** | All modules | Linter + codemod | Enforce via lint | Auto-fix + CI gate | High |
| **F** | KDS rewrite | Micro-frontend | Service worker | New module clean, others band-aid | High |

All six approaches occupy distinct regions of the scope/style/strategy space. No two are minor variations of each other. Approaches A-C represent pragmatic, likely paths (0.80–0.85), while D-F explore higher-risk, higher-reward or unconventional strategies (0.04–0.08).

---

## Appendix: Catalog of Specific Issues Found

| ID | File | Line(s) | Issue |
|---|---|---|---|
| CSS-1 | StockAdjustment.vue | 9, 31, 51, 65 | `.field` class undefined |
| CSS-2 | IngredientForm.vue | 11, 18, 30, 37, 51, 67, 93 | `.field` class undefined |
| CSS-3 | WastageLog.vue | 61 | `i-ph-plus-bold` icon — not PrimeIcons |
| CSS-4 | SalesChart.vue | 39 | Absolute tooltip inside flex-col, no `relative` parent |
| CSS-5 | BrandPerformance.vue | 64 | Inline `border border-[#E9ECEF]` vs `card` shortcut |
| CSS-6 | OrderCard.vue | 4 | Inline `style` border vs `card` shortcut |
| CSS-7 | AnalyticsDashboard.vue | 31-34 | Filter buttons missing hover/active states |
| CSS-8 | RecipeBuilder.vue | 43 | `text-primary-400` — not in UnoCSS theme |
| CSS-9 | InventoryList.vue | — | No loading skeleton |
| CSS-10 | MenuList.vue | — | No loading skeleton |
| CSS-11 | RecipeBuilder.vue | — | No loading skeleton |
| CSS-12 | AnalyticsDashboard.vue | — | No loading skeleton for components |
| CSS-13 | uno.config.ts | 20-34 | `primary` color family missing (only `brand` exists) |
| CSS-14 | StockAdjustment.vue | 8 | Inconsistency: `border-gray-200` (#E5E7EB) vs `border-[#E9ECEF]` |
| WS-1 | useOrderFeed.ts | 11 | Hardcoded `http://localhost:3001` |
| WS-2 | useOrderFeed.ts | 11 | Only `transports: ['websocket']` — no polling fallback |
| WS-3 | useOrderFeed.ts | — | No `connect_error` handler |
| WS-4 | useOrderFeed.ts | 22-24 | Ignores WS payload — calls `invalidateQueries` instead of patching cache |
| WS-5 | useOrderFeed.ts | 10-16 | No `auth` or `withCredentials` |
| WS-6 | useOrderFeed.ts | — | Server `connected` event never handled |
| WS-7 | server.js | 37-43 | Server broadcasts `order:update` but client ignores payload |
