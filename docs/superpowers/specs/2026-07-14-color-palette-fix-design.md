# Color Palette Consistency & Migration Design

**Date:** 2026-07-14
**Status:** Draft

## Problem

PrimeVue Aura theme ships with an emerald-green primary palette (`#10B981`) and cool slate-gray surfaces. The CloudKitchen ERP app uses a warm orange identity (`#D43900` primary, `#FFF7F0` surface) defined in `main.css` and `uno.config.js`. Since `main.js` configures PrimeVue with stock Aura, every PrimeVue component renders with mismatched colors. The KDS dashboard and Inventory module were already migrated to PrimeVue; Menu and Analytics still use legacy UnoCSS components.

## Goals

1. Align PrimeVue theme with the app's brand identity (navy primary, orange CTA, warm-tinted surfaces).
2. Fix inconsistent `severity` values on existing PrimeVue buttons (KDS, Inventory).
3. Migrate Menu and Analytics pages from legacy UnoCSS components to PrimeVue using the customized theme.
4. Preserve all 67 existing tests and all stores/utils/composables untouched.

## Color Palette

### Primary (Brand & Navigation) — Navy Blue

| Token | Color | Usage |
|-------|-------|-------|
| `primary.50` | `#F1F5F9` | Highlight backgrounds |
| `primary.100` | `#E2E8F0` | Light emphasis |
| `primary.200` | `#CBD5E1` | Subtle borders |
| `primary.300` | `#94A3B8` | Disabled |
| `primary.400` | `#64748B` | Muted |
| `primary.500` | `#1E293B` | **Brand base** |
| `primary.600` | `#172234` | Hover |
| `primary.700` | `#101B2D` | Active |
| `primary.800–950` | Darken progressively | Depth |

### Secondary / CTA — Orange (Button severity="warn")

| Token | Color |
|-------|-------|
| `50` | `#FFF7ED` |
| `100` | `#FFEDD5` |
| `500` | `#F97316` |
| `600` | `#EA580C` |
| `700` | `#C2410C` |

Applied only to Button component's `warn` severity. Tag/Message/Toast `warn` stay on amber (`#F59E0B`) for status indicators.

### Danger — Crimson

| Token | Color |
|-------|-------|
| `500` | `#DC2626` |
| `600` | `#B91C1C` |
| `700` | `#991B1B` |

### Surface — Warm-tinted neutrals

| Token | Color | Role |
|-------|-------|------|
| `surface.0` | `#FFFFFF` | Pure white (cards, dialogs, inputs) |
| `surface.50` | `#FCFAF7` | Page background |
| `surface.100` | `#F2EFEB` | Hover states |
| `surface.200` | `#E8E3DD` | Borders |
| `surface.300` | `#D4CDC5` | Disabled bg |
| `surface.400` | `#B8AFA2` | Icon color |
| `surface.500` | `#8A7F70` | Muted text |
| `surface.600` | `#6B6255` | Secondary text |
| `surface.700` | `#4D473E` | Body text |
| `surface.800` | `#322E28` | Headings |
| `surface.900` | `#1C1915` | Deep text |
| `surface.950` | `#0C0A08` | Near-black |

### Status Colors (unchanged from Aura defaults)

| Severity | Palette | Hex (500) |
|----------|---------|-----------|
| success | Emerald | `#10B981` |
| info | Sky | `#0EA5E9` |
| warn (non-Button) | Amber | `#F59E0B` |
| danger | Red/Crimson | `#DC2626` |

## Architecture

Three independent layers, implemented in order:

### Layer 1: Custom PrimeVue Preset

**New file:** `src/theme/preset.js`

Uses `definePreset(Aura, ...)` to create `AppPreset` with:

1. A custom `warm` primitive color palette (the warm-tinted neutral scale).
2. Semantic `primary` palette overridden to navy blue.
3. Light-mode `surface` palette remapped to `{warm.*}` tokens.
4. Component-level override for `Button.colorScheme.light.warn` → orange CTA colors.

**Edit:** `src/main.js` — import `AppPreset` and use it instead of `Aura`.

No changes to `main.css` or `uno.config.js`. The app's CSS custom properties remain as the design system for non-PrimeVue elements.

### Layer 2: Component Severity Fixes

Files with severity values that need correction:

| File | Change |
|------|--------|
| `OrderCard.vue:108` | `severity="info"` → `severity="warn"` (Dispatch button — orange CTA) |
| `OrderDetail.vue:80` | `severity="info"` → `severity="warn"` (Mark Dispatched) |
| `InventoryList.vue:69` | `Button` no severity → `severity="warn"` (Add button — orange CTA) |
| `IngredientForm.vue:182` | `Button type="submit"` → `severity="warn"` (Add/Update — orange CTA) |

### Layer 3: Menu & Analytics Migration

Component-for-component swap — no logic changes, no new features.

#### MenuList.vue
- `VDataTable` → `DataTable` (same columns, sort, paginate)
- "Recipes" button (`btn-secondary btn-sm`) → `<Button severity="secondary" variant="outlined" size="small">`
- "Add Item" button (`btn-primary btn-sm`) → `<Button severity="warn" size="small">` (orange CTA)
- Keep category filter pills (native buttons, no PrimeVue equivalent)
- MenuItemForm: `VDialog` → `Dialog`, native `<input>`/`<select>` → `InputText`/`Select`

#### WastageLog.vue (Analytics)
- `VDataTable` → `DataTable` (same columns, date filter)
- Keep native `<input type="date">` — PrimeVue DatePicker unnecessary here

#### AnalyticsDashboard.vue
- CSV Export button (`btn-secondary btn-sm`) → `<Button severity="secondary" variant="outlined" size="small">`
- Keep period toggle button group as-is (custom pill UI, no PrimeVue SelectButton needed)

#### Unchanged
- KpiCard, SalesChart, TopSellingTable (no PrimeVue dependency)
- AppDrawer, AppHeader, AppLayout
- All stores, composables, utils
- All test files

## Files Changed Summary

| File | Type |
|------|------|
| `src/theme/preset.js` | **NEW** |
| `src/main.js` | EDIT (2 lines) |
| `src/modules/kds/components/OrderCard.vue` | EDIT (1 severity) |
| `src/modules/kds/views/OrderDetail.vue` | EDIT (1 severity) |
| `src/modules/inventory/views/InventoryList.vue` | EDIT (1 severity) |
| `src/modules/inventory/components/IngredientForm.vue` | EDIT (1 severity) |
| `src/modules/menu/views/MenuList.vue` | EDIT (migrate table + buttons) |
| `src/modules/menu/components/MenuItemForm.vue` | EDIT (migrate dialog + inputs) |
| `src/modules/analytics/components/WastageLog.vue` | EDIT (migrate table) |
| `src/modules/analytics/views/AnalyticsDashboard.vue` | EDIT (migrate buttons) |

## Test Strategy

- All 67 tests operate on logic (stores, utils, components) — none depend on PrimeVue theme rendering.
- Run `npm test` after each layer to verify nothing broke.
- Visual verification via dev server (`npm run dev`) for manual QA.

## Future Considerations (out of scope)

- Dark mode support (Aura has a dark colorScheme — could add `{warm}` mapping for dark mode later)
- PrimeVue migration for remaining custom components (VSearchBar, LoadingSkeleton, etc.) if needed
- Replacing native `<input type="date">` with PrimeVue DatePicker
