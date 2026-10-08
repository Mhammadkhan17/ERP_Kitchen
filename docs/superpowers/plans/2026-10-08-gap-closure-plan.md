# Gap Closure Implementation Plan (Phases 0–3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every gap from the codebase exploration report — logic bugs, type/seed drift, dead code, tooling vacuum, stale docs — on the current mock backend.

**Architecture:** Sequential phases (0 hygiene → 1 bug fixes → 2 quality gates → 3 docs), each phase one commit series, gated by `npm run build` then (from Phase 2) `npm test` + `npm run lint`. Stock adjustment stays non-atomic (mock backend limitation, documented). Analytics period toggle becomes real via a pure client-side aggregation util.

**Tech Stack:** Vue 3.5 `<script setup lang="ts">`, TypeScript 5.6 strict, Vite 6, @tanstack/vue-query 5, PrimeVue 4, UnoCSS, Vitest 2, json-server + Socket.IO (unchanged mock backend).

**Design spec:** `docs/superpowers/specs/2026-10-08-gap-closure-design.md` (authoritative for decisions).

## Global Constraints

- Never import Axios in components — only `src/api/client.ts`.
- Never fetch in components — use module composables (`modules/<name>/composables/`).
- All mutations follow existing pattern: `mutationFn` → `invalidateQueries` → `useSnackbar` success/error.
- Styling: UnoCSS utilities/shortcuts only; no new CSS frameworks.
- Components: `<script setup lang="ts">`, Composition API, PrimeVue 4 for UI widgets.
- Path alias `@` → `./src`.
- No semicolons; single quotes; printWidth 100 (match existing style; Prettier will enforce from Phase 2).
- Type-check gate after every task: `npm run build` must pass (vue-tsc is part of build).
- Do NOT run `npm run build`'s vite output as a commit — `dist/` is untracked after Task 1; never `git add dist/`.
- Backend (json-server) accepts arbitrary fields; no server changes anywhere in this plan.

---

# Phase 0 — Hygiene

### Task 1: Untrack `dist/` and update `.gitignore`

**Files:**
- Modify: `.gitignore`
- Repo state: untrack all files under `dist/`

**Interfaces:**
- Consumes: nothing
- Produces: clean working tree regarding build output (all later commits exclude `dist/`)

- [ ] **Step 1: Add `dist/` to `.gitignore`**

Append a line so `.gitignore` ends with:

```
vite.log
server.log
dist/
```

- [ ] **Step 2: Untrack dist from the index (keep local files)**

Run: `git rm -r --cached dist`

- [ ] **Step 3: Verify dist no longer appears in git status**

Run: `git status --short | grep dist || echo "CLEAN"`
Expected: prints `CLEAN`

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: untrack dist/ build output"
```

Note: staged deletions of dist files are included in this commit via `git rm --cached` — commit whatever is staged under `dist/` plus `.gitignore` together.

---

### Task 2: Fix `phone` types to `string`

**Files:**
- Modify: `src/types/index.ts:62` (`Order.phone`) and `src/types/index.ts:96` (`Customer.phone`)

**Interfaces:**
- Consumes: seed data uses string phones (`"03001234567"`) and `null`/absent on some orders
- Produces: `Order.phone?: string`, `Customer.phone: string`

- [ ] **Step 1: Change types**

In `src/types/index.ts`, change:

```ts
  phone?: string
```

on `Order` (line 62), and:

```ts
  phone: string
```

on `Customer` (line 96).

- [ ] **Step 2: Grep for arithmetic/comparison on phone**

Run: `grep -rn "\.phone" src/ --include="*.ts" --include="*.vue"`
Expected usages: string concatenation / display only (OrderDashboard, OrderCardCompact, portal search). If any arithmetic is found, wrap with `String(...)` at that call site.

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: exit 0 (vue-tsc passes; vite build also runs — output goes to untracked `dist/`)

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "fix: type Order.phone and Customer.phone as string"
```

---

### Task 3: Backfill seed data (`db.json`)

**Files:**
- Modify: `db.json` (25 ingredients, 12 menuItems, 12 recipes)

**Interfaces:**
- Consumes: existing required types in `src/types/index.ts` (`isLowStock`, `popularity`, `version`)
- Produces: every ingredient has `isLowStock`, every menuItem has `popularity`, every recipe has `version`

Note: `wastage_logs` already carry `cost` + `ingredientName` — do not touch them.

- [ ] **Step 1: Run a one-shot backfill script**

Run:

```bash
python3 - <<'EOF'
import json

with open('db.json') as f:
    db = json.load(f)

for ing in db['ingredients']:
    ing.setdefault('isLowStock', ing['currentStock'] <= ing['reorderLevel'])

popularity_cycle = [5, 4, 5, 3, 4, 5, 2, 4, 3, 5, 3, 4]
for i, item in enumerate(db['menuItems']):
    item.setdefault('popularity', popularity_cycle[i % len(popularity_cycle)])

for recipe in db['recipes']:
    recipe.setdefault('version', 1)

with open('db.json', 'w') as f:
    json.dump(db, f, indent=2)
    f.write('\n')

print('backfill ok:', len(db['ingredients']), len(db['menuItems']), len(db['recipes']))
EOF
```

Expected: prints `backfill ok: 25 12 12`

- [ ] **Step 2: Verify no missing fields remain**

Run:

```bash
python3 -c "
import json
db = json.load(open('db.json'))
assert all('isLowStock' in i for i in db['ingredients'])
assert all('popularity' in i for i in db['menuItems'])
assert all('version' in r for r in db['recipes'])
print('OK')
"
```

Expected: prints `OK`

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add db.json
git commit -m "fix: backfill isLowStock, popularity, version in seed data"
```

---

### Task 4: Remove dead dependencies and dead files

**Files:**
- Modify: `src/main.ts` (remove Pinia)
- Modify: `package.json` (remove deps)
- Delete: `src/modules/analytics/components/SalesChart.vue`
- Delete: `src/composables/useDebounce.ts`

**Interfaces:**
- Consumes: verified unused (no imports of pinia stores, chart.js, SalesChart, useDebounce anywhere in `src/`)
- Produces: leaner dependency tree; `main.ts` no longer registers Pinia

- [ ] **Step 1: Confirm zero usages**

Run: `grep -rn "pinia\|chart.js\|vue-chartjs\|SalesChart\|useDebounce" src/ --include="*.ts" --include="*.vue"`
Expected: only `src/main.ts:2` and `src/main.ts:17` mention pinia; no other hits.

- [ ] **Step 2: Edit `src/main.ts`**

Remove line 2 (`import { createPinia } from 'pinia'`) and line 17 (`app.use(createPinia())`).

Resulting imports block:

```ts
import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
```

- [ ] **Step 3: Delete dead files**

Run: `git rm src/modules/analytics/components/SalesChart.vue src/composables/useDebounce.ts`

- [ ] **Step 4: Uninstall packages**

Run: `npm uninstall pinia chart.js vue-chartjs`

- [ ] **Step 5: Type-check + boot check**

Run: `npm run build`
Expected: exit 0

- [ ] **Step 6: Commit**

```bash
git add src/main.ts package.json package-lock.json
git commit -m "chore: remove unused pinia, chart.js, vue-chartjs and dead files"
```

---

# Phase 1 — Logic fixes

### Task 5: Persist stock-adjustment reason (TDD)

**Files:**
- Create: `src/api/client.test.ts`
- Modify: `src/api/client.ts:30-36` (`adjustStock`)
- Modify: `src/types/index.ts` (Ingredient — add optional audit fields)

**Interfaces:**
- Consumes: `api.ingredients.adjustStock(id, delta, reason)` signature unchanged (already in `src/types/api.ts:15`)
- Produces: `Ingredient.lastAdjustReason?: string`, `Ingredient.lastAdjustedAt?: string`; PATCH body includes both

- [ ] **Step 1: Write the failing test**

Create `src/api/client.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockHttp = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: { response: { use: vi.fn() } },
}

vi.mock('axios', () => ({
  default: { create: () => mockHttp },
}))

import { api } from '@/api/client'

describe('api.ingredients.adjustStock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persists reason and timestamp on PATCH', async () => {
    mockHttp.get.mockResolvedValue({ data: { id: 'ing-001', currentStock: 10 } })
    mockHttp.patch.mockResolvedValue({ data: { id: 'ing-001', currentStock: 8 } })

    await api.ingredients.adjustStock('ing-001', -2, 'spilled')

    expect(mockHttp.patch).toHaveBeenCalledWith('/ingredients/ing-001', {
      currentStock: 8,
      lastAdjustReason: 'spilled',
      lastAdjustedAt: expect.any(String),
    })
  })

  it('clamps stock at zero and still records reason', async () => {
    mockHttp.get.mockResolvedValue({ data: { id: 'ing-002', currentStock: 1 } })
    mockHttp.patch.mockResolvedValue({ data: { id: 'ing-002', currentStock: 0 } })

    await api.ingredients.adjustStock('ing-002', -5, 'used for service')

    expect(mockHttp.patch).toHaveBeenCalledWith('/ingredients/ing-002', {
      currentStock: 0,
      lastAdjustReason: 'used for service',
      lastAdjustedAt: expect.any(String),
    })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — PATCH called without `lastAdjustReason` (assertion mismatch on the body)

- [ ] **Step 3: Implement minimal change**

In `src/types/index.ts`, add to `Ingredient` (after `updatedAt`):

```ts
  lastAdjustReason?: string
  lastAdjustedAt?: string
```

In `src/api/client.ts`, replace `adjustStock` with:

```ts
    adjustStock: (id, delta, reason) =>
      http.get(`/ingredients/${id}`).then((r) => {
        const ing = r.data as Ingredient
        return http.patch(`/ingredients/${id}`, {
          currentStock: Math.max(0, +(ing.currentStock + delta).toFixed(3)),
          lastAdjustReason: reason,
          lastAdjustedAt: new Date().toISOString(),
        }).then((r2) => r2.data)
      }),
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS (2 tests)

- [ ] **Step 5: Type-check**

Run: `npm run build`
Expected: exit 0

- [ ] **Step 6: Commit**

```bash
git add src/api/client.ts src/api/client.test.ts src/types/index.ts
git commit -m "fix: persist stock adjustment reason and timestamp"
```

---

### Task 6: Make inventory filters reactive

**Files:**
- Modify: `src/modules/inventory/composables/useInventory.ts:6-11`
- Modify: `src/modules/inventory/views/InventoryList.vue:158-161`

**Interfaces:**
- Consumes: `api.ingredients.list(params?: { search?: string; unit?: string })` unchanged
- Produces: `useIngredients(filters?: MaybeRefOrGetter<{ search?: string; unit?: string } | undefined>)` — accepts plain objects (no-arg callers unaffected: AnalyticsDashboard, RecipeBuilder, LowStockBanner) AND refs/computeds

- [ ] **Step 1: Update the composable**

Replace `useIngredients` in `src/modules/inventory/composables/useInventory.ts` with:

```ts
import { toValue, type MaybeRefOrGetter } from 'vue'

export function useIngredients(
  filters?: MaybeRefOrGetter<{ search?: string; unit?: string } | undefined>,
) {
  return useQuery({
    queryKey: ['ingredients', filters],
    queryFn: () => api.ingredients.list(toValue(filters)),
  })
}
```

(Keep the rest of the file unchanged. `queryKey` containing a ref/computed is deep-unwrapped by vue-query v5, so the key re-computes when the ref changes.)

- [ ] **Step 2: Update the call site**

In `InventoryList.vue`, replace lines 158–161:

```ts
const { data: ingredients, isLoading } = useIngredients(filters)
```

(`filters` is already a `computed` at line 153 — pass it directly.)

- [ ] **Step 3: Verify no other call sites break**

Run: `grep -rn "useIngredients(" src/ --include="*.vue" --include="*.ts"`
Expected: other call sites use `useIngredients()` with no args or static objects — all remain type-compatible.

- [ ] **Step 4: Type-check**

Run: `npm run build`
Expected: exit 0

- [ ] **Step 5: Manual verification**

Run `npm start`, open `http://localhost:5173/inventory`, type in the search box and switch the unit filter — the table must refetch (watch the Vite proxy log / Network tab for `/api/ingredients?...`).

- [ ] **Step 6: Commit**

```bash
git add src/modules/inventory/composables/useInventory.ts src/modules/inventory/views/InventoryList.vue
git commit -m "fix: make inventory filters reactive in useIngredients"
```

---

### Task 7: Show menu item names in TopSellingTable

**Files:**
- Modify: `src/modules/analytics/components/TopSellingTable.vue`

**Interfaces:**
- Consumes: `useMenuItems()` from `@/modules/menu/composables/useMenu` (returns `{ data: Ref<MenuItem[]> }`)
- Produces: same props (`salesData: DailySales[]`) — display-only change

- [ ] **Step 1: Add menu item name resolution**

In `TopSellingTable.vue` script, extend imports and add a name map:

```ts
import { useMenuItems } from '@/modules/menu/composables/useMenu'

const { data: menuItems } = useMenuItems()

const nameMap = computed(() => {
  const map = new Map<string, string>()
  for (const item of menuItems.value ?? []) {
    map.set(item.id, item.name)
  }
  return map
})

function itemName(id: string): string {
  return nameMap.value.get(id) ?? id
}
```

- [ ] **Step 2: Replace the raw ID column body**

Replace:

```html
      <Column field="menuItemId" header="Item" class="truncate max-w-28" />
```

with:

```html
      <Column field="menuItemId" header="Item" class="truncate max-w-28">
        <template #body="{ data }">
          {{ itemName(data.menuItemId) }}
        </template>
      </Column>
```

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: exit 0

- [ ] **Step 4: Manual verification**

`npm start` → `/analytics` → Top Selling Items shows dish names (e.g., "Butter Chicken Bowl"), not `item-004`.

- [ ] **Step 5: Commit**

```bash
git add src/modules/analytics/components/TopSellingTable.vue
git commit -m "fix: display menu item names in top selling table"
```

---

### Task 8: `aggregateSales` util (TDD)

**Files:**
- Create: `src/utils/aggregateSales.ts`
- Test: `src/utils/aggregateSales.test.ts`

**Interfaces:**
- Consumes: `DailySales` from `@/types`
- Produces:
  - `type SalesPeriod = 'daily' | 'weekly' | 'monthly'`
  - `interface AggregatedPeriod { label: string; revenue: number; orderCount: number; itemsSold: Array<{ menuItemId: string; units: number }> }`
  - `aggregateSales(sales: DailySales[], period: SalesPeriod): AggregatedPeriod[]`

- [ ] **Step 1: Write the failing test**

Create `src/utils/aggregateSales.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { aggregateSales } from './aggregateSales'
import type { DailySales } from '@/types'

function day(date: string, revenue: number, orderCount: number, items: Array<[string, number]>): DailySales {
  return {
    id: `sales-${date}`,
    date,
    totalRevenue: revenue,
    orderCount,
    itemsSold: items.map(([menuItemId, units]) => ({ menuItemId, units })),
  }
}

const sample: DailySales[] = [
  day('2026-03-02', 100, 2, [['item-001', 3]]), // Monday week 10
  day('2026-03-04', 50, 1, [['item-001', 1], ['item-002', 2]]),
  day('2026-03-09', 80, 2, [['item-002', 4]]), // next week
  day('2026-04-01', 200, 5, [['item-003', 9]]), // April
]

describe('aggregateSales', () => {
  it('returns empty array for empty input in any period', () => {
    expect(aggregateSales([], 'daily')).toEqual([])
    expect(aggregateSales([], 'weekly')).toEqual([])
    expect(aggregateSales([], 'monthly')).toEqual([])
  })

  it('daily preserves rows sorted by date with labels equal to dates', () => {
    const result = aggregateSales(sample, 'daily')
    expect(result.map((r) => r.label)).toEqual([
      '2026-03-02', '2026-03-04', '2026-03-09', '2026-04-01',
    ])
    expect(result[0].revenue).toBe(100)
  })

  it('weekly buckets by ISO week and sums revenue, orders, and item units', () => {
    const result = aggregateSales(sample, 'weekly')
    const labels = result.map((r) => r.label)
    expect(labels).toContain('2026-W10')
    expect(labels).toContain('2026-W11')
    expect(labels).toContain('2026-W14')

    const w10 = result.find((r) => r.label === '2026-W10')!
    expect(w10.revenue).toBe(150)
    expect(w10.orderCount).toBe(3)
    expect(w10.itemsSold).toEqual([
      { menuItemId: 'item-001', units: 4 },
      { menuItemId: 'item-002', units: 2 },
    ])
  })

  it('monthly buckets by YYYY-MM', () => {
    const result = aggregateSales(sample, 'monthly')
    expect(result.map((r) => r.label)).toEqual(['2026-03', '2026-04'])
    const march = result.find((r) => r.label === '2026-03')!
    expect(march.revenue).toBe(230)
    expect(march.orderCount).toBe(5)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — module `./aggregateSales` does not exist

- [ ] **Step 3: Implement the util**

Create `src/utils/aggregateSales.ts`:

```ts
import type { DailySales } from '@/types'

export type SalesPeriod = 'daily' | 'weekly' | 'monthly'

export interface AggregatedPeriod {
  label: string
  revenue: number
  orderCount: number
  itemsSold: Array<{ menuItemId: string; units: number }>
}

function weekLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function monthLabel(isoDate: string): string {
  return isoDate.slice(0, 7)
}

export function aggregateSales(sales: DailySales[], period: SalesPeriod): AggregatedPeriod[] {
  const sorted = [...sales].sort((a, b) => a.date.localeCompare(b.date))

  if (period === 'daily') {
    return sorted.map((d) => ({
      label: d.date,
      revenue: d.totalRevenue,
      orderCount: d.orderCount,
      itemsSold: d.itemsSold.map((i) => ({ ...i })),
    }))
  }

  const buckets = new Map<string, AggregatedPeriod>()
  for (const day of sorted) {
    const key = period === 'weekly' ? weekLabel(day.date) : monthLabel(day.date)
    const bucket = buckets.get(key) ?? { label: key, revenue: 0, orderCount: 0, itemsSold: [] }
    bucket.revenue += day.totalRevenue
    bucket.orderCount += day.orderCount
    for (const item of day.itemsSold) {
      const existing = bucket.itemsSold.find((i) => i.menuItemId === item.menuItemId)
      if (existing) existing.units += item.units
      else bucket.itemsSold.push({ ...item })
    }
    buckets.set(key, bucket)
  }
  return Array.from(buckets.values())
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS (all suites, including Task 5's client tests)

- [ ] **Step 5: Type-check**

Run: `npm run build`
Expected: exit 0

- [ ] **Step 6: Commit**

```bash
git add src/utils/aggregateSales.ts src/utils/aggregateSales.test.ts
git commit -m "feat: add aggregateSales util for daily/weekly/monthly periods"
```

---

### Task 9: Wire the analytics period toggle

**Files:**
- Modify: `src/modules/analytics/composables/useAnalytics.ts` (add `useAggregatedSales`, rework `useKpiMetrics`)
- Modify: `src/modules/analytics/views/AnalyticsDashboard.vue`
- Modify: `src/modules/analytics/components/DailyRevenueGraph.vue` (props → points)
- Modify: `src/modules/analytics/components/TopSellingTable.vue` (accept `AggregatedPeriod[]`)
- Modify: `src/modules/analytics/components/BrandPerformance.vue` (accept `salesData` prop)

**Interfaces:**
- Consumes: `aggregateSales`, `SalesPeriod`, `AggregatedPeriod` from `@/utils/aggregateSales` (Task 8)
- Produces:
  - `useAggregatedSales(period: MaybeRefOrGetter<SalesPeriod>)` → `{ aggregated: ComputedRef<AggregatedPeriod[]> }`
  - `useKpiMetrics(rows: MaybeRefOrGetter<AggregatedPeriod[]>)` → `{ totalRevenue, totalOrders, averageOrderValue }` (computed refs)
  - `DailyRevenueGraph` props: `{ points: Array<{ label: string; revenue: number; orderCount: number }> }`
  - `TopSellingTable` props: `{ salesData: AggregatedPeriod[] }`
  - `BrandPerformance` props: `{ salesData: AggregatedPeriod[] }`

- [ ] **Step 1: Add `useAggregatedSales` and rework `useKpiMetrics`**

In `useAnalytics.ts`, replace `useKpiMetrics` and add:

```ts
import { toValue, type MaybeRefOrGetter } from 'vue'
import { aggregateSales, type AggregatedPeriod, type SalesPeriod } from '@/utils/aggregateSales'

export function useAggregatedSales(period: MaybeRefOrGetter<SalesPeriod>) {
  const { data: sales } = useDailySales()
  const aggregated = computed(() => aggregateSales(sales.value ?? [], toValue(period)))
  return { aggregated }
}

export function useKpiMetrics(rows: MaybeRefOrGetter<AggregatedPeriod[]>) {
  const data = computed(() => toValue(rows))

  const totalRevenue = computed(() =>
    data.value.reduce((sum, d) => sum + d.revenue, 0),
  )
  const totalOrders = computed(() =>
    data.value.reduce((sum, d) => sum + d.orderCount, 0),
  )
  const averageOrderValue = computed(() =>
    totalOrders.value > 0 ? totalRevenue.value / totalOrders.value : 0,
  )

  return { totalRevenue, totalOrders, averageOrderValue }
}
```

- [ ] **Step 2: Generalize `DailyRevenueGraph` props**

In `DailyRevenueGraph.vue` script:

Replace the props block and internal mappings so the component consumes points:

```ts
interface RevenuePoint {
  label: string
  revenue: number
  orderCount: number
}

const props = withDefaults(defineProps<{
  points: RevenuePoint[]
}>(), {
  points: () => [],
})
```

Then replace every `salesData` / `d.totalRevenue` / `d.date` usage:
- `maxRev`: `Math.max(...props.points.map(p => p.revenue), 1)`
- `step`: based on `props.points.length`
- `pts`: map `props.points` → `{ x, y: … p.revenue …, label: p.label, revenue: p.revenue, orderCount: p.orderCount }` (replace `date` field with `label`)
- tooltip type: `{ x, y, label, revenue, orderCount }`; template tooltip line 2 uses `tooltip.label` instead of `shortDate(tooltip.date)`
- x-axis text: `{{ p.label }}` instead of `shortDate(p.date)` (remove the `shortDate` function)
- empty state: `v-if="!points.length"`
- Header `<h3>`: change "Daily Revenue" to "Revenue Trend"

- [ ] **Step 3: Update `TopSellingTable` to take aggregated rows**

Change props to:

```ts
const props = defineProps<{
  salesData: AggregatedPeriod[]
}>()
```

(import `AggregatedPeriod` from `@/utils/aggregateSales`). Aggregation loop stays the same shape (`day.itemsSold` exists on `AggregatedPeriod`).

- [ ] **Step 4: Update `BrandPerformance` to take a prop**

Replace `const { data: salesData } = useDailySales()` with:

```ts
const props = defineProps<{
  salesData: AggregatedPeriod[]
}>()
```

In `brandPerformance` computed, iterate `props.salesData` instead of `salesData.value ?? []` (rename the local binding). Remove the now-unused `useDailySales` import.

- [ ] **Step 5: Wire everything in `AnalyticsDashboard.vue`**

Replace the script section with:

```ts
import { ref } from 'vue'
import { useWastageLogs, useAggregatedSales, useKpiMetrics } from '@/modules/analytics/composables/useAnalytics'
import { useIngredients } from '@/modules/inventory/composables/useInventory'
import { formatCurrency } from '@/utils/formatters'
import type { SalesPeriod } from '@/utils/aggregateSales'
import KpiCard from '@/modules/analytics/components/KpiCard.vue'
import BrandPerformance from '@/modules/analytics/components/BrandPerformance.vue'
import DailyRevenueGraph from '@/modules/analytics/components/DailyRevenueGraph.vue'
import TopSellingTable from '@/modules/analytics/components/TopSellingTable.vue'
import WastageLog from '@/modules/analytics/components/WastageLog.vue'
import { computed } from 'vue'

const activePeriod = ref<SalesPeriod>('daily')

const { aggregated } = useAggregatedSales(activePeriod)
const { data: wastageLogs } = useWastageLogs()
const { data: ingredients } = useIngredients()

const kpi = useKpiMetrics(aggregated)

const totalWastage = computed(() =>
  (wastageLogs.value ?? []).reduce((sum, w) => sum + w.quantity, 0),
)

const graphPoints = computed(() =>
  aggregated.value.map((row) => ({
    label: row.label,
    revenue: row.revenue,
    orderCount: row.orderCount,
  })),
)
```

Template changes:
- Skeleton condition `!salesData && !wastageLogs` → `!aggregated.length && !wastageLogs` is wrong during load; instead keep a `useDailySales`-driven load check: import `useDailySales` for the loading flag, or simpler — use `const { isPending } = useDailySales()` inside `useAggregatedSales` and return it. **Implementation detail:** have `useAggregatedSales` also return `isPending` from the underlying query and use that for skeleton branches (replace `!salesData` checks with `isPending`).
- `<DailyRevenueGraph v-else :sales-data="salesData" />` → `<DailyRevenueGraph v-else :points="graphPoints" />`
- `<TopSellingTable v-else :sales-data="salesData" />` → `<TopSellingTable v-else :sales-data="aggregated" />`
- `<BrandPerformance />` → `<BrandPerformance :sales-data="aggregated" />`
- The three period buttons already set `activePeriod` — now functional, no template change needed there.
- Chart card title remains in the graph component.

- [ ] **Step 6: Type-check**

Run: `npm run build`
Expected: exit 0 (fix any leftover `salesData` references)

- [ ] **Step 7: Manual verification**

`npm start` → `/analytics` → click Daily/Weekly/Monthly: graph buckets, top-selling units, brand split, and KPI totals all change; wastage KPI stays constant (accepted limitation).

- [ ] **Step 8: Commit**

```bash
git add src/modules/analytics/
git commit -m "feat: wire analytics period toggle via client-side aggregation"
```

---

### Task 10: RecipeBuilder error surfacing and fresh state after save

**Files:**
- Modify: `src/modules/menu/views/RecipeBuilder.vue:150-190` (`loadRecipe`, `saveRecipe`)

**Interfaces:**
- Consumes: `useUpsertRecipe()` already invalidates `['recipes']` and toasts on success/error (useMenu.ts:63-74)
- Produces: local `recipeData` updated from the upsert response; load failures snackbar instead of silent empty state

- [ ] **Step 1: Surface load errors**

Add snackbar import:

```ts
import { useSnackbar } from '@/composables/useSnackbar'

const snackbar = useSnackbar()
```

In `loadRecipe`, replace the silent catch:

```ts
  } catch {
    snackbar.error('Failed to load recipe')
    recipeData[menuItemId] = {
      loaded: true,
      loading: false,
      servings: 1,
      ingredients: [],
    }
  }
```

- [ ] **Step 2: Update local state from the upsert response**

Replace `saveRecipe`:

```ts
function saveRecipe(menuItemId: string) {
  const data = recipeData[menuItemId]
  if (!data) return

  upsertMutation.mutate(
    {
      menuItemId,
      servings: data.servings,
      ingredients: data.ingredients,
    },
    {
      onSuccess: (recipe) => {
        recipeData[menuItemId] = {
          loaded: true,
          loading: false,
          servings: recipe?.servings ?? data.servings,
          ingredients: recipe?.ingredients?.map((i) => ({ ...i })) ?? data.ingredients.map((i) => ({ ...i })),
        }
      },
    },
  )
}
```

(The composable's own `onSuccess` already shows the snackbar and invalidates `['recipes']`.)

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: exit 0

- [ ] **Step 4: Manual verification**

`npm start` → `/menu/recipes` → open a panel, edit ingredients, Save → no error toast, panel shows saved state; stop the API server and Save → error toast appears.

- [ ] **Step 5: Commit**

```bash
git add src/modules/menu/views/RecipeBuilder.vue
git commit -m "fix: surface recipe load errors and refresh local state after save"
```

---

### Task 11: Extract shared nav and order-status constants

**Files:**
- Create: `src/constants/nav.ts`
- Create: `src/constants/orderStatus.ts`
- Modify: `src/components/layout/AppDrawer.vue`
- Modify: `src/components/layout/AppHeader.vue`
- Modify: `src/modules/kds/views/OrderDashboard.vue` (columns colors + `severityFor`)
- Modify: `src/modules/kds/components/OrderCard.vue:106-115` (`columnColor`)
- Modify: `src/modules/order-status/components/OrderCardCompact.vue:32-52`
- Modify: `src/utils/formatters.ts` (`statusLabel`, `statusColor` delegate to constants)

**Interfaces:**
- Consumes: `OrderStatus` from `@/types`
- Produces:
  - `NAV_ITEMS: Array<{ path: string; label: string; icon: string }>`
  - `ORDER_STATUS_COLORS: Record<OrderStatus, string>`
  - `ORDER_STATUS_LABELS: Record<OrderStatus, string>`
  - `ORDER_STATUS_SEVERITY: Record<OrderStatus, string>` (PrimeVue Tag severity values)
  - `ORDER_STATUS_BADGE_CLASS: Record<OrderStatus, string>` (Tailwind/Uno classes for OrderCardCompact)

- [ ] **Step 1: Create `src/constants/nav.ts`**

```ts
export interface NavItem {
  path: string
  label: string
  icon: string
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/kds', label: 'KDS Dashboard', icon: '<i class="pi pi-receipt"></i>' },
  { path: '/inventory', label: 'Inventory', icon: '<i class="pi pi-box"></i>' },
  { path: '/menu', label: 'Menu & Recipes', icon: '<i class="pi pi-book"></i>' },
  { path: '/analytics', label: 'Analytics', icon: '<i class="pi pi-chart-bar"></i>' },
]
```

- [ ] **Step 2: Create `src/constants/orderStatus.ts`**

```ts
import type { OrderStatus } from '@/types'

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#F4A261',
  preparing: '#4A90D9',
  ready: '#2B9348',
  dispatched: '#6C757D',
  cancelled: '#6C757D',
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

export const ORDER_STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-green-100 text-green-700',
  dispatched: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
}
```

- [ ] **Step 3: Point layout components at NAV_ITEMS**

In both `AppDrawer.vue` and `AppHeader.vue`, remove the local `navItems` arrays and add:

```ts
import { NAV_ITEMS } from '@/constants/nav'
```

In templates, change `v-for="item in navItems"` → `v-for="item in NAV_ITEMS"`.

- [ ] **Step 4: Update OrderDashboard**

Replace `severityFor` body:

```ts
import { ORDER_STATUS_COLORS, ORDER_STATUS_SEVERITY } from '@/constants/orderStatus'

function severityFor(status: OrderStatus): string {
  return ORDER_STATUS_SEVERITY[status] || 'info'
}
```

Replace the `columns` computed colors:

```ts
const columns = computed(() => {
  const all = filteredOrders.value
  return [
    { title: 'Pending', status: 'pending' as OrderStatus, orders: all.filter((o) => o.status === 'pending'), color: ORDER_STATUS_COLORS.pending },
    { title: 'Preparing', status: 'preparing' as OrderStatus, orders: all.filter((o) => o.status === 'preparing'), color: ORDER_STATUS_COLORS.preparing },
    { title: 'Ready', status: 'ready' as OrderStatus, orders: all.filter((o) => o.status === 'ready'), color: ORDER_STATUS_COLORS.ready },
    { title: 'Dispatched', status: 'dispatched' as OrderStatus, orders: all.filter((o) => o.status === 'dispatched' || o.status === 'cancelled'), color: ORDER_STATUS_COLORS.dispatched },
  ]
})
```

- [ ] **Step 5: Update OrderCard**

Replace `columnColor` computed:

```ts
import { ORDER_STATUS_COLORS } from '@/constants/orderStatus'

const columnColor = computed(() => ORDER_STATUS_COLORS[props.order.status] || ORDER_STATUS_COLORS.dispatched)
```

- [ ] **Step 6: Update OrderCardCompact**

Replace both maps:

```ts
import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE_CLASS } from '@/constants/orderStatus'

const statusLabel = computed(() => ORDER_STATUS_LABELS[props.order.status] ?? props.order.status)
const statusClass = computed(() => ORDER_STATUS_BADGE_CLASS[props.order.status] ?? 'bg-gray-100 text-gray-600')
```

- [ ] **Step 7: Delegate formatters to constants**

In `formatters.ts`:

```ts
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/constants/orderStatus'

export function statusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status
}

export function statusColor(status: string): string {
  return ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_LABELS] || 'gray'
}
```

- [ ] **Step 8: Sweep for remaining duplicate maps**

Run: `grep -rn "pending: '#F4A261'\|pending: 'Pending'\|pending: 'warn'" src/ --include="*.vue" --include="*.ts"`
Expected: only `src/constants/orderStatus.ts` matches (check `StatusTimeline.vue` and `KdsColumn.vue` callers; update any leftovers the same way).

- [ ] **Step 9: Type-check**

Run: `npm run build`
Expected: exit 0

- [ ] **Step 10: Commit**

```bash
git add src/constants/ src/components/layout/ src/modules/kds/ src/modules/order-status/ src/utils/formatters.ts
git commit -m "refactor: extract shared nav and order-status constants"
```

---

### Task 12: Extract `useOrderDashboard` composable

**Files:**
- Create: `src/modules/kds/composables/useOrderDashboard.ts`
- Modify: `src/modules/kds/views/OrderDashboard.vue` (script shrinks)

**Interfaces:**
- Consumes: `useOrderFeed`, `api.orders.list`, `ORDER_STATUS_COLORS` (Task 11)
- Produces: `useOrderDashboard()` returning `{ feed, isLoading, isError, search, columns, detail, detailVisible, specialItems, onViewDetail, refresh }`

- [ ] **Step 1: Create the composable**

Create `src/modules/kds/composables/useOrderDashboard.ts` by moving the view's logic verbatim (adapting only references):

```ts
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useOrderFeed } from './useOrderFeed'
import { ORDER_STATUS_COLORS } from '@/constants/orderStatus'
import type { Order, OrderStatus } from '@/types'

export function useOrderDashboard() {
  const feed = useOrderFeed()

  const {
    data: orders,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.orders.list() as Promise<Order[]>,
    refetchInterval: 30_000,
  })

  function refresh() {
    refetch()
  }

  const search = ref('')

  const filteredOrders = computed(() => {
    const all = orders.value ?? []
    if (!search.value.trim()) return all
    const q = search.value.trim().toLowerCase()
    return all.filter((o) => {
      const nameMatch = o.customerName.toLowerCase().includes(q)
      const numMatch = String(o.orderNumber).includes(q)
      const idMatch = o.customerId != null && String(o.customerId).includes(q)
      const phoneMatch = o.phone != null && String(o.phone).includes(q)
      const sourceMatch = o.source.toLowerCase().includes(q)
      const itemMatch = o.items.some((i) => i.name.toLowerCase().includes(q))
      return nameMatch || numMatch || idMatch || phoneMatch || sourceMatch || itemMatch
    })
  })

  const columns = computed(() => {
    const all = filteredOrders.value
    return [
      { title: 'Pending', status: 'pending' as OrderStatus, orders: all.filter((o) => o.status === 'pending'), color: ORDER_STATUS_COLORS.pending },
      { title: 'Preparing', status: 'preparing' as OrderStatus, orders: all.filter((o) => o.status === 'preparing'), color: ORDER_STATUS_COLORS.preparing },
      { title: 'Ready', status: 'ready' as OrderStatus, orders: all.filter((o) => o.status === 'ready'), color: ORDER_STATUS_COLORS.ready },
      { title: 'Dispatched', status: 'dispatched' as OrderStatus, orders: all.filter((o) => o.status === 'dispatched' || o.status === 'cancelled'), color: ORDER_STATUS_COLORS.dispatched },
    ]
  })

  const selectedOrderId = ref<string | null>(null)
  const detailVisible = ref(false)

  const detail = computed(() => {
    if (!selectedOrderId.value) return null
    return (orders.value ?? []).find((o) => o.id === selectedOrderId.value) ?? null
  })

  function onViewDetail(id: string) {
    selectedOrderId.value = id
    detailVisible.value = true
  }

  const specialItems = computed(() => {
    return (detail.value?.items ?? []).filter((i) => i.specialInstructions)
  })

  return {
    feed,
    isLoading,
    isError,
    search,
    columns,
    detail,
    detailVisible,
    specialItems,
    onViewDetail,
    refresh,
  }
}
```

- [ ] **Step 2: Slim the view script**

`OrderDashboard.vue` script becomes:

```ts
<script setup lang="ts">
import { statusLabel } from '@/utils/formatters'
import { ORDER_STATUS_SEVERITY } from '@/constants/orderStatus'
import type { OrderStatus } from '@/types'
import { useOrderDashboard } from '@/modules/kds/composables/useOrderDashboard'
import { formatCurrency, formatTime } from '@/utils/formatters'
import KdsColumn from '@/modules/kds/components/KdsColumn.vue'
import OrderCard from '@/modules/kds/components/OrderCard.vue'
import Dialog from 'primevue/dialog'
import Chip from 'primevue/chip'
import Divider from 'primevue/divider'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

const {
  feed, isLoading, isError, search, columns,
  detail, detailVisible, specialItems, onViewDetail, refresh,
} = useOrderDashboard()

function severityFor(status: OrderStatus): string {
  return ORDER_STATUS_SEVERITY[status] || 'info'
}
</script>
```

(Template unchanged.)

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: exit 0

- [ ] **Step 4: Manual verification**

`npm start` → `/kds` — search, live badge, columns, detail dialog, refresh all behave as before.

- [ ] **Step 5: Commit**

```bash
git add src/modules/kds/
git commit -m "refactor: extract useOrderDashboard composable from OrderDashboard view"
```

**Phase 1 gate:** `npm run build && npm test` both pass.

---

# Phase 2 — Quality gates

### Task 13: ESLint 9 + Prettier

**Files:**
- Create: `eslint.config.js`
- Create: `eslint.config.js` ignores via config; `.prettierrc.json`, `.prettierignore`
- Modify: `package.json` (devDeps + scripts)

**Interfaces:**
- Consumes: existing code style (no semicolons, single quotes)
- Produces: scripts `lint`, `lint:fix`, `format`, `format:check`

- [ ] **Step 1: Install tooling**

Run: `npm install -D eslint @eslint/js typescript-eslint eslint-plugin-vue eslint-config-prettier prettier @prettier/plugin-vue`

- [ ] **Step 2: Create `eslint.config.js`**

```js
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import configPrettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'docs/**', '.agents/**', '.specs/**', 'db.json', 'llms*.txt', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  configPrettier,
)
```

- [ ] **Step 3: Create `.prettierrc.json`**

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "all"
}
```

Create `.prettierignore`:

```
dist
node_modules
package-lock.json
db.json
llms-full.txt
llms_full.txt
docs
.agents
.specs
```

- [ ] **Step 4: Add scripts**

In `package.json` scripts, add:

```json
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
```

- [ ] **Step 5: First lint run — triage, then fix**

Run: `npm run lint`
For each finding: fix the code (prefer real fixes). Only if a rule is genuinely wrong for this codebase, disable it inline with a short comment. Do NOT blanket-disable.

Run: `npm run lint` again until exit 0 (or record remaining justified disables in the commit message).

- [ ] **Step 6: Format everything as its own commit**

Run: `npm run format`

Run: `npm run build && npm test`
Expected: both pass (formatting must not break anything)

- [ ] **Step 7: Commit (two commits: config, then format)**

```bash
git add eslint.config.js .prettierrc.json .prettierignore package.json package-lock.json
git commit -m "chore: add ESLint 9 and Prettier with lint/format scripts"

git add -A
git commit -m "chore: apply Prettier formatting across the codebase"
```

(If `lint:fix` produced source fixes in Step 5, include them in the first commit via `git add -p` or a third commit `chore: fix lint findings` — keep format-only churn separate.)

---

### Task 14: Formalize Vitest config and add remaining tests

**Files:**
- Modify: `vite.config.ts` (add `test` block)
- Create: `src/utils/formatters.test.ts`
- Create: `src/utils/validators.test.ts`
- Create: `src/modules/inventory/composables/useIngredients.test.ts`
- Create: `src/modules/analytics/components/KpiCard.test.ts`

**Interfaces:**
- Consumes: existing utils/composables
- Produces: `npm test` exits 0 with real coverage of utils + one reactive composable + one component

- [ ] **Step 1: Add explicit test config to `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
// ...existing imports...

export default defineConfig({
  // ...existing plugins/resolve/server...
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
  },
})
```

- [ ] **Step 2: Write `src/utils/formatters.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, statusLabel, statusColor } from './formatters'

describe('formatCurrency', () => {
  it('formats USD with two decimals', () => {
    expect(formatCurrency(12.5)).toBe('$12.50')
  })
})

describe('statusLabel', () => {
  it('maps known statuses', () => {
    expect(statusLabel('preparing')).toBe('Preparing')
  })
  it('falls back to the raw value', () => {
    expect(statusLabel('unknown')).toBe('unknown')
  })
})

describe('statusColor', () => {
  it('maps known statuses through constants', () => {
    expect(statusColor('ready')).toBe('green')
  })
})
```

- [ ] **Step 3: Write `src/utils/validators.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { required, positiveNumber, minLength } from './validators'

describe('required', () => {
  it('rejects empty values', () => {
    expect(required('')).toBe('This field is required')
    expect(required(null)).toBe('This field is required')
  })
  it('accepts non-empty values', () => {
    expect(required('x')).toBe(true)
  })
})

describe('positiveNumber', () => {
  it('rejects zero and negatives', () => {
    expect(positiveNumber(0)).toBe('Must be a positive number')
    expect(positiveNumber(-1)).toBe('Must be a positive number')
  })
  it('accepts positives', () => {
    expect(positiveNumber(2.5)).toBe(true)
  })
})

describe('minLength', () => {
  it('enforces the configured minimum', () => {
    const check = minLength(3)
    expect(check('ab')).toBe('Must be at least 3 characters')
    expect(check('abc')).toBe(true)
  })
})
```

- [ ] **Step 4: Write the reactive `useIngredients` smoke test**

Create `src/modules/inventory/composables/useIngredients.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref, nextTick } from 'vue'
import { VueQueryPlugin, QueryClient, useQueryClient } from '@tanstack/vue-query'
import { useIngredients } from './useInventory'

vi.mock('@/api/client', () => ({
  api: {
    ingredients: {
      list: vi.fn().mockResolvedValue([]),
    },
  },
}))

import { api } from '@/api/client'

const Harness = defineComponent({
  props: {
    search: { type: String, default: '' },
  },
  setup(props) {
    const filters = ref({ search: props.search, unit: undefined })
    const query = useIngredients(filters)
    const qc = useQueryClient()
    return { filters, query, qc }
  },
  template: '<div />',
})

function mountHarness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(Harness, {
    global: { plugins: [[VueQueryPlugin, { queryClient: client]] },
  })
}

describe('useIngredients reactive filters', () => {
  beforeEach(() => vi.clearAllMocks())

  it('issues a new request when the filters ref changes', async () => {
    const wrapper = mountHarness()
    await nextTick()
    await nextTick()

    expect(api.ingredients.list).toHaveBeenCalledWith({ search: '', unit: undefined })

    const vm = wrapper.vm as unknown as { filters: { search: string } }
    vm.filters.search = 'chicken'
    await nextTick()
    await nextTick()

    expect(api.ingredients.list).toHaveBeenCalledWith({ search: 'chicken', unit: undefined })
  })
})
```

- [ ] **Step 5: Write `KpiCard` render test**

Create `src/modules/analytics/components/KpiCard.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KpiCard from './KpiCard.vue'

describe('KpiCard', () => {
  it('renders title, value, and subtitle', () => {
    const wrapper = mount(KpiCard, {
      props: {
        title: 'Total Revenue',
        value: '$1,234.00',
        icon: 'pi-dollar',
        subtitle: '42 orders',
      },
    })
    expect(wrapper.text()).toContain('Total Revenue')
    expect(wrapper.text()).toContain('$1,234.00')
    expect(wrapper.text()).toContain('42 orders')
  })
})
```

(Note: if KpiCard has required props with different names, read the component first and adapt prop names — do not change KpiCard itself.)

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS, exit 0

- [ ] **Step 7: Type-check**

Run: `npm run build`
Expected: exit 0

- [ ] **Step 8: Commit**

```bash
git add vite.config.ts src/utils/formatters.test.ts src/utils/validators.test.ts src/modules/inventory/composables/useIngredients.test.ts src/modules/analytics/components/KpiCard.test.ts
git commit -m "test: formalize vitest config and add utils/composable/component tests"
```

**Phase 2 gate:** `npm run build && npm test && npm run lint` all pass.

---

# Phase 3 — Docs truth

### Task 15: Archive stale docs

**Files:**
- Move: `CHANGELOG.md`, `todo.txt`, `plan.md`, `solution.a.md`, `solution.b.md`, `solution.c.md` → `docs/legacy/`
- Create: `docs/legacy/README.md`

**Interfaces:**
- Consumes: git history preserves everything
- Produces: root contains only current docs; legacy clearly marked

- [ ] **Step 1: Move files**

Run:

```bash
mkdir -p docs/legacy
git mv CHANGELOG.md todo.txt plan.md solution.a.md solution.b.md solution.c.md docs/legacy/
```

- [ ] **Step 2: Create `docs/legacy/README.md`**

```markdown
# Legacy documentation (historical only)

Files in this folder describe an **earlier architecture** of this project
(plain JavaScript, Pinia stores, hand-rolled Vuetify0 primitives, SSE via useSSE).
That code no longer exists.

**Do not follow these files for current behavior.** Current sources of truth:

- `README.md`
- `docs/ONBOARDING.md`
- `docs/ARCHITECTURE.md`
- `docs/API.md`
```

- [ ] **Step 3: Verify no root references break**

Run: `grep -rn "todo.txt\|plan.md\|solution\.[abc]\.md" README.md docs/*.md --include="*.md" | grep -v legacy || echo CLEAN`
Expected: `CLEAN` or only historical mentions — fix any live links to point at `docs/legacy/`.

- [ ] **Step 4: Commit**

```bash
git add docs/legacy/
git commit -m "docs: archive stale architecture docs to docs/legacy/"
```

---

### Task 16: Fresh CHANGELOG, README fixes, `.env.example`, `AGENTS.md`

**Files:**
- Create: `CHANGELOG.md` (new, root)
- Modify: `README.md` (Chart.js claim; test instructions)
- Modify: `.env.example`
- Create: `AGENTS.md`

**Interfaces:**
- Consumes: current architecture facts; Task 13 scripts; Task 14 test suite
- Produces: docs that match reality

- [ ] **Step 1: Create new root `CHANGELOG.md`**

```markdown
# Changelog

## 0.3.0 — 2026-10-08

Gap-closure pass on the Vue 3 + TypeScript + PrimeVue + Vue Query + Socket.IO stack.

### Fixed
- Inventory search/unit filters now refetch reactively
- Stock adjustments persist `lastAdjustReason` / `lastAdjustedAt`
- Top-selling table shows menu item names
- Analytics daily/weekly/monthly toggle drives KPIs, revenue graph, top sellers, and brand split (client-side aggregation)
- Recipe builder surfaces load errors and reflects saved recipes immediately

### Changed
- Shared nav and order-status constants extracted (`src/constants/`)
- KDS dashboard logic moved to `useOrderDashboard` composable
- `Order.phone` / `Customer.phone` typed as `string`; seed data backfilled

### Tooling
- ESLint 9 + Prettier added (`npm run lint`, `npm run format`)
- Vitest suite added: utils, API client, composable, component (`npm test`)

### Removed
- Unused dependencies: Pinia, chart.js, vue-chartjs
- Dead files: `SalesChart.vue`, `useDebounce.ts`

## Before 0.3.0

Pre-Vue-3/TypeScript history lives in `docs/legacy/CHANGELOG.md`.
```

- [ ] **Step 2: Fix README**

Line 40 table row — replace:

```
| Charts | Chart.js + vue-chartjs |
```

with:

```
| Charts | Hand-rolled SVG (`DailyRevenueGraph.vue`) |
```

Scripts table — ensure rows exist (add if missing):

```
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
```

Line ~97 checklist item 4 — replace "Run `npm test` to verify tests pass" context is fine now that tests exist; leave it.

Also add a short "Architecture at a glance" note if not present: mock API = json-server on :3001; data resets via `git checkout db.json`.

- [ ] **Step 3: Align `.env.example`**

Replace entire file with:

```
VITE_WS_URL=http://localhost:3001
```

(Code keeps the `VITE_WS_PORT` fallback in `useSocket.ts` — README documents `VITE_WS_URL` as the supported variable.)

- [ ] **Step 4: Create `AGENTS.md`**

```markdown
# Agent notes

- Read `docs/ONBOARDING.md` first (conventions, architecture, add-a-feature checklist).
- Current stack: Vue 3 + TS + PrimeVue + Vue Query + Socket.IO; mock backend = json-server (`server.js`, `db.json`).
- Never import Axios in components — only `src/api/client.ts`. Never fetch in components — use module composables.
- Verification before claiming done: `npm run build` (type-check), `npm test`, `npm run lint`.
- Stale historical docs live in `docs/legacy/` — ignore them for current behavior.
```

- [ ] **Step 5: Verify docs consistency**

Run: `npm run build && npm test && npm run lint`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add CHANGELOG.md README.md .env.example AGENTS.md
git commit -m "docs: realign README/CHANGELOG/env example and add AGENTS.md"
```

**Phase 3 / final gate:** `npm run build && npm test && npm run lint` all pass; manual smoke on KDS, inventory search + stock adjust, analytics toggle, recipe save.

---

## Self-review notes (plan vs spec)

- All spec Phase 0–3 items map to Tasks 1–16.
- `wastage_logs` backfill removed after verification (already complete) — spec amended.
- Type consistency: `AggregatedPeriod`/`SalesPeriod` defined in Task 8, consumed in Task 9; `useIngredients` signature (Task 6) preserves no-arg callers verified by grep step; `ORDER_STATUS_*` names identical across Task 11 and Task 12.
- No TBDs; every code step has full code or exact grep/commands.
