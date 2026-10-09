# UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inconsistent AI-slop frontend styling with a single token-driven design system (orange brand elevated, DM Sans + JetBrains Mono, one shell, one component kit) across all 8 app pages, verified by build, tests, lint, and a hex/grep audit.

**Architecture:** Phase order is tokens, then shell, then kit components, then page migrations, then cleanup. A new `src/constants/palette.ts` becomes the only orange source; `src/constants/orderStatus.ts` becomes the only status-color source. New UI kit components live in `src/components/ui/`. Pages keep their existing data flow (`views -> composables -> api/client.ts`); only presentation classes and kit adoption change.

**Tech Stack:** Vue 3 + TypeScript + Vite, PrimeVue 4.5.5 (`@primevue/themes` Aura preset), UnoCSS (presetWind), Vitest + @vue/test-utils, TanStack Vue Query, Socket.IO.

## Global Constraints

- Accent is orange only; no navy, teal, or second brand hue. Action fills use orange-700 `#c2410c` (white text, 5.18:1). Graphics use orange-600 `#ea580c` (3.56:1). `orange-500 #f97316` is never used for small graphics on white.
- Status text on white: pending `amber-700 #b45309`, preparing `blue-600 #2563eb`, ready `green-700 #15803d`, dispatched `gray-600 #4b5563`, critical `red-600 #dc2626`. Status graphics use the -600 step (blue stays -600 for text; it already passes 5.17:1).
- Neutrals are the Tailwind gray ramp only. No `#1a1d1f`, `#6c757d`, `#e9ecef`, `#f8f9fa`, `#e85d3a` anywhere.
- Type: DM Sans (UI) + JetBrains Mono (data, `font-variant-numeric: tabular-nums`). Inter is removed from `index.html` and CSS. No `text-[9px]`, `text-[10px]`, `text-[11px]`.
- Radius: controls `rounded-lg` (0.5rem), cards/dialogs `rounded-xl` (0.75rem), pills `rounded-full`. `html { font-size: 14px }` stays.
- Elevation: cards = `border border-gray-200` + `shadow-sm`; dropdowns `shadow-md`; modals/drawers `shadow-lg`.
- Every data surface renders exactly one of loading / error / empty / content. Never an empty table plus a message beneath its header.
- Never fetch in views; only `src/api/client.ts` via composables (ONBOARDING rule).
- KDS primary CTAs ≥ 44px tall. All motion honors `prefers-reduced-motion`.
- No em-dashes in any user-visible string.
- After every task: `npm run build`, `npm test`, `npm run lint` must pass.
- Route paths, nav labels, form field names/order, and data shapes never change.
- Commit at the end of every task (conventional commit messages below).

## File Structure

| File | Responsibility |
|---|---|
| `src/constants/palette.ts` (new) | Single orange ramp export for Uno + PrimeVue |
| `plugins/primevue.ts` | KitchenPreset: semantic orange + surface ramp + dialog/button component tokens |
| `uno.config.ts` | Shortcuts and theme; imports palette; no duplicate ramps |
| `src/styles/main.css` | Body font, html size, datatable/scrollbar structural CSS only |
| `src/constants/orderStatus.ts` | Only source of status labels, severities, tint/spine/text/CTA classes, timer tiers, chart hexes |
| `src/components/ui/PageHeader.vue` (new) | One page header |
| `src/components/ui/NavList.vue` (new) | One nav list for drawer + mobile drawer |
| `src/components/ui/AppSkeleton.vue` (new) | Loading states (table/cards/kpi/panel) |
| `src/components/ui/AppEmptyState.vue` (new) | Empty states |
| `src/components/ui/AppErrorState.vue` (new) | Error states with retry |
| `src/components/ui/AppSearchInput.vue` (new) | One PrimeVue 4 search field |
| `src/components/ui/AppDialog.vue` (new) | Dialog with sm/md/lg width map |
| `src/constants/nav.ts` | Typed icon names, no HTML strings |
| `src/modules/kds/components/OrderCard.vue` | Canonical ticket |
| `src/modules/kds/composables/useOrderDashboard.ts` | Column metadata via class maps |
| Page views/components under `src/modules/*/` | Kit adoption, per-page tasks below |
| `src/components/common/KpiCard.vue` | Card + mono value; trend prop deleted |
| `src/components/common/AppSnackbar.vue` | Unchanged API; used by pages |
| `src/utils/formatters.ts` | `statusColor` deleted; `formatCurrency` kept |
| `docs/ONBOARDING.md` | Design-system section rewritten |

---

### Task 1: Palette module, Uno theme, PrimeVue preset

**Files:**
- Create: `src/constants/palette.ts`
- Modify: `uno.config.ts`, `plugins/primevue.ts`

**Interfaces:**
- Produces: `export const ORANGE: Record<'50'|'100'|'200'|'300'|'400'|'500'|'600'|'700'|'800'|'900', string>` from `src/constants/palette.ts`; Uno utilities `bg-orange-*`, `text-orange-*`, `bg-primary-*`, `text-primary-*` keep working; KitchenPreset stays the default export shape used in `main.ts`.

- [ ] **Step 1: Create the palette module**

```ts
// src/constants/palette.ts
export const ORANGE = {
  50: '#fff7ed',
  100: '#ffedd5',
  200: '#fed7aa',
  300: '#fdba74',
  400: '#fb923c',
  500: '#f97316',
  600: '#ea580c',
  700: '#c2410c',
  800: '#9a3412',
  900: '#7c2d12',
} as const
```

- [ ] **Step 2: Rewire Uno theme (single ramp, delete `brand`, delete unused shortcuts later in Task 15)**

Replace the whole `theme` block in `uno.config.ts` with:

```ts
import { ORANGE } from './src/constants/palette'
// ...inside defineConfig:
theme: {
  colors: {
    primary: { ...ORANGE },
  },
},
```

Keep existing `shortcuts` untouched in this task (pages still use them until migrated).

- [ ] **Step 3: Rewire KitchenPreset and add component tokens**

Replace `plugins/primevue.ts` with:

```ts
import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'
import { ORANGE } from '../src/constants/palette'

export const KitchenPreset = definePreset(Aura, {
  semantic: {
    primary: { ...ORANGE },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
    },
  },
  components: {
    dialog: {
      colorScheme: {
        light: {
          root: { borderRadius: '0.75rem' },
          header: {
            padding: '1.25rem 1.5rem',
            borderColor: '{content.border.color}',
            borderColor: '{content.border.color}',
          },
          content: { padding: '1.5rem' },
          footer: {
            padding: '1rem 1.5rem',
            borderColor: '{content.border.color}',
            gap: '0.5rem',
            justifyContent: 'flex-end',
          },
        },
      },
    },
  },
})
```

(If a documented token name such as `header.borderColor` is rejected by the type checker, drop that single property; padding and radius tokens are the required ones.)

- [ ] **Step 4: Verify build and tests**

Run: `npm run build && npm test && npm run lint`
Expected: PASS (no consumer changes yet; `RecipeBuilder.vue` still uses `text-primary-400`, which resolves via the new `primary` ramp).

- [ ] **Step 5: Commit**

```bash
git add src/constants/palette.ts uno.config.ts plugins/primevue.ts
git commit -m "refactor(tokens): single orange source for Uno and PrimeVue"
```

---

### Task 2: Fonts, body, main.css cleanup

**Files:**
- Modify: `index.html:10`, `index.html:19`, `src/styles/main.css`

**Interfaces:**
- Consumes: Task 1 (PrimeVue emits its own `--p-*` variables from KitchenPreset).
- Produces: body font stack DM Sans; no Inter anywhere; `main.css` contains no orange/status hex and no `:root` token block.

- [ ] **Step 1: Update font link (drop Inter)**

In `index.html` line 10, replace the href with:

```html
href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap"
```

- [ ] **Step 2: Update body classes**

Line 19 becomes:

```html
<body class="bg-gray-50 text-gray-900 antialiased">
```

- [ ] **Step 3: Rewrite main.css**

Keep only: `html { font-size: 14px }`, the body rule (font stack below), `.font-display`, `.font-mono`, the `.p-datatable` header/cell rules (replace hexes with the ramp values `#f9fafb`/`#6b7280` already used, which stay because they are the gray ramp), the scrollbar rules (already ramp hexes `#d1d5db`/`#9ca3af`), and the `.p-dialog` padding rules are now deleted (Task 1 preset owns dialog chrome). Delete the `:root` block, the duplicate `.field` rule, and the Inter body font.

Body rule:

```css
body {
  margin: 0;
  font-family:
    'DM Sans',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 4: Verify**

Run: `npm run build && npm test && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html src/styles/main.css
git commit -m "refactor(tokens): DM Sans body, drop Inter and legacy css vars"
```

---

### Task 3: orderStatus.ts as single status source (TDD)

**Files:**
- Modify: `src/constants/orderStatus.ts`
- Test: `src/constants/orderStatus.test.ts` (new)

**Interfaces:**
- Produces (all consumed by later tasks):
  - `ORDER_STATUS_LABELS`, `ORDER_STATUS_SEVERITY` (unchanged shapes)
  - `ORDER_STATUS_TINT_CLASS: Record<OrderStatus, string>` (replaces `ORDER_STATUS_BADGE_CLASS`)
  - `ORDER_STATUS_SPINE_CLASS: Record<OrderStatus, string>`
  - `ORDER_STATUS_TEXT_CLASS: Record<OrderStatus, string>`
  - `ORDER_STATUS_HEX: Record<OrderStatus, string>` (rename of `ORDER_STATUS_COLORS`, charts/column dots only)
  - `ORDER_STATUS_CTA: Record<OrderStatus, { label: string; severity: 'info' | 'success' | 'contrast' } | null>`
  - `TIMER_THRESHOLDS = { soonMinutes: 8, lateMinutes: 12 } as const`
  - `export function timerTier(elapsedMinutes: number): 'ontrack' | 'soon' | 'late'`
  - `TIMER_TIER_CLASS: Record<'ontrack' | 'soon' | 'late', string>`

- [ ] **Step 1: Write the failing test**

```ts
// src/constants/orderStatus.test.ts
import { describe, it, expect } from 'vitest'
import {
  timerTier,
  TIMER_TIER_CLASS,
  ORDER_STATUS_TINT_CLASS,
  ORDER_STATUS_SPINE_CLASS,
  ORDER_STATUS_CTA,
} from './orderStatus'
import type { OrderStatus } from '@/types'

describe('timerTier', () => {
  it('is ontrack under 8 minutes', () => {
    expect(timerTier(0)).toBe('ontrack')
    expect(timerTier(7.9)).toBe('ontrack')
  })
  it('is soon from 8 to under 12 minutes', () => {
    expect(timerTier(8)).toBe('soon')
    expect(timerTier(11.9)).toBe('soon')
  })
  it('is late at 12 minutes and above', () => {
    expect(timerTier(12)).toBe('late')
    expect(timerTier(99)).toBe('late')
  })
  it('maps tiers to AA text classes', () => {
    expect(TIMER_TIER_CLASS.ontrack).toBe('text-green-700')
    expect(TIMER_TIER_CLASS.soon).toBe('text-amber-700')
    expect(TIMER_TIER_CLASS.late).toBe('text-red-600')
  })
})

describe('status class maps', () => {
  const statuses: OrderStatus[] = ['pending', 'preparing', 'ready', 'dispatched', 'cancelled']
  it('every status has tint, spine, and CTA entries', () => {
    for (const s of statuses) {
      expect(ORDER_STATUS_TINT_CLASS[s]).toBeTruthy()
      expect(ORDER_STATUS_SPINE_CLASS[s]).toBeTruthy()
    }
    expect(ORDER_STATUS_CTA.pending?.label).toBe('Start')
    expect(ORDER_STATUS_CTA.preparing?.label).toBe('Ready')
    expect(ORDER_STATUS_CTA.ready?.label).toBe('Dispatch')
    expect(ORDER_STATUS_CTA.dispatched).toBeNull()
    expect(ORDER_STATUS_CTA.cancelled).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/constants/orderStatus.test.ts`
Expected: FAIL (exports missing).

- [ ] **Step 3: Rewrite the constants module**

```ts
import type { OrderStatus } from '@/types'

export const ORDER_STATUS_HEX: Record<OrderStatus, string> = {
  pending: '#b45309',
  preparing: '#2563eb',
  ready: '#15803d',
  dispatched: '#4b5563',
  cancelled: '#4b5563',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  dispatched: 'Dispatched',
  cancelled: 'Cancelled',
}

export const ORDER_STATUS_SEVERITY: Record<OrderStatus, string> = {
  pending: 'warn',
  preparing: 'info',
  ready: 'success',
  dispatched: 'contrast',
  cancelled: 'danger',
}

export const ORDER_STATUS_TINT_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  preparing: 'bg-blue-50 text-blue-600',
  ready: 'bg-green-50 text-green-700',
  dispatched: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-600',
}

export const ORDER_STATUS_SPINE_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-amber-600',
  preparing: 'bg-blue-600',
  ready: 'bg-green-600',
  dispatched: 'bg-gray-500',
  cancelled: 'bg-gray-400',
}

export const ORDER_STATUS_TEXT_CLASS: Record<OrderStatus, string> = {
  pending: 'text-amber-700',
  preparing: 'text-blue-600',
  ready: 'text-green-700',
  dispatched: 'text-gray-600',
  cancelled: 'text-gray-600',
}

export const ORDER_STATUS_CTA: Record<
  OrderStatus,
  { label: string; severity: 'info' | 'success' | 'contrast' } | null
> = {
  pending: { label: 'Start', severity: 'info' },
  preparing: { label: 'Ready', severity: 'info' },
  ready: { label: 'Dispatch', severity: 'success' },
  dispatched: null,
  cancelled: null,
}

export const TIMER_THRESHOLDS = { soonMinutes: 8, lateMinutes: 12 } as const

export type TimerTier = 'ontrack' | 'soon' | 'late'

export function timerTier(elapsedMinutes: number): TimerTier {
  if (elapsedMinutes >= TIMER_THRESHOLDS.lateMinutes) return 'late'
  if (elapsedMinutes >= TIMER_THRESHOLDS.soonMinutes) return 'soon'
  return 'ontrack'
}

export const TIMER_TIER_CLASS: Record<TimerTier, string> = {
  ontrack: 'text-green-700',
  soon: 'text-amber-700',
  late: 'text-red-600',
}
```

- [ ] **Step 4: Fix the three existing importers so the build stays green**

1. `src/utils/formatters.ts`: delete `statusColor` and its `ORDER_STATUS_COLORS` import; keep `statusLabel` (imports `ORDER_STATUS_LABELS`).
2. `src/utils/formatters.test.ts`: delete the `statusColor` describe block and its import.
3. Temporary shims (removed in Task 15): at the bottom of `orderStatus.ts` do NOT keep old names; instead update now the files that still reference old names:
   - `src/modules/kds/composables/useOrderDashboard.ts:5`: change import to `ORDER_STATUS_HEX` and replace `ORDER_STATUS_COLORS.<status>` with `ORDER_STATUS_HEX.<status>` (full column migration happens in Task 9; this is a rename-only fix).
   - `src/modules/kds/components/OrderCard.vue:113`: change import to `ORDER_STATUS_HEX` and the computed on line 135 to use it (full ticket rewrite happens in Task 8).
   - `src/modules/order-status/components/OrderCardCompact.vue:28`: import `ORDER_STATUS_TINT_CLASS` instead of `ORDER_STATUS_BADGE_CLASS` (rename-only fix).

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/constants/orderStatus.test.ts src/utils/formatters.test.ts && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/constants/orderStatus.ts src/constants/orderStatus.test.ts src/utils/formatters.ts src/utils/formatters.test.ts src/modules/kds/composables/useOrderDashboard.ts src/modules/kds/components/OrderCard.vue src/modules/order-status/components/OrderCardCompact.vue
git commit -m "feat(design): AA status class maps and timer tiers in orderStatus"
```

---

### Task 4: PageHeader component (TDD)

**Files:**
- Create: `src/components/ui/PageHeader.vue`
- Test: `src/components/ui/__tests__/PageHeader.test.ts`

**Interfaces:**
- Produces: `<PageHeader title="..." subtitle="..." align="left|center">` with `actions` slot. Align default `left`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from '../PageHeader.vue'

describe('PageHeader', () => {
  it('renders title and subtitle', () => {
    const w = mount(PageHeader, { props: { title: 'Analytics', subtitle: 'Overview' } })
    expect(w.text()).toContain('Analytics')
    expect(w.text()).toContain('Overview')
  })
  it('defaults to left aligned h1', () => {
    const w = mount(PageHeader, { props: { title: 'Menu' } })
    expect(w.find('h1').classes()).toContain('text-2xl')
    expect(w.find('h1').classes()).not.toContain('text-center')
  })
  it('supports center align and actions slot', () => {
    const w = mount(PageHeader, {
      props: { title: 'Track', align: 'center' },
      slots: { actions: '<button id="a">Refresh</button>' },
    })
    expect(w.find('h1').classes()).toContain('text-center')
    expect(w.find('#a').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/__tests__/PageHeader.test.ts`
Expected: FAIL (component missing).

- [ ] **Step 3: Implement**

```vue
<!-- src/components/ui/PageHeader.vue -->
<template>
  <div
    class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    :class="align === 'center' && 'text-center sm:flex-col sm:items-center'"
  >
    <div :class="align === 'center' ? 'sm:text-center' : 'min-w-0'">
      <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">{{ title }}</h1>
      <p v-if="subtitle" class="text-sm text-gray-500 mt-1">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  align?: 'left' | 'center'
}>()
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/__tests__/PageHeader.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/PageHeader.vue src/components/ui/__tests__/PageHeader.test.ts
git commit -m "feat(ui): PageHeader component"
```

---

### Task 5: State kit components (TDD)

**Files:**
- Create: `src/components/ui/AppSkeleton.vue`, `AppEmptyState.vue`, `AppErrorState.vue`
- Test: `src/components/ui/__tests__/StateKit.test.ts`

**Interfaces:**
- Produces:
  - `<AppSkeleton variant="table|cards|kpi|panel" :count="n" />`
  - `<AppEmptyState title="..." hint="...">` + `action` slot; emits nothing
  - `<AppErrorState message="..." />` emits `retry`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSkeleton from '../AppSkeleton.vue'
import AppEmptyState from '../AppEmptyState.vue'
import AppErrorState from '../AppErrorState.vue'

describe('state kit', () => {
  it('skeleton renders count blocks for cards', () => {
    const w = mount(AppSkeleton, { props: { variant: 'cards', count: 4 } })
    expect(w.findAll('.animate-pulse')).toHaveLength(4)
  })
  it('empty state shows title and hint', () => {
    const w = mount(AppEmptyState, {
      props: { title: 'No matching ingredients', hint: 'Try a different search' },
    })
    expect(w.text()).toContain('No matching ingredients')
    expect(w.text()).toContain('Try a different search')
  })
  it('error state shows message and emits retry', async () => {
    const w = mount(AppErrorState, { props: { message: 'Could not load orders' } })
    expect(w.text()).toContain('Could not load orders')
    await w.find('button').trigger('click')
    expect(w.emitted('retry')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/__tests__/StateKit.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the three components**

```vue
<!-- src/components/ui/AppSkeleton.vue -->
<template>
  <div v-if="variant === 'cards'" class="grid gap-4" :data-count="count">
    <div v-for="i in count" :key="i" class="card h-40 animate-pulse" />
  </div>
  <div v-else-if="variant === 'kpi'" class="grid gap-4 grid-cols-2 xl:grid-cols-4">
    <div v-for="i in count" :key="i" class="card h-28 animate-pulse" />
  </div>
  <div v-else-if="variant === 'table'" class="card animate-pulse space-y-3">
    <div v-for="i in count" :key="i" class="h-8 rounded bg-gray-200" />
  </div>
  <div v-else class="card h-48 animate-pulse" />
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ variant: 'table' | 'cards' | 'kpi' | 'panel'; count?: number }>(),
  { count: 4 },
)
</script>
```

```vue
<!-- src/components/ui/AppEmptyState.vue -->
<template>
  <div class="flex flex-col items-center justify-center text-center py-10 px-4 gap-2">
    <i v-if="icon" :class="[icon, 'text-3xl text-gray-300']" />
    <p class="text-sm font-medium text-gray-700">{{ title }}</p>
    <p v-if="hint" class="text-xs text-gray-500">{{ hint }}</p>
    <div v-if="$slots.action" class="mt-2">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; hint?: string; icon?: string }>()
</script>
```

```vue
<!-- src/components/ui/AppErrorState.vue -->
<template>
  <div class="flex flex-col items-center justify-center text-center py-10 px-4 gap-2">
    <i class="pi pi-exclamation-circle text-3xl text-red-600" />
    <p class="text-sm font-medium text-gray-700">{{ message }}</p>
    <Button label="Retry" severity="secondary" size="small" class="mt-2" @click="$emit('retry')" />
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'

withDefaults(defineProps<{ message?: string }>(), {
  message: 'Something went wrong. Please try again.',
})

defineEmits<{ retry: [] }>()
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/__tests__/StateKit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/AppSkeleton.vue src/components/ui/AppEmptyState.vue src/components/ui/AppErrorState.vue src/components/ui/__tests__/StateKit.test.ts
git commit -m "feat(ui): AppSkeleton, AppEmptyState, AppErrorState"
```

---

### Task 6: AppSearchInput + AppDialog (TDD)

**Files:**
- Create: `src/components/ui/AppSearchInput.vue`, `src/components/ui/AppDialog.vue`
- Test: `src/components/ui/__tests__/Controls.test.ts`

**Interfaces:**
- Produces:
  - `<AppSearchInput v-model="q" placeholder="..." />` (`defineModel<string>()`)
  - `<AppDialog v-model:visible="open" size="sm|md|lg">` forwarding all Dialog attrs/slots; default size `md` (32rem); `sm` 24rem; `lg` 40rem

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSearchInput from '../AppSearchInput.vue'
import AppDialog from '../AppDialog.vue'

describe('AppSearchInput', () => {
  it('binds modelValue through InputText', async () => {
    const w = mount(AppSearchInput, { props: { modelValue: 'ramen' } })
    const input = w.find('input')
    expect((input.element as HTMLInputElement).value).toBe('ramen')
    await input.setValue('pho')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['pho'])
  })
})

describe('AppDialog', () => {
  it('applies the md width by default', () => {
    const w = mount(AppDialog, {
      props: { visible: true, modal: true },
      slots: { default: 'Body' },
      global: { stubs: { Dialog: { template: '<div class="stub-dialog"><slot /></div>' } } },
    })
    expect(w.html()).toContain('stub-dialog')
    expect(w.text()).toContain('Body')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/__tests__/Controls.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```vue
<!-- src/components/ui/AppSearchInput.vue -->
<template>
  <IconField class="w-full">
    <InputIcon class="pi pi-search" />
    <InputText :model-value="model" class="w-full" :placeholder="placeholder" @update:model-value="onInput" />
  </IconField>
</template>

<script setup lang="ts">
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'

const props = defineProps<{ placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const model = defineModel<string>({ default: '' })

function onInput(v: unknown) {
  const value = typeof v === 'string' ? v : String(v ?? '')
  model.value = value
  emit('update:modelValue', value)
}
</script>
```

```vue
<!-- src/components/ui/AppDialog.vue -->
<template>
  <Dialog
    :style="{ width: WIDTH[size] }"
    :pt="{ root: { class: 'rounded-xl' }, header: { class: 'px-6 py-5 border-b border-gray-200' }, content: { class: 'p-6' }, footer: { class: 'px-6 py-4 border-t border-gray-200 flex justify-end gap-2' } }"
    v-bind="$attrs"
  >
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData ?? {}" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'

withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })

const WIDTH = { sm: '24rem', md: '32rem', lg: '40rem' } as const
</script>
```

(If the `$attrs` pass-through test reveals a double-`visible` warning, bind `visible` explicitly via `defineModel<boolean>('visible')` and stop forwarding it in `$attrs`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/__tests__/Controls.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/AppSearchInput.vue src/components/ui/AppDialog.vue src/components/ui/__tests__/Controls.test.ts
git commit -m "feat(ui): AppSearchInput and sized AppDialog"
```

---

### Task 7: Shell: NavList, drawer/header, layout hosts

**Files:**
- Create: `src/components/ui/NavList.vue`
- Modify: `src/constants/nav.ts`, `src/components/layout/AppDrawer.vue`, `src/components/layout/AppHeader.vue`, `src/components/layout/AppLayout.vue`, `src/components/layout/PublicLayout.vue`

**Interfaces:**
- Consumes: `NAV_ITEMS` shape change to `icon: string` icon names.
- Produces: `<NavList @navigate="$emit('navigate')" />` emits `navigate`; AppLayout mounts `ConfirmDialog`; PublicLayout mounts `Toast`.

- [ ] **Step 1: Replace HTML icon strings with typed names**

```ts
// src/constants/nav.ts
export interface NavItem {
  path: string
  label: string
  icon: 'receipt' | 'box' | 'book' | 'chart-bar'
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/kds', label: 'KDS Dashboard', icon: 'receipt' },
  { path: '/inventory', label: 'Inventory', icon: 'box' },
  { path: '/menu', label: 'Menu & Recipes', icon: 'book' },
  { path: '/analytics', label: 'Analytics', icon: 'chart-bar' },
]

export const NAV_ICON_CLASS: Record<NavItem['icon'], string> = {
  receipt: 'pi pi-receipt',
  box: 'pi pi-box',
  book: 'pi pi-book',
  'chart-bar': 'pi pi-chart-bar',
}
```

- [ ] **Step 2: Implement NavList**

```vue
<!-- src/components/ui/NavList.vue -->
<template>
  <nav class="py-4 px-3 space-y-1">
    <router-link
      v-for="item in NAV_ITEMS"
      :key="item.path"
      :to="item.path"
      class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative"
      :class="isActive(item.path) ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-100'"
      @click="$emit('navigate')"
    >
      <span
        v-if="isActive(item.path)"
        class="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-orange-600"
      />
      <i :class="[NAV_ICON_CLASS[item.icon], 'text-lg']" />
      {{ item.label }}
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { NAV_ITEMS, NAV_ICON_CLASS } from '@/constants/nav'

defineEmits<{ navigate: [] }>()

const route = useRoute()

function isActive(path: string): boolean {
  return route.path.startsWith(path)
}
</script>
```

- [ ] **Step 3: Rewire AppDrawer and AppHeader**

`AppDrawer.vue` template becomes:

```vue
<template>
  <aside class="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0 hidden lg:flex">
    <div class="h-14 flex items-center gap-3 px-6 border-b border-gray-200">
      <i class="pi pi-cart-plus text-2xl text-orange-600"></i>
      <span class="font-display font-bold text-lg text-gray-900 tracking-tight">Cloud Kitchen</span>
    </div>
    <NavList />
  </aside>
</template>

<script setup lang="ts">
import NavList from '@/components/ui/NavList.vue'
</script>
```

`AppHeader.vue` template becomes (56px header, `btn-ghost` replaced with a PrimeVue text button):

```vue
<template>
  <header class="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 lg:hidden">
    <Button icon="pi pi-bars" text rounded @click="mobileOpen = !mobileOpen" />
    <i class="pi pi-cart-plus text-lg text-orange-600"></i>
    <span class="font-bold text-lg">Cloud Kitchen</span>
  </header>

  <div v-if="mobileOpen" class="fixed inset-0 z-50 lg:hidden" @click="mobileOpen = false">
    <div class="absolute inset-0 bg-black/50" />
    <aside class="absolute left-0 top-0 bottom-0 w-60 bg-white shadow-lg" @click.stop>
      <div class="h-14 flex items-center justify-between px-6 border-b border-gray-200">
        <span class="font-bold text-lg">Menu</span>
        <Button icon="pi pi-times" text rounded @click="mobileOpen = false" />
      </div>
      <NavList @navigate="mobileOpen = false" />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import NavList from '@/components/ui/NavList.vue'

const mobileOpen = ref(false)
</script>
```

- [ ] **Step 4: Layout hosts**

`AppLayout.vue`: add `import ConfirmDialog from 'primevue/confirmdialog'` and render `<ConfirmDialog />` next to `<Toast />`.

`PublicLayout.vue`: add `<Toast />` after the root div and `import Toast from 'primevue/toast'`; bump the public header to `h-14` (already) and keep nav links unchanged.

- [ ] **Step 5: Verify (no dedicated test; kit covered elsewhere)**

Run: `npm run build && npm test && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/NavList.vue src/constants/nav.ts src/components/layout/AppDrawer.vue src/components/layout/AppHeader.vue src/components/layout/AppLayout.vue src/components/layout/PublicLayout.vue
git commit -m "feat(shell): shared NavList, icon map, 56px headers, global toast/confirm"
```

---

### Task 8: OrderCard as canonical ticket

**Files:**
- Modify: `src/modules/kds/components/OrderCard.vue`

**Interfaces:**
- Consumes: `ORDER_STATUS_CTA`, `ORDER_STATUS_SPINE_CLASS`, `TIMER_TIER_CLASS`, `timerTier`, `ORDER_STATUS_SEVERITY`, `formatCurrency`, `statusLabel`.
- Produces: same `view-detail` emit and `order` prop; no behavior change to `useOrderFlow` calls (labels still Start/Ready/Dispatch).

- [ ] **Step 1: Rewrite the template root and spine**

Replace the root div classes with:

```vue
<div
  class="group cursor-pointer bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-150 overflow-hidden relative min-h-[44px]"
  @click="$emit('view-detail', order.id)"
>
  <div class="h-1 w-full" :class="ORDER_STATUS_SPINE_CLASS[order.status] ?? 'bg-gray-400'" />
```

- [ ] **Step 2: Fix arbitrary text sizes and mono data**

- Order number: keep `font-mono text-lg font-bold text-gray-900` and `font-variant-numeric: tabular-nums` (replace the inline `font-feature-settings` style with the class `tabular-nums`).
- Timer span: `class="font-mono text-xs font-medium shrink-0 tabular-nums"` `:class="TIMER_TIER_CLASS[timerTier(elapsedMinutes)]"`.
- Source chip: `text-[10px]` becomes `text-xs`.
- Customer sub-line: `text-[11px]` becomes `text-xs text-gray-500`.
- "+n more": `text-[11px]` becomes `text-xs`.

Add to script:

```ts
import { computed } from 'vue'
import { ORDER_STATUS_CTA, ORDER_STATUS_SPINE_CLASS, TIMER_TIER_CLASS, timerTier } from '@/constants/orderStatus'

const elapsedMinutes = computed(
  () => (Date.now() - new Date(props.order.timestamps.placedAt).getTime()) / 60_000,
)
```

(If `useTimer` already exposes seconds/minutes, use its value instead of computing inline.)

- [ ] **Step 3: Replace the CTA block**

```vue
<Button
  v-if="cta"
  :label="cta.label"
  :severity="cta.severity"
  size="large"
  :loading="loading"
  :disabled="loading"
  class="w-full justify-center font-semibold min-h-[44px]"
  @click.stop="handleAction"
/>
```

Script changes: delete `actionMap`/`action`/`actionLabel`; add:

```ts
const cta = computed(() => ORDER_STATUS_CTA[props.order.status] ?? null)
const action = computed(() => {
  switch (props.order.status) {
    case 'pending':
      return orderFlow.startPreparing
    case 'preparing':
      return orderFlow.markReady
    case 'ready':
      return orderFlow.markDispatched
    default:
      return null
  }
})

function handleAction() {
  action.value?.(props.order.id)
}
```

The status pill in the footer keeps `Tag` with `ORDER_STATUS_SEVERITY`. The final else-branch placeholder uses `ORDER_STATUS_TEXT_CLASS`/gray as today.

- [ ] **Step 4: Verify**

Run: `npm run build && npm test && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/kds/components/OrderCard.vue
git commit -m "feat(kds): OrderCard becomes AA ticket with age escalation"
```

---

### Task 9: OrderDashboard page

**Files:**
- Modify: `src/modules/kds/views/OrderDashboard.vue`, `src/modules/kds/composables/useOrderDashboard.ts`

**Interfaces:**
- Consumes: `PageHeader`, `AppSkeleton`, `AppEmptyState`, `AppErrorState`, `AppDialog` (detail), `ORDER_STATUS_SPINE_CLASS`, `ORDER_STATUS_HEX` for column dots.

- [ ] **Step 1: Page header + gutters**

Remove the outer `p-6` on the page root (AppLayout already pads). Replace the custom header div with:

```vue
<PageHeader title="Kitchen display" subtitle="Live orders">
  <template #actions>
    <span
      class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
      :class="
        feed.connected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
      "
    >
      <span
        class="w-1.5 h-1.5 rounded-full"
        :class="feed.connected ? 'bg-green-600' : 'bg-red-600'"
      />
      {{ feed.connected ? 'Live' : 'Disconnected' }}
    </span>
    <Button icon="pi pi-refresh" severity="secondary" outlined :loading="isLoading" @click="refresh" />
  </template>
</PageHeader>
```

Add `import PageHeader from '@/components/ui/PageHeader.vue'`.

- [ ] **Step 2: Loading / error gates**

Wrap the board:

```vue
<AppSkeleton v-if="isLoading" variant="cards" :count="4" />
<AppErrorState v-else-if="isError" @retry="refetch" />
<div v-else class="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">...</div>
```

Import the kit components; call `refresh` (already returned by the composable) for retry.

- [ ] **Step 3: Column header dots via class map**

In `useOrderDashboard.ts`, replace each `color: ORDER_STATUS_HEX.<s>` with `spineClass: ORDER_STATUS_SPINE_CLASS.<s>` (import `ORDER_STATUS_SPINE_CLASS`; drop the hex import). In the view's column header, replace the inline-styled dot with:

```vue
<span class="w-2.5 h-2.5 rounded-full shrink-0" :class="column.spineClass" />
```

Column titles become lowercase per voice rule: change `title: 'Pending'` to `title: 'pending'` etc. in the composable? The spec voice rule says status nouns lowercase in columns; however the audit showed mixed case. Apply lowercase in the composable titles ('pending', 'preparing', 'ready', 'dispatched').

- [ ] **Step 4: Empty columns + detail dialog + Message**

Each column body: `<AppEmptyState v-if="!column.orders.length" title="No orders" compact />` (if `compact` is not a prop, just `title="No orders"`).

Detail dialog: switch to `AppDialog` with `size="lg"`; special-instructions callout: replace the custom orange box with:

```vue
<Message severity="warn" class="w-full">Special: {{ item.specialInstructions }}</Message>
```

(`import Message from 'primevue/message'`.)

- [ ] **Step 5: Delete dead OrderTimer**

```bash
rm src/modules/kds/components/OrderTimer.vue
```

Confirm nothing imports it (`rg OrderTimer src`).

- [ ] **Step 6: Verify**

Run: `npm run build && npm test && npm run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/modules/kds/views/OrderDashboard.vue src/modules/kds/composables/useOrderDashboard.ts
git rm src/modules/kds/components/OrderTimer.vue
git commit -m "feat(kds): dashboard uses kit, ticket columns, AA status dots"
```

---

### Task 10: Inventory list + StockAdjustment

**Files:**
- Modify: `src/modules/inventory/views/InventoryList.vue`, `src/modules/inventory/views/StockAdjustment.vue`, `src/modules/inventory/components/LowStockBanner.vue` (only if hex present)

**Interfaces:**
- Consumes: `PageHeader`, `AppSearchInput`, `AppErrorState`, `AppEmptyState`, `AppSkeleton`, `ORDER_STATUS_TINT_CLASS` where status tags appear.

- [ ] **Step 1: InventoryList header + states**

Replace the page title block with `<PageHeader title="Inventory" subtitle="Stock levels and low-stock alerts">` plus `actions` slot containing the existing two buttons (`severity="secondary" outlined` for Stock Adjustment, default primary for Add Ingredient; add `icon="pi pi-plus"` to the primary).

Insert loading/error gates around the table:

```vue
<AppSkeleton v-if="isLoading" variant="table" :count="6" />
<AppErrorState v-else-if="isError" @retry="refetch" />
<template v-else>
  <DataTable ...>
    ...existing columns...
    <template #empty>
      <AppEmptyState title="No ingredients found" hint="Try a different search or add an ingredient" icon="pi pi-box" />
    </template>
  </DataTable>
</template>
```

Use the composable's existing `isLoading`/`isError`/`refetch` from `useIngredients` (verify names in `src/modules/inventory/composables/useIngredients.ts`; if the composable lacks `refetch`, use `refresh` if present, else `useQueryClient.invalidateQueries` pattern already used in the view's mutations).

Replace the hand-rolled search IconField with `<AppSearchInput v-model="search" placeholder="Search ingredients" />` (keep the existing `search` ref name).

- [ ] **Step 2: Status/low-stock tags to tint recipe**

Any inventory status tag using `bg-*-100 text-*-700` inline becomes `ORDER_STATUS_TINT_CLASS`-style pairs: low = `bg-amber-50 text-amber-700`, ok = `bg-green-50 text-green-700`. `LowStockBanner` keeps `Message severity="warn"`; if it contains hex or `bg-orange-*` fills, switch the icon to `text-amber-700`.

- [ ] **Step 3: Remove local ConfirmDialog**

Delete `import ConfirmDialog` and `<ConfirmDialog />` from the view (host is now AppLayout).

- [ ] **Step 4: StockAdjustment fixes**

- Remove the double radius: root stays `class="card max-w-xl mx-auto"` (drop any `rounded-lg`).
- Labels: replace ad-hoc `mb-1`/`mb-2` label classes with the `.field` wrapper pattern already used (`<div class="field"><label class="text-sm font-medium text-gray-700">...</label><InputNumber ... /></div>`).
- Errors: `text-red-500` -> `text-red-600`.
- Info callout: custom orange box becomes `<Message severity="info" class="w-full">...</Message>`.

- [ ] **Step 5: Verify**

Run: `npm run build && npm test && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/inventory/views/InventoryList.vue src/modules/inventory/views/StockAdjustment.vue src/modules/inventory/components/LowStockBanner.vue
git commit -m "feat(inventory): kit adoption, error/empty states, AA tags"
```

---

### Task 11: MenuList + RecipeBuilder (composable fetch fix)

**Files:**
- Modify: `src/modules/menu/views/MenuList.vue`, `src/modules/menu/views/RecipeBuilder.vue`, `src/modules/menu/components/IngredientPicker.vue`, `src/modules/menu/composables/useMenu.ts`

**Interfaces:**
- Produces: `useMenu().loadRecipe(id: string): Promise<Recipe>` used by RecipeBuilder instead of `api.menu.recipes.get`.

- [ ] **Step 1: MenuList header, search, states**

- Replace title block with `<PageHeader title="Menu & Recipes" subtitle="Dishes and recipe configuration">`.
- Replace the `p-input-icon-left` search block with `<AppSearchInput v-model="search" placeholder="Search menu" />`.
- Add `AppSkeleton` (`variant="table"`), `AppErrorState` (@retry), and `#empty` `AppEmptyState` on the DataTable (same pattern as Task 10).
- Edit action: single icon Button recipe `<Button icon="pi pi-pencil" text rounded severity="secondary" aria-label="Edit" />`.
- Brand chips keep runtime per-brand colors unchanged.

- [ ] **Step 2: IngredientPicker PV3 class**

Replace the `p-input-icon-left` div with `AppSearchInput` bound to the picker's existing query ref.

- [ ] **Step 3: Move RecipeBuilder fetch into useMenu (TDD)**

Test first, appended to the composable's test file if one exists, else `src/modules/menu/composables/useMenu.test.ts`:

```ts
it('loadRecipe fetches through api.menu.recipes.get', async () => {
  vi.mock('@/api/client', () => ({
    api: { menu: { recipes: { get: vi.fn().mockResolvedValue({ id: 'r1', name: 'Ramen' }) } } },
  }))
  const { loadRecipe } = useMenu()
  const r = await loadRecipe('r1')
  expect(r.id).toBe('r1')
})
```

(Adjust the mock shape to match how sibling composable tests mock `@/api/client`, copying the pattern from `src/modules/inventory/composables/useIngredients.test.ts`.)

Implement in `useMenu.ts`:

```ts
async function loadRecipe(id: string) {
  return api.menu.recipes.get(id)
}
```

Export it; in `RecipeBuilder.vue` replace `api.menu.recipes.get(route.params.id)` with `loadRecipe(...)`; remove the direct `api` import from the view.

- [ ] **Step 4: RecipeBuilder surfaces**

- Accordion panels: ensure every panel root uses `class="card"` only (drop lone `rounded-lg`/shadow variants).
- Replace the page-level skeleton with `<AppSkeleton variant="cards" :count="3" />`.
- Keep save snackbar via existing `AppSnackbar`.

- [ ] **Step 5: Verify**

Run: `npm run build && npm test && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/menu/views/MenuList.vue src/modules/menu/views/RecipeBuilder.vue src/modules/menu/components/IngredientPicker.vue src/modules/menu/composables/useMenu.ts src/modules/menu/composables/useMenu.test.ts
git commit -m "feat(menu): kit adoption, PV4 search, recipe fetch via composable"
```

---

### Task 12: Analytics dashboard + KpiCard

**Files:**
- Modify: `src/modules/analytics/views/AnalyticsDashboard.vue`, `src/components/common/KpiCard.vue`, `src/modules/analytics/components/DailyRevenueGraph.vue`, `WastageLog.vue`, `TopSellingTable.vue`, `BrandPerformance.vue`
- Delete usage: Uno `btn-filter-*`, `page-header`, `page-subtitle`, `btn-primary`, `btn-secondary` (shortcuts deleted in Task 15)

**Interfaces:**
- Consumes: `PageHeader`, `AppSkeleton`, `AppEmptyState`, `AppErrorState`, PrimeVue `SelectButton`, `ORDER_STATUS_HEX.ready` for the chart.

- [ ] **Step 1: Header + SelectButton**

Replace the `page-header` h1 block with:

```vue
<PageHeader title="Analytics Dashboard" subtitle="Sales, trends, and wastage overview">
  <template #actions>
    <SelectButton
      v-model="activePeriod"
      :options="periodOptions"
      option-label="label"
      option-value="value"
      :allow-empty="false"
      size="small"
    />
  </template>
</PageHeader>
```

Script: `const periodOptions = [{ label: 'Daily', value: 'daily' }, { label: 'Weekly', value: 'weekly' }, { label: 'Monthly', value: 'monthly' }]` (keep the existing `activePeriod` ref). Delete the three toggle buttons using `btn-filter-active/inactive`. (`import SelectButton from 'primevue/selectbutton'`.)

- [ ] **Step 2: Loading/error + gutters**

Remove the inner `p-6` duplicate; wrap:

```vue
<AppSkeleton v-if="isLoading || kpisLoading" variant="kpi" :count="4" />
<AppErrorState v-else-if="isError" @retry="refresh" />
<template v-else> ...existing grid... </template>
```

Use the actual flags returned by `useAnalytics` (read the composable; it exposes loading/error names per the module pattern in useOrderDashboard).

- [ ] **Step 3: KpiCard cleanup**

Remove the `trend` prop, its arrow, and the `trendColor` computed from `KpiCard.vue`; icon `text-[22px] text-gray-400` becomes `text-gray-500` at default icon size; value span gains `tabular-nums` and `font-mono`. Keep props `label`, `value`, `icon`. Update `KpiCard.test.ts` to drop any trend assertions (read the test first and edit accordingly).

- [ ] **Step 4: DailyRevenueGraph tokens**

Replace every `#E85D3A` with `#ea580c` sourced from the token: `import { ORANGE } from '@/constants/palette'` and use `ORANGE[600]` for stroke/fill/gradient stops. Axis tick fontSize: `10` -> `12`, `9` -> `12`. Empty state: remove the external `AppEmptyState` below the chart; keep an in-frame centered empty message inside the chart container when `isEmpty`.

- [ ] **Step 5: WastageLog buttons + empty**

Replace `class="btn-primary"` buttons with `<Button severity="primary" />` and `class="btn-secondary"` with `<Button severity="secondary" outlined />`. Table `#empty` uses `AppEmptyState title="No wastage logged"`; delete the duplicate empty Message below the table.

- [ ] **Step 6: TopSellingTable + BrandPerformance**

- `#empty` -> `AppEmptyState title="No sales yet" hint="Sales appear here once orders complete"`.
- BrandPerformance: replace `bg-[#F3F4F6]`/`border-[#E5E7EB]`/`text-[#111827]`/`text-[#6B7280]`/`text-[#9CA3AF]` with `bg-gray-100`/`border-gray-200`/`text-gray-900`/`text-gray-500`/`text-gray-400`; keep per-brand progress fills.

- [ ] **Step 7: Verify**

Run: `npm run build && npm test && npm run lint`
Expected: PASS. Also confirm `rg "btn-filter|page-header|page-subtitle" src` returns nothing.

- [ ] **Step 8: Commit**

```bash
git add src/modules/analytics src/components/common/KpiCard.vue
git commit -m "feat(analytics): kit adoption, SelectButton filter, tokenized chart"
```

---

### Task 13: OrderTracking public page

**Files:**
- Modify: `src/modules/order-status/views/OrderTracking.vue`, `src/modules/order-status/components/OrderCardCompact.vue`

**Interfaces:**
- Consumes: `PageHeader align="center"`, `AppSkeleton panel`, `AppEmptyState`, `AppErrorState`, `ORDER_STATUS_SPINE_CLASS`, `ORDER_STATUS_TINT_CLASS`.

- [ ] **Step 1: Header + hero**

Replace the hand-rolled h1/p block with:

```vue
<PageHeader title="Track your order" subtitle="Enter your order number and phone" align="center" />
```

- [ ] **Step 2: States**

- Initial search: replace the skeleton grid with `<AppSkeleton variant="panel" />`.
- No result: `<AppEmptyState title="Order not found" hint="Check the number on your receipt and try again" icon="pi pi-search" />`.
- Error: `<AppErrorState message="Could not look up this order" @retry="onSearch" />` (reuse the existing submit handler name).
- Delete the local `.slide-fade` CSS block; keep `Transition name="fade"` and add to `src/styles/main.css`:

```css
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition: none;
  }
  .fade-enter-from,
  .fade-leave-to,
  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: none;
  }
}
```

- [ ] **Step 3: OrderCardCompact ticket anatomy**

- Root: `class="card relative overflow-hidden pl-6"` plus a spine div `<div class="absolute left-0 top-0 bottom-0 w-1.5" :class="ORDER_STATUS_SPINE_CLASS[order.status]" />`.
- Order number: `font-mono text-base font-semibold text-gray-900 tabular-nums`.
- Status pill: `ORDER_STATUS_TINT_CLASS[order.status]` (replace the `bg-*-100` map import).
- Arrival/timer values: `font-mono tabular-nums`.

- [ ] **Step 4: Verify**

Run: `npm run build && npm test && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/order-status src/styles/main.css
git commit -m "feat(track): public page on kit, shared ticket anatomy, a11y motion"
```

---

### Task 14: CustomerPortal

**Files:**
- Modify: `src/modules/order-status/views/CustomerPortal.vue`

**Interfaces:**
- Consumes: kit components from Tasks 4-6; `AppSnackbar` host already global via PublicLayout Toast (verify the page still works with snackbar; AppSnackbar uses ToastService - keep as-is).

- [ ] **Step 1: Header**

Replace the title block with `<PageHeader title="My orders" subtitle="Sign in with your phone to see order history" />`.

- [ ] **Step 2: Skeleton/error/empty**

Replace the hand-rolled pulse blocks with `<AppSkeleton variant="cards" :count="2" />`; replace the custom error div with `<AppErrorState message="Could not load your orders" @retry="refetchOrReload" />` using whatever refresh path the page already has (read the view; if it only has a watch-triggered load, emit retry that re-invokes the load function). Empty list: `<AppEmptyState title="No orders yet" hint="Orders placed with your phone number appear here" icon="pi pi-receipt" />`.

- [ ] **Step 3: Login form**

- Labels above inputs via `.field` (`<label class="text-sm font-medium text-gray-700">Phone number</label>`); remove placeholder-as-label pattern.
- Error text under the field: `text-xs text-red-600` (only when invalid).
- Submit Button: add `:loading="isSubmitting"` if a submitting flag exists; otherwise leave size default.

- [ ] **Step 4: Order rows as compact tickets**

List item roots use the same `card relative overflow-hidden pl-6` + spine pattern as `OrderCardCompact` (inline in the view or extract if the template is duplicated more than twice - prefer a local copy over premature extraction).

- [ ] **Step 5: Verify**

Run: `npm run build && npm test && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/order-status/views/CustomerPortal.vue
git commit -m "feat(portal): kit adoption, labeled form, compact tickets"
```

---

### Task 15: Dead code + shortcut removal + hex audit prep

**Files:**
- Modify: `uno.config.ts`, `src/modules/analytics/components/WastageLog.vue` (if any leftover), any file flagged by the greps below
- Test: `src/utils/formatters.test.ts` (already cleaned in Task 3)

**Interfaces:**
- Produces: zero matches for the greps in Step 3; Uno shortcuts reduced to `card`, `chip`, `field`, skeleton helpers.

- [ ] **Step 1: Confirm zero usages before deleting**

Run:

```bash
rg -n "btn-primary|btn-secondary|btn-ghost|btn-danger|btn-filter|page-header|page-subtitle|class=\"badge|class=\"input\b|skeleton-card|skeleton-heading" src
```

Expected: no matches (Tasks 7-12 replaced them). If matches remain, fix them with the PrimeVue severity / PageHeader / AppSkeleton replacements used in earlier tasks before continuing.

- [ ] **Step 2: Slim uno.config.ts shortcuts**

Replace the `shortcuts` block with:

```ts
shortcuts: {
  card: 'bg-white rounded-xl shadow-sm border border-gray-200 p-5',
  chip: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
  field: 'flex flex-col gap-1.5',
  skeleton: 'animate-pulse bg-gray-200 rounded-xl',
},
```

(`p-5` implements the documented card padding; `.field` gap now lives only here.)

- [ ] **Step 3: Remaining dead exports check**

```bash
rg -n "statusColor|ORDER_STATUS_BADGE_CLASS|OrderTimer" src
```

Expected: no matches.

- [ ] **Step 4: Verify**

Run: `npm run build && npm test && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add uno.config.ts
git commit -m "chore(design): delete legacy Uno shortcuts and dead exports"
```

---

### Task 16: ONBOARDING docs, final audit, full verification

**Files:**
- Modify: `docs/ONBOARDING.md`

**Interfaces:**
- Consumes: all tasks. Produces: docs matching shipped reality.

- [ ] **Step 1: Rewrite the design-system section of ONBOARDING.md**

Replace the "Design system" section with (verbatim):

```markdown
## Design system (2026-10-09)

Tokens live in two files only:

- `src/constants/palette.ts` - the orange ramp (single source for Uno `primary-*` and PrimeVue)
- `src/constants/orderStatus.ts` - status labels, severities, tint/spine/text/CTA classes, timer tiers, chart hexes

Rules:

- Action fills: `orange-700` (white text). Graphics/accents: `orange-600`. Never `orange-500` for small graphics on white.
- Status text uses the -700 step (blue uses -600). Status graphics use the -600 step.
- Type: DM Sans for UI, JetBrains Mono + `tabular-nums` for data. No Inter. No `text-[9px]/[10px]/[11px]`.
- Radius: controls `rounded-lg`, cards/dialogs `rounded-xl`, pills full. `html` font-size is 14px.
- Elevation: cards = gray-200 border + shadow-sm; overlays shadow-lg.
- Page chrome: every page uses `src/components/ui/PageHeader.vue`.
- Data surfaces render exactly one of loading (`AppSkeleton`), error (`AppErrorState`), empty (`AppEmptyState`), content.
- Buttons are always PrimeVue `Button` with severity props. Do not reintroduce Uno `btn-*` classes.
- KDS CTAs are at least 44px tall. Respect `prefers-reduced-motion`.
```

Also fix the stale brand hex list (`#E65100`, `#D32F2F`, `#2E7D32`) anywhere it appears in that file: replace with `#c2410c` (action), `#ea580c` (graphic), and note status colors come from `orderStatus.ts`.

- [ ] **Step 2: Mechanical audit**

Run:

```bash
rg -n "#[0-9a-fA-F]{3,8}" src --glob '!**/palette.ts' --glob '!**/orderStatus.ts'
```

Allowed remaining hex: none in `src` except the two token files (chart components must import from them; DataTable/scrollbar hexes in `main.css` were normalized in Step? If `main.css` still contains `#f9fafb`/`#6b7280`/`#d1d5db`/`#9ca3af`, replace them with the same values expressed via comments-free ramp-safe alternatives: keep them ONLY if they match the gray ramp exactly and add a header comment `/* gray ramp values, keep in sync with palette neutrals */`. Prefer zero: switch datatable header bg to `#f9fafb` is the ramp; the audit in the design doc scoped hex bans to "outside plugins/primevue.ts and constants/orderStatus.ts" - to satisfy it, move the datatable header rule into KitchenPreset components tokens (`datatable: { colorScheme: { light: { column: { background: '{surface.50}', color: '{surface.500}' } } } }`) and delete those hex rules from main.css; scrollbar rules may keep ramp hexes with the sync comment.)

```bash
rg -n "text-\[9px\]|text-\[10px\]|text-\[11px\]|p-input-icon-left|v-html" src
rg -n "Inter" index.html src
```

Expected: no matches.

- [ ] **Step 3: Full verification**

Run: `npm run build && npm test && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/ONBOARDING.md src/styles/main.css plugins/primevue.ts
git commit -m "docs(design): ONBOARDING design system section + final audit fixes"
```

---

## Self-Review Notes

- Spec coverage: palette/tokens (Tasks 1-3), fonts (2), status maps + timer (3), PageHeader (4), state kit (5), search/dialog (6), shell + nav v-html + toast/confirm (7), ticket + KDS (8-9), inventory (10), menu + composable fetch (11), analytics + KpiCard trend + chart hex (12), tracking + compact ticket + motion merge (13), portal (14), dead code + shortcuts + ORDER_TIMER/`statusColor` (15), ONBOARDING + greps + full verify (16).
- Placeholder scan: no TBD/TODO; every code step shows content or an exact grep-driven fix pattern.
- Type consistency: `ORDER_STATUS_HEX` used consistently after the Task 3 rename; kit props (`variant`, `title`, `hint`, `message`, `size`) match tests; CTA labels Start/Ready/Dispatch preserved per stability rule.
