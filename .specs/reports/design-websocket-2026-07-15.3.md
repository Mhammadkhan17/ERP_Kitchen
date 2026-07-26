---
VOTE: Solution A
SCORES:
  Solution A: 4.6/5.0
  Solution B: 4.1/5.0
  Solution C: 3.7/5.0
CRITERIA:
  - issue_resolution_depth: 5
  - design_token_css_architecture: 4
  - component_implementation_quality: 4
  - websocket_network_robustness: 5
  - code_quality_type_safety: 5
  - error_edge_case_coverage: 5
  - implementation_efficiency_risk: 4
---

Solution A ("Foundation First") is the strongest overall, achieving a weighted score of 4.6/5.0. It leads decisively in WebSocket robustness (5 vs 3 for both B and C) and error/edge-case coverage (5 vs 4), driven by its singleton pattern with timestamp-based conflict resolution, targeted single-fetch for unknown orders, debounced updates, and auth from `localStorage`. Its `field` shortcut (`flex flex-col gap-1.5`) is the most elegant design — zero template changes across 15+ wrappers — while Solutions B and C both require template modifications (B renames to `input-field`, C defines a CSS class with a different gap value of `0.25rem`). Solution B scores second at 4.1/5.0; its color mapping table and CSS custom-property token system are the most comprehensive, but its scope (21 files) is larger than warranted, its `input-field` rename introduces unnecessary diff, and its non-singleton WebSocket pattern lacks timestamp guarding. Solution C trails at 3.7/5.0, held back by weaker WebSocket implementation (finite retry count, env-var-bound auth, no singleton), a less complete design token system, and acknowledged gaps in border normalization.

## Issue Resolution Depth

| Solution | Score | Evidence |
|---|---|---|
| **A** | **5** | All 14 subproblems (P1–P14) addressed comprehensively: `field` shortcut (P1), icon fix (P2), tooltip `relative` parent (P3), `card` shortcut unification (P4), `activePeriod` ref + ring states (P5), `primary` color family (P6), semantic color aliases (P7), skeleton states on 3 pages (P8), env URL (P9), polling fallback (P10), `connect_error` handler (P11), `setQueryData` cache patching (P12), localStorage auth (P13), `connected` event handler (P14). |
| **B** | **5** | All 14 subproblems addressed. Most comprehensive hex→token mapping table (Section 3). `card-bordered` variant added for BrandPerformance. Color coverage exhaustive. |
| **C** | **4** | All 14 subproblems addressed but some less thoroughly: `field` gap differs (0.25rem vs intended 0.375rem), border inconsistencies in OrderDashboard acknowledged out-of-scope (Section 3.12 self-verification Q3), WS auth via env var (less flexible than localStorage). |

**Comparative:** A and B both cover 100% of issues, but A's `field` shortcut is more elegant (zero template changes) and its WebSocket edge-case handling is measurably deeper.

## Design Token & CSS Architecture

| Solution | Score | Evidence |
|---|---|---|
| **A** | **4** | `primary` color family mirrors KitchenPreset exactly. Semantic surface/text/border aliases. `field` as UnoCSS shortcut with CSS fallback in `main.css`. Clean separation — tokens in `uno.config.ts`, backup classes in CSS. |
| **B** | **4** | Most comprehensive token system — CSS custom properties as source of truth, then UnoCSS theme referencing them via `var(--xxx)` shortcuts (`text-primary-text`, `text-secondary-text`, `border-border`, `bg-ground`). Complete hex→token mapping (Section 3, 14 hex values mapped). But `card-bordered` shortcut fragments the card pattern slightly — having two card shortcuts (`card` and `card-bordered`) introduces a decision point every time a card is created. |
| **C** | **3** | `field` defined in CSS (not UnoCSS), adds `primary` color family and `skeleton-*` shortcuts. No semantic color tokens. `.btn-filter` states defined in CSS rather than as UnoCSS shortcuts — less idiomatic for the UnoCSS-first approach. |

**Comparative:** B has the richest token vocabulary, but A's simpler approach (UnoCSS-only, no CSS var layer) is cleaner for a project already using `presetWind`. B's `var(--xxx)` approach in shortcuts works but adds indirection.

## Component Implementation Quality

| Solution | Score | Evidence |
|---|---|---|
| **A** | **4** | All component issues fixed. `field` shortcut requires zero template changes — class can remain as `field` in StockAdjustment, IngredientForm, MenuItemForm. Tooltip: adds `relative` to `group` div and repositions tooltip to `-top-8 left-1/2 -translate-x-1/2`. Icon: `i-ph-plus-bold` → `pi pi-plus`. Card: BrandPerformance and OrderCard use `card` shortcut. Filter buttons: `activePeriod` ref + `ring-2 ring-orange-200` active state. |
| **B** | **4** | All component issues fixed. But renames `field` to `input-field` (11 template changes across StockAdjustment and IngredientForm) — unnecessary diff. `card-bordered` for BrandPerformance preserves the border-only look. Tooltip and icon fixes equivalent to A. |
| **C** | **4** | All component issues fixed with minimal changes. But `field` gap is `0.25rem` vs A's `0.375rem` and the original codebase's implied spacing — a minor but unnecessary deviation. `.btn-filter` hover opacity + translateY adds polish but is CSS-based rather than using UnoCSS shortcuts. |

**Comparative:** A's `field` shortcut design is the most maintainable — existing templates need zero changes. B and C both require template edits. All three correctly fix the icon, tooltip, card, and button issues.

## WebSocket & Network Layer Robustness

| Solution | Score | Evidence |
|---|---|---|
| **A** | **5** | Singleton pattern (`singletonSocket`, `singletonConnected`) prevents duplicate connections. URL: `import.meta.env.VITE_WS_URL ?? http://localhost:${VITE_WS_PORT ?? '3001'}`. Transports: `['websocket', 'polling']`. `connect_error` handler with logging + `error` ref. Cache patching: `setQueryData` with functional updater that handles 3 edge cases (empty cache returns undefined, order not found triggers `refetchQueries`, timestamp comparison prevents optimistic-update regression). Uses `structuredClone` for immutable updates. 100ms debounce on rapid updates. Auth: `localStorage.getItem('auth_token')`. Exponential backoff: `reconnectionDelay: 1000, reconnectionDelayMax: 30000, randomizationFactor: 0.5`. Server `connected` event logged. |
| **B** | **3** | Non-singleton — each `useOrderFeed()` call creates a new socket. URL: `import.meta.env.VITE_WS_URL ?? ''` (same-origin fallback). Transports: `['websocket', 'polling']`. Cache patching: basic `old.map()` — no timestamp comparison, no targeted fetch for unknown orders, no debounce. Auth: `withCredentials: true` + `auth: { token }` from env var. Exponential backoff: `reconnectionDelay: 2000, reconnectionDelayMax: 30000`. |
| **C** | **3** | Non-singleton. URL: `import.meta.env.VITE_WS_URL || ''`. Transports: `['websocket', 'polling']`. Cache patching: basic `old.map()` with delayed `invalidateQueries` at 5s (safety net — strong idea). But `reconnectionAttempts: 10` (finite, not ideal for production). Auth from env var. No timestamp comparison, no targeted fetch. |

**Comparative:** A is clearly superior. The singleton pattern alone prevents a class of bugs that B and C introduce (multiple sockets on route changes). The timestamp-based conflict resolution and targeted single-fetch are production-grade features absent from B and C. C's delayed invalidation at 5s is a pragmatic safety net but doesn't compensate for the missing edge-case handling.

## Code Quality & Type Safety

| Solution | Score | Evidence |
|---|---|---|
| **A** | **5** | Full TypeScript: `Order`, `OrderUpdatePayload` interfaces. `markRaw` for socket ref. Singleton pattern with clear lifecycle. `useQueryClient` from `@tanstack/vue-query`. No `any` types. Proper `onUnmounted` cleanup. `import.meta.env` typed implicitly. Functional updater with `structuredClone`. |
| **B** | **4** | Good TypeScript: `OrderUpdatePayload` interface, `OrderStatus` type imported. Clean Composition API usage. But non-singleton pattern means each consumer creates a new `Socket` instance — potential for N connections from N consumers. |
| **C** | **4** | Good TypeScript: `OrderUpdatePayload` interface, `Order['status']` type access. Clean code. But non-singleton pattern, same concern as B. `reconnectionAttempts: 10` is a magic number. |

**Comparative:** A's use of `markRaw`, `singletonSocket` pattern, and `structuredClone` demonstrates deeper Vue 3 + TypeScript expertise. B and C are clean but less sophisticated.

## Error, Loading & Edge Case Coverage

| Solution | Score | Evidence |
|---|---|---|
| **A** | **5** | Skeleton states on AnalyticsDashboard (4 KPI + chart + table), InventoryList (5 rows × 6 cols), MenuList (5 rows × 6 cols). WS edge cases: empty cache (no-op), order not found (targeted `api.orders.get(id)`), optimistic update conflict (timestamp comparison), rapid updates (debounce 100ms). All skeleton states use `animate-pulse` to match existing KDS pattern. |
| **B** | **4** | Skeleton states on AnalyticsDashboard, InventoryList, MenuList, RecipeBuilder. Reusable `skeleton-*` shortcuts (`skeleton-text`, `skeleton-heading`, `skeleton-avatar`, `skeleton-card`). WS edge case: cache is `null` — returns unchanged (no-op). But no timestamp comparison, no targeted fetch, no debounce. |
| **C** | **4** | Skeleton states on AnalyticsDashboard, InventoryList, MenuList, RecipeBuilder. Good skeleton conditions: `v-if="isLoading && !ingredients"` shows skeleton only on initial load, falls through to DataTable loading for refetches. WS edge case: delayed invalidation at 5s as safety net. But `reconnectionAttempts: 10` means eventual permanent disconnection if server is down. |

**Comparative:** A's WS edge-case handling is the primary differentiator. C's delayed invalidation is a clever addition that B lacks, but it doesn't address the core edge cases A handles (timestamp conflicts, targeted fetch).

## Implementation Efficiency & Risk

| Solution | Score | Evidence |
|---|---|---|
| **A** | **4** | 14 files modified + 2 new files (`.env`, this doc). Scope is well-matched to the 14 subproblems. `field` shortcut design is risk-minimizing (zero template changes). Singleton WS pattern prevents multiple-connection risk. Module-by-module migration plan with verified dependency order. |
| **B** | **3** | 21 files modified — largest scope. `input-field` rename creates unnecessary template churn (11 edits across StockAdjustment + IngredientForm). `card-bordered` shortcut fragments the card pattern. Non-singleton WS introduces regression risk. Scope exceeds what the problem warrants. |
| **C** | **4** | 12 files modified — most minimal scope. Conservative approach with surgical changes. But `field` gap difference (0.25rem vs 0.375rem) is a subtle regression risk. 5s delayed WS invalidation is a clever low-risk mitigation. |

**Comparative:** A strikes the best balance — comprehensive changes but well-scoped, with deliberate risk-minimizing choices (zero-template `field`, singleton WS). B over-scopes with unnecessary renames. C under-scopes on some edge cases.

## Final Recommendation

**Vote: Solution A ("Foundation First").** It is the only solution that combines complete issue coverage with production-grade WebSocket resilience (singleton pattern, timestamp-based conflict resolution, targeted fetch, debounce), optimal component fixes (zero-template `field` shortcut), and comprehensive edge-case handling. Its module-by-module migration plan with verified dependency ordering provides the clearest implementation path with the lowest regression risk.

**Confidence: High.** The score gap (A: 4.6, B: 4.1, C: 3.7) is significant across the weighted criteria, particularly in the highest-weighted dimensions (issue resolution depth at 0.25 and design token architecture at 0.20). The WebSocket gap (A: 5 vs B/C: 3) alone accounts for a 0.30-point differential due to its 0.15 weight.

**If Solution A is adopted**, consider cherry-picking two elements from the other solutions:
1. From Solution B: the complete hex→token mapping table (Section 3) as supplementary documentation — it provides a valuable audit trail even if A's approach is used.
2. From Solution C: the delayed `invalidateQueries` at 5s after WS cache patch (line 561-563) — this is a pragmatic safety net that complements A's timestamp-based approach without conflicting with it.
