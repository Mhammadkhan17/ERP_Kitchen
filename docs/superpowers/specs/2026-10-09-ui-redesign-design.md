# UI/UX Redesign Design: ERP Kitchen

Date: 2026-10-09
Status: Approved by user (design sections 1-4 reviewed individually)
Redesign mode: Preserve (modernize visuals, keep brand and information architecture)

## Design read

An internal cloud-kitchen operations ERP (KDS, inventory, menu, analytics) plus two public
order-tracking pages, for back-of-house staff and end customers, with a dense, functional
language. The current UI reads as AI-slop and is inconsistent: four copies of the orange
ramp, five page-header variants, two skeleton systems, three button implementations, four
card implementations, error states on only three of eight pages.

## Decisions locked with the user

1. **Brand**: keep orange, elevate it. Kill the duplicate color sources and rebuild on tokens.
2. **Theme**: light only. `darkModeSelector: ''` stays; no dark variant in this scope.
3. **Approach**: A, token-first system overhaul. Not an unstyled-PrimeVue rebuild, not a
   surface-only reskin.

## Goals

- One source of truth for color, type, radius, elevation, spacing, and status colors.
- One implementation each for: page header, card, ticket, button usage, search input,
  dialog sizing, loading/empty/error states.
- Every data surface renders exactly one of loading / error / empty / content.
- WCAG AA contrast for all text and ≥3:1 for graphics, verified with measured ratios.
- Build, tests, and lint green after every phase (`npm run build`, `npm test`, `npm run lint`).

## Non-goals

- No route, nav-label, form-field-name, or data-shape changes.
- No information-architecture changes; `/inventory/adjust` and `/menu/recipes` stay sub-pages.
- No dark mode, no new runtime dependencies, no chart-library migration.
- No copy rewrite beyond consistency (sentence case, one voice, action-name stability).

---

## Section 1: Design tokens

### Color roles (measured WCAG ratios)

| Role | Token | Ratio | Notes |
|---|---|---|---|
| Primary action fill, white text | `orange-700 #c2410c`, hover `orange-800 #9a3412`, active `orange-900 #7c2d12` | 5.18, 7.31 | White on `orange-600` is only 3.56:1 and fails AA; orange-700 is the first passing step. |
| Accent graphics (icons, spines, indicators, borders) | `orange-600 #ea580c` | 3.56 (≥3:1) | `orange-500 #f97316` is 2.8:1 against white and fails even the graphics threshold. It survives only as a large tint (for example active nav background). |
| Active nav | bg `orange-50 #fff7ed`, text `orange-700` | 4.88 | Left indicator bar `orange-600`. |
| Status text on white/tint | pending `amber-700 #b45309` (5.02), preparing `blue-600 #2563eb` (5.17), ready `green-700 #15803d` (5.02), dispatched `gray-600 #4b5563` (7.56), critical `red-600 #dc2626` (4.83) | all ≥4.5 | Current amber `#f4a261` (2.06) and green `#2b9348` (3.91) fail as text. |
| Status graphics (spines, dots, bars) | the -600 step of each hue: amber-600 (3.19), blue-600 (5.17), green-600 (3.3), gray-500, red-600 | all ≥3:1 | Rule of the system: **-600 for graphics; -700 for text and action fills, except blue where -600 already passes at 5.17.** |
| Status tag fill | tint -50 background with -700 text | ≥4.5 | e.g. `bg-amber-50 text-amber-700`. |
| Neutrals | Tailwind gray ramp: ground `gray-50 #f9fafb`, card `white`, text `gray-900 #111827` (17.7), secondary `gray-500 #6b7280` (4.63 on ground), border `gray-200 #e5e7eb` | AA | Retires `#1a1d1f`, `#6c757d`, `#e9ecef`, `#f8f9fa` and the stray accent `#e85d3a`. |

Single accent: orange. Status colors are semantic data, not decoration.

### Typography

- **DM Sans** is the single UI and display face (400/500/700). Already the brand voice.
- **JetBrains Mono** (400/500) for data only: order IDs, timers, prices, quantities,
  chart figures. Use `font-variant-numeric: tabular-nums`.
- **Inter removed** from `index.html` and from `body`. Two families, not three.
- Scale on the deliberate `html { font-size: 14px }` density base (kept, now documented):
  micro `0.75rem` (10.5px, sparingly), default UI `0.875rem` (12.25px), emphasis `1rem`,
  section `1.25rem`, page title `1.5rem`.
- Arbitrary pixel sizes banned: `text-[9px]`, `text-[10px]`, `text-[11px]` (12 occurrences).

### Radius (documented three-tier rule)

- Controls (buttons, inputs, icon buttons): `0.5rem`.
- Cards, dialogs, panels: `0.75rem`.
- Chips, badges, status pills: full.
- Conflicting stacked radius classes (`rounded-lg` on top of the `card` shortcut) are removed.

### Elevation (three steps)

- Cards: `gray-200` border + `shadow-sm`.
- Dropdowns, tooltips: `shadow-md`.
- Modals, drawers: `shadow-lg`.
- The bespoke KDS ticket shadow and the `shadow-xl` mobile drawer are replaced by these.

### Spacing

- Page gutters owned solely by `AppLayout` (`p-6`); pages use `flex flex-col gap-6`.
  The duplicated `p-6` inside OrderDashboard and AnalyticsDashboard is removed.
- Allowed gaps: 4/8/12/16/20/24/32px (Uno `gap-1` through `gap-8`); card padding `p-5`.
- Existing oddities (`gap-2.5`, mixed `mb-1`/`mb-2` label margins) normalize.

### Motion

- Subtle tier: 150-200ms transitions on color, opacity, transform only.
- One motivated entrance: a new ticket sliding into its KDS column on socket arrival.
- All motion honors `prefers-reduced-motion`.
- One shared `slide-fade` token (200ms, -8px) replaces the two divergent per-page variants
  (0.3s/-10px and 0.25s/-8px).

### Signature: the ticket

Every order representation shares one anatomy: 3px status spine on the left edge, mono
order number, mono elapsed or arrival time. It appears on the KDS board, the tracking
result, and the portal list so staff and customer surfaces read as one system. Validated
against real KDS products (Toast, Oracle, dedicated KDS UIs): color-coded tickets, status
spines, prominent timers with age-based escalation, large one-tap controls for gloved hands.

---

## Section 2: App shell and shared kit

### Layout shell

- `AppLayout.vue`: keeps `p-6` as the only page-gutter owner; mounts `<Toast />` and
  `<ConfirmDialog />` globally (InventoryList stops mounting its own).
- `PublicLayout.vue`: gains `<Toast />` (today snackbars on `/track` and `/portal` have no host).
- `AppDrawer.vue` and `AppHeader.vue`: nav markup is copy-pasted today; extract one
  `NavList.vue` used by both. Icons move from HTML strings in `constants/nav.ts` rendered
  via `v-html` to a typed icon-name map rendered with a component. One active-state recipe.
- Header heights align at 56px; brand block in drawer and header share the same baseline.

### PageHeader (new: `src/components/ui/PageHeader.vue`)

- Props: `title`, `subtitle?`, `align: 'left' | 'center'` (default left; the two public
  pages pass center as their documented exception), `actions?` slot.
- Kills five variants: `text-xl` DM Sans, `text-2xl gray-900`, `text-2xl gray-800`, the
  `page-header` shortcut, centered public h1s. Title `text-2xl font-semibold`, subtitle
  `text-sm text-gray-500`.

### State kit (new: `src/components/ui/`)

- `AppSkeleton.vue`: variants `table`, `cards`, `kpi`, `panel`. Replaces Uno skeleton
  shortcuts where inconsistent and the duplicated hand-rolled markup in OrderTracking and
  CustomerPortal.
- `AppEmptyState.vue`: icon + title + optional hint + optional action. Sentence-case copy.
- `AppErrorState.vue`: message + Retry wired to Vue Query `refetch`.
- Contract: every data surface renders exactly one of loading / error / empty / content.
  Never an empty table with a message beneath its header (current TopSellingTable,
  WastageLog bug).

### Controls

- `AppSearchInput.vue`: one PrimeVue 4 `IconField` implementation. Fixes both PV3
  `p-input-icon-left` leftovers (`MenuList`, `IngredientPicker`; the class no longer exists
  in PrimeVue 4.5.5) and unifies the two divergent IconField usages.
- Buttons: all actions are PrimeVue `Button` with severity props. Uno `btn-primary`,
  `btn-secondary`, `btn-ghost` shortcuts are deleted (removes the double-styled buttons in
  WastageLog). Status CTAs use severity mapped from order status, not hardcoded
  `bg-[#4A90D9]`.
- KDS CTAs: minimum 44px height for gloved-hand targets; other buttons default size.
- `AppDialog.vue`: named sizes `sm 24rem / md 32rem / lg 40rem` replace four incompatible
  dialog widths; header/footer padding via PrimeVue component tokens.
- Period filter on Analytics uses PrimeVue `SelectButton`, replacing the
  `btn-filter-active/inactive` pair (no new custom component).

### Cards

- One `.card` Uno shortcut: white, `0.75rem` radius, `gray-200` border, `shadow-sm`, `p-5`.
- The three ad-hoc variants collapse into it. Ticket cards get a `ticket` variant: same
  base plus the 3px status spine.

---

## Section 3: Page-by-page

### 1. `/kds` OrderDashboard (flagship)

- `PageHeader` (title "Kitchen display", subtitle = live date); socket pill and refresh in
  `actions`. The pill keeps the one permitted semantic dot (live green / offline red).
- Remove the extra `p-6`; keep the 4-column responsive grid.
- Column headers: count badge + sentence-case title, totals in mono.
- `OrderCard` becomes the canonical ticket: -600 spine, mono order number, mono elapsed
  timer with age escalation (green-700 then amber-700 then red-600 at thresholds), source
  chip, mono price, one status-severity CTA at 44px.
  Age-escalation thresholds are constants in `constants/orderStatus.ts` (default: under
  8 minutes green-700, 8 to 12 minutes amber-700, over 12 minutes red-600), adjustable
  without touching components.
- Detail dialog via `AppDialog md`; special-instructions callout becomes
  `Message severity="warn"`.
- Loading: 4 `AppSkeleton cards`; error: `AppErrorState`; empty columns: compact
  `AppEmptyState`.
- Motivated entrance animation for socket-arrived tickets, reduced-motion aware.
- Deletes dead `OrderTimer.vue`.

### 2. `/inventory` InventoryList

- `PageHeader` + actions (Stock Adjustment secondary, Add Ingredient primary).
- Adds `AppErrorState` (currently none) and `AppEmptyState` for zero results.
- Search via `AppSearchInput`; DataTable keeps the uppercase micro-header style as the
  documented table convention.
- Status tags move to the tinted-tag recipe; `LowStockBanner` stays `Message severity="warn"`.
- ConfirmDialog host moves to `AppLayout`.

### 3. `/inventory/adjust` StockAdjustment

- Removes the conflicting `card` + `rounded-lg` classes.
- One label recipe (above input, `text-sm font-medium text-gray-700`, no manual `mb-1`
  fighting the `.field` gap).
- Field errors unify to `red-600`; orange preview callout becomes `Message severity="info"`.
- Centered `max-w-xl` single-card layout stays.

### 4. `/menu` MenuList

- `PageHeader`; PV3 search span becomes `AppSearchInput`.
- Adds error + empty states.
- Brand `Chip` keeps runtime per-brand colors: data-driven and semantic, exempt from the
  palette lock.
- One standard icon-button recipe for edit; `ToggleSwitch` unchanged.

### 5. `/menu/recipes` RecipeBuilder

- `PageHeader`; accordion panels all use `.card`.
- `IngredientPicker` PV3 class fixed via `AppSearchInput`.
- Fixes the architecture violation: direct `api.menu.recipes.get()` in the view moves into
  the `useMenu` composable (ONBOARDING rule).
- Page-level `AppSkeleton cards`; save keeps snackbar feedback.

### 6. `/analytics` AnalyticsDashboard

- `PageHeader` + `SelectButton` period filter; gutters deduped.
- `KpiCard`: one card definition, 24px gray-500 icon, mono tabular value; delete the dead
  `trend` prop branch (never passed).
- `DailyRevenueGraph`: all `#E85D3A` hardcoded values become orange-600 tokens; axis labels
  move off `text-[9px]`/`text-[10px]`; empty state moves inside the chart frame.
- `WastageLog`: removes double-styled buttons; empty message no longer under an empty table.
- `TopSellingTable`: empty state via the never-both rule.
- `BrandPerformance`: grays unified; progress bars keep per-brand fills (same exemption);
  stays top-N, no long dump.

### 7. `/track` OrderTracking (public)

- Centered hero kept as documented exception; header via `PageHeader align="center"`.
- Kit replaces the hand-rolled skeleton; empty and error via kit components.
- Local `slide-fade` merges into the shared transition token.
- Inline `red-600` validation message stays under the field.

### 8. `/portal` CustomerPortal (public)

- Kit replaces duplicated skeleton/error/empty code.
- Login form: labels above inputs, error below field, submit loading state via PrimeVue.
- Order list uses the compact ticket variant (spine + mono ID).
- Toast host arrives with `PublicLayout`.

### 9. Shell pages

Covered by Section 2 (drawer, mobile header, public header, toast and confirm mounting).

---

## Section 4: Cleanup, guardrails, verification

### Dead code and drift

- Delete: `OrderTimer.vue`, `formatters.ts` `statusColor()` (only its own test),
  `KpiCard` `trend` branch, Uno `badge` and `input` shortcuts, the duplicate `.field`
  definition in `main.css`.
- Orange ramp defined in four places collapses to `plugins/primevue.ts` as the only
  primitive source; Uno theme imports the same values.
- Status colors defined in four places collapse to `constants/orderStatus.ts`; dead
  `--status-*` vars in `main.css` removed.
- `OrderCardCompact` raw `toFixed(2)` switches to `formatCurrency()` (13 money displays agree).
- `index.html` body hex classes move to the gray ramp.

### Copy voice

- Sentence case everywhere; plain verbs on controls; status nouns consistent; empty states
  name the situation and the next action.
- No em-dashes in any visible string.

### Docs

- `docs/ONBOARDING.md` design-system section rewritten to match reality: palette, type,
  radius/elevation/spacing, state-kit contract, button conventions, the
  "one card, one button, one header" rules. Stale brand hexes (`#E65100`, `#D32F2F`,
  `#2E7D32`) that appear nowhere in `src/` are corrected.

### What never changes

Route paths and names, nav labels, form field names and order, data shapes, the
`Component -> composable -> api/client.ts` boundary, existing test public behavior.

### Accessibility gate (mechanical)

- Filled actions ≥4.5:1 white-on-fill (Section 1 table defines allowed fills).
- Status text ≥4.5:1 on white and on tint -50 backgrounds; graphics ≥3:1.
- Touch targets ≥44px on KDS CTAs; visible focus rings everywhere (PrimeVue focus kept).
- `prefers-reduced-motion` collapses the ticket entrance.
- Keyboard nav through drawer, dialogs, and tables unchanged.

### Verification (after every phase)

- `npm run build`, `npm test`, `npm run lint`.
- Final grep audit: no hex colors outside `plugins/primevue.ts` and
  `constants/orderStatus.ts`; no `text-[9px]`/`text-[10px]`/`text-[11px]`;
  no `p-input-icon-left`; no `btn-primary` class on PrimeVue Buttons; no `v-html` nav icons.

### Implementation order (phases)

- Phase 0: tokens (PrimeVue preset, Uno theme, CSS vars, status module, font links).
- Phase 1: shell (layouts, NavList, PageHeader, gutters).
- Phase 2: kit (states, search, dialog, segmented control, card, button rules).
- Phase 3: pages in order KDS, Inventory (list, adjust), Menu (list, recipes), Analytics,
  Track, Portal.
- Phase 4: cleanup, docs, grep audit, full verification.
