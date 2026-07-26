# Design & WebSocket Fix — Implementation Plan (Approach A: Minimal Repairs)

**Date:** 2026-07-15
**Approach:** Minimal Repairs (from `.specs/research/design-websocket-2026-07-15.proposals.a.md`)
**Judge Feedback Addressed:** Loading skeletons, `text-primary-400`, border color consistency, expanded CSS coverage, WS cache patching from payload

---

## 1. Proposal Analysis

### Core Insight
Fix only the broken things — define the `field` class, swap the icon, add `relative` to the tooltip parent, replace `text-primary-400`, align border colors to shortcut values, add basic WS fallback. No architectural changes.

### Key Design Decisions (from proposal)
- Fixes are localized to files with bugs — minimal diff
- Border colors normalized to shortcut values (`border-gray-200`)
- WS payload consumed to patch cache; full invalidation kept as backup after delay
- No refactoring of card patterns — accepts inconsistency as future concern

### Gaps Filled by Judge Feedback
1. **Loading skeletons** — proposal said "no loading skeletons added outside KDS"; judges want them added
2. **`text-primary-400`** — proposal said replace with `text-brand-400`; judges want this addressed
3. **Border color consistency** — proposal was thin; judges want full normalization
4. **CSS/style issues** — judges want expanded coverage beyond just the `field` class
5. **WS cache patching** — judges want explicit payload-based patching, not just connection fixes

---

## 2. Implementation Plan

### File Change Summary

| File | Change |
|---|---|
| `uno.config.ts` | Add `presetIcons`, add `primary` color family |
| `src/styles/main.css` | Add `.field` class, add skeleton animation, add `.btn-filter` styles |
| `src/modules/kds/composables/useOrderFeed.ts` | Full rewrite: env URL, polling fallback, `connect_error`, cache patching, auth, `connected` event |
| `src/modules/analytics/components/WastageLog.vue` | Fix icon: `i-ph-plus-bold` → `pi pi-plus` |
| `src/modules/analytics/components/SalesChart.vue` | Fix tooltip: add `relative` container |
| `src/modules/analytics/components/BrandPerformance.vue` | Normalize border to `border-gray-200`, use `card` shortcut |
| `src/modules/kds/components/OrderCard.vue` | Move inline border to class |
| `src/modules/analytics/views/AnalyticsDashboard.vue` | Add hover/active states to filter buttons, add loading skeleton |
| `src/modules/menu/views/RecipeBuilder.vue` | Fix `text-primary-400` → `text-brand-400`, add skeleton loading |
| `src/modules/inventory/views/InventoryList.vue` | Add skeleton loading state |
| `src/modules/menu/views/MenuList.vue` | Add skeleton loading state |
| `src/modules/inventory/views/StockAdjustment.vue` | Normalize border to `border-gray-200` |
| `src/modules/inventory/components/IngredientForm.vue` | No code change — `field` class now defined in main.css |

---

## 3. Detailed Implementation

### 3.1 UnoCSS Config — Add Icon Preset + Primary Color Family

**File:** `uno.config.ts`

```ts
import { defineConfig, presetWind, presetIcons } from 'unocss'
import transformerDirectives from '@unocss/transformer-directives'

export default defineConfig({
  presets: [
    presetWind(),
    presetIcons({
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  transformers: [transformerDirectives()],
  shortcuts: {
    'btn': 'px-4 py-2 rounded-lg font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
    'btn-primary': 'btn bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800',
    'btn-secondary': 'btn bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300',
    'btn-danger': 'btn bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    'btn-ghost': 'btn text-gray-600 hover:bg-gray-100 active:bg-gray-200',
    'card': 'bg-white rounded-xl shadow-sm border border-gray-200 p-6',
    'badge': 'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold',
    'chip': 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
    'input': 'w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-colors',
    'page-header': 'text-2xl font-bold text-gray-900',
    'page-subtitle': 'text-sm text-gray-500 mt-1',
    'skeleton': 'rounded-lg bg-gray-200 animate-pulse',
    'skeleton-text': 'skeleton h-4 w-full',
    'skeleton-heading': 'skeleton h-6 w-48',
    'skeleton-card': 'skeleton h-32 w-full rounded-xl',
  },
  theme: {
    colors: {
      brand: {
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
      },
      primary: {
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
      },
    },
  },
})
```

**Changes from original:**
- Added `presetIcons` from `@unocss/preset-icons` (enables `i-*` icon classes if needed, though we're fixing the broken one to use PrimeIcons)
- Added `primary` color family (mirrors `brand` values) — fixes `text-primary-400` in RecipeBuilder
- Added `skeleton`, `skeleton-text`, `skeleton-heading`, `skeleton-card` shortcuts for loading states

---

### 3.2 main.css — Define `.field` Class + Skeleton Animation + Button States

**File:** `src/styles/main.css`

Add after the existing `::-webkit-scrollbar` block (before the `*` selector):

```css
/* Form field layout — used by StockAdjustment, IngredientForm, and others */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* Skeleton pulse animation */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.skeleton {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

/* Filter button hover/active states */
.btn-filter {
  transition: all 0.15s ease;
}
.btn-filter:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}
.btn-filter:active {
  transform: translateY(0);
  opacity: 0.7;
}
.btn-filter-active {
  box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.3);
}
```

**Changes from original:**
- Added `.field` class definition (was missing — used in StockAdjustment.vue and IngredientForm.vue)
- Added `@keyframes skeleton-pulse` for skeleton loading animation
- Added `.skeleton` class (used by `skeleton` shortcut)
- Added `.btn-filter` and `.btn-filter-active` for filter button interactive states

---

### 3.3 WastageLog.vue — Fix Broken Icon

**File:** `src/modules/analytics/components/WastageLog.vue`

**Change:** Line 61 — Replace `i-ph-plus-bold` with `pi pi-plus`

```diff
- <Button label="Log Wastage" icon="i-ph-plus-bold" size="small" class="btn-primary" @click="openDialog" />
+ <Button label="Log Wastage" icon="pi pi-plus" size="small" class="btn-primary" @click="openDialog" />
```

**Rationale:** The project only imports `primeicons/primeicons.css`. Phosphor icons (`i-ph-*`) require the UnoCSS icon preset and the corresponding icon collection package. Since the project uses PrimeIcons everywhere else, this was a copy-paste error.

---

### 3.4 SalesChart.vue — Fix Tooltip Positioning

**File:** `src/modules/analytics/components/SalesChart.vue`

**Change:** The tooltip `<div>` at line 39 is `absolute` but its parent chain is `flex-col` without `position: relative`. The bar container at line 32 already has `relative`, but the tooltip is a sibling of the bar container, not a child. Need to restructure so the tooltip is inside the `relative` container.

```diff
       <div
         v-for="(bar, i) in bars"
         :key="i"
-        class="flex-1 flex flex-col items-center min-w-[2rem] group"
+        class="flex-1 flex flex-col items-center min-w-[2rem] group relative"
       >
         <div class="relative w-full flex justify-center">
           <div
             class="w-full max-w-10 bg-orange-500 rounded-t-md transition-all duration-300 group-hover:bg-orange-600"
             :style="{ height: `${Math.max(bar.pct, 2)}%` }"
           />
         </div>
         <span class="text-[10px] text-gray-400 mt-1 truncate w-full text-center">{{ bar.date }}</span>
-        <div class="absolute bottom-6 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
+        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
           {{ formatCurrency(bar.revenue) }}
         </div>
```

**Changes:**
1. Added `relative` to the bar container (the `group` div) so the `absolute` tooltip positions relative to it
2. Added `left-1/2 -translate-x-1/2` to center the tooltip horizontally over the bar

**Before:** Tooltip `absolute` positioned relative to the nearest positioned ancestor (which was the `flex-col` container without `relative`), causing it to float to the top of the viewport or an unexpected position.

**After:** Tooltip positions relative to the bar container, centered horizontally, appearing above the bar on hover.

---

### 3.5 BrandPerformance.vue — Normalize Border to `card` Shortcut

**File:** `src/modules/analytics/components/BrandPerformance.vue`

**Change line 64:**

```diff
-  <div class="bg-white border border-[#E9ECEF] rounded-xl p-5 space-y-4">
+  <div class="card space-y-4">
```

**Rationale:** The `card` shortcut is `bg-white rounded-xl shadow-sm border border-gray-200 p-6`. This replaces the inline `border-[#E9ECEF]` with `border-gray-200` (#E5E7EB) from the shortcut. The padding changes from `p-5` to `p-6` (from the shortcut), which is consistent with other cards. The `shadow-sm` is added, which is the intended card pattern.

**Note:** The `card` shortcut uses `p-6` instead of `p-5`. This is intentional — consistency with the rest of the app is more important than preserving the exact pixel padding. If `p-5` must be preserved, use `card !p-5` but that creates a new inconsistency.

---

### 3.6 OrderCard.vue — Move Inline Border to Class

**File:** `src/modules/kds/components/OrderCard.vue`

**Change line 3-4:**

```diff
   <div
-    class="bg-white rounded-xl shadow-sm transition-shadow cursor-pointer relative overflow-hidden group"
-    :style="{ border: '1px solid #E9ECEF' }"
+    class="bg-white rounded-xl shadow-sm border border-gray-200 transition-shadow cursor-pointer relative overflow-hidden group"
     @click="$emit('view-detail', order.id)"
   >
```

**Rationale:** The inline `style` border used `#E9ECEF` while the `card` shortcut uses `border-gray-200` (#E5E7EB). Normalizing to `border-gray-200` for consistency. The visual difference is negligible (2 per channel).

---

### 3.7 StockAdjustment.vue — Normalize Border

**File:** `src/modules/inventory/views/StockAdjustment.vue`

**Change line 8:**

```diff
-    <div class="card bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-5">
+    <div class="card flex flex-col gap-5">
```

**Rationale:** The `card` shortcut already includes `bg-white rounded-xl shadow-sm border border-gray-200 p-6`. The inline classes were redundant and used `rounded-lg` instead of `rounded-xl` (from the shortcut). Removing the redundant classes ensures consistency.

---

### 3.8 AnalyticsDashboard.vue — Filter Button States + Loading Skeleton

**File:** `src/modules/analytics/views/AnalyticsDashboard.vue`

**Changes:**

1. Add `activePeriod` ref and filter button interactive states:

```diff
 <script setup lang="ts">
-import { computed } from 'vue'
+import { ref, computed } from 'vue'
 import { useDailySales, useWastageLogs, useKpiMetrics } from '@/modules/analytics/composables/useAnalytics'
 import { useIngredients } from '@/modules/inventory/composables/useInventory'
 import { formatCurrency } from '@/utils/formatters'
@@ -14,6 +14,8 @@ const { data: wastageLogs } = useWastageLogs()
 const { data: ingredients } = useIngredients()

 const kpi = useKpiMetrics()
+
+const activePeriod = ref<'daily' | 'weekly' | 'monthly'>('daily')

 const totalWastage = computed(() =>
   (wastageLogs.value ?? []).reduce((sum, w) => sum + w.quantity, 0),
```

2. Replace filter buttons with interactive versions:

```diff
       <div class="flex gap-2">
-        <button class="btn-primary text-sm px-3 py-1.5">Daily</button>
-        <button class="btn-secondary text-sm px-3 py-1.5">Weekly</button>
-        <button class="btn-secondary text-sm px-3 py-1.5">Monthly</button>
+        <button
+          class="btn-filter text-sm px-3 py-1.5 rounded-lg font-medium transition-all duration-150"
+          :class="activePeriod === 'daily' ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
+          @click="activePeriod = 'daily'"
+        >Daily</button>
+        <button
+          class="btn-filter text-sm px-3 py-1.5 rounded-lg font-medium transition-all duration-150"
+          :class="activePeriod === 'weekly' ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
+          @click="activePeriod = 'weekly'"
+        >Weekly</button>
+        <button
+          class="btn-filter text-sm px-3 py-1.5 rounded-lg font-medium transition-all duration-150"
+          :class="activePeriod === 'monthly' ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
+          @click="activePeriod = 'monthly'"
+        >Monthly</button>
       </div>
```

3. Add loading skeleton for the entire dashboard:

```diff
 <template>
   <div class="p-6 space-y-6">
+    <template v-if="!salesData && !wastageLogs">
+      <div class="flex items-center justify-between">
+        <div>
+          <div class="skeleton-heading"></div>
+          <div class="skeleton-text w-64 mt-2"></div>
+        </div>
+        <div class="flex gap-2">
+          <div class="skeleton h-8 w-16 rounded-lg"></div>
+          <div class="skeleton h-8 w-20 rounded-lg"></div>
+          <div class="skeleton h-8 w-20 rounded-lg"></div>
+        </div>
+      </div>
+      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
+        <div v-for="i in 4" :key="i" class="skeleton-card"></div>
+      </div>
+      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
+        <div class="xl:col-span-2 skeleton-card h-64"></div>
+        <div class="skeleton-card h-64"></div>
+      </div>
+      <div class="skeleton-card h-48"></div>
+      <div class="skeleton-card h-40"></div>
+    </template>
+    <template v-else>
     <div class="flex items-center justify-between">
       ...
     </div>
     ...
     <BrandPerformance />
+    </template>
   </div>
 </template>
```

**Full template after changes:**

```vue
<template>
  <div class="p-6 space-y-6">
    <template v-if="!salesData && !wastageLogs">
      <div class="flex items-center justify-between">
        <div>
          <div class="skeleton-heading"></div>
          <div class="skeleton-text w-64 mt-2"></div>
        </div>
        <div class="flex gap-2">
          <div class="skeleton h-8 w-16 rounded-lg"></div>
          <div class="skeleton h-8 w-20 rounded-lg"></div>
          <div class="skeleton h-8 w-20 rounded-lg"></div>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="skeleton-card"></div>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 skeleton-card h-64"></div>
        <div class="skeleton-card h-64"></div>
      </div>
      <div class="skeleton-card h-48"></div>
      <div class="skeleton-card h-40"></div>
    </template>
    <template v-else>
      <!-- existing content -->
      <div class="flex items-center justify-between">
        ...
      </div>
      ...
      <BrandPerformance />
    </template>
  </div>
</template>
```

**Rationale:** The skeleton shows when both `salesData` and `wastageLogs` are still loading (undefined). Once either resolves, the real content renders. The skeleton layout mirrors the actual dashboard grid structure.

---

### 3.9 RecipeBuilder.vue — Fix `text-primary-400` + Add Loading Skeleton

**File:** `src/modules/menu/views/RecipeBuilder.vue`

**Change 1 — Fix color reference (line 43):**

```diff
-              <i class="pi pi-circle-fill text-primary-400 text-xs" />
+              <i class="pi pi-circle-fill text-brand-400 text-xs" />
```

**Rationale:** The UnoCSS config only defines `brand` color family, not `primary`. `text-primary-400` resolves to nothing (no color applied). `text-brand-400` maps to `#fb923c` (orange-400), which is the intended color.

**Change 2 — Add loading skeleton for the entire page:**

```diff
 <template>
   <div class="flex flex-col gap-4">
+    <template v-if="!items.length && itemsQuery.isLoading.value">
+      <div class="flex items-center justify-between">
+        <div class="skeleton-heading"></div>
+        <div class="skeleton h-9 w-36 rounded-lg"></div>
+      </div>
+      <div class="flex flex-col gap-2">
+        <div v-for="i in 4" :key="i" class="skeleton-card h-16"></div>
+      </div>
+    </template>
+    <template v-else>
     <div class="flex items-center justify-between">
       <h1 class="text-2xl font-bold text-gray-800">Recipe Builder</h1>
       ...
     </div>
     ...
     </Accordion>
+    </template>
   </div>
 </template>
```

---

### 3.10 InventoryList.vue — Add Loading Skeleton

**File:** `src/modules/inventory/views/InventoryList.vue`

Add skeleton state before the DataTable:

```diff
     </div>

+    <template v-if="isLoading && !ingredients">
+      <div class="flex items-center gap-3">
+        <div class="skeleton h-10 flex-1 rounded-lg"></div>
+        <div class="skeleton h-10 w-40 rounded-lg"></div>
+      </div>
+      <div class="flex flex-col gap-2">
+        <div v-for="i in 5" :key="i" class="skeleton-card h-16"></div>
+      </div>
+    </template>
+    <template v-else>
     <DataTable
       ...
     </DataTable>
+    </template>
```

**Note:** The DataTable already has `:loading="isLoading"` which shows PrimeVue's built-in loading overlay. However, the skeleton provides a more polished first-load experience. The `v-if="isLoading && !ingredients"` condition shows the skeleton only on initial load (when data hasn't arrived yet), and falls through to the DataTable with its loading state for subsequent refetches.

---

### 3.11 MenuList.vue — Add Loading Skeleton

**File:** `src/modules/menu/views/MenuList.vue`

Add skeleton state before the DataTable:

```diff
     </div>

+    <template v-if="itemsQuery.isLoading.value && !items.length">
+      <div class="flex items-center gap-2">
+        <div class="skeleton h-10 flex-1 rounded-lg"></div>
+      </div>
+      <div class="flex flex-col gap-2">
+        <div v-for="i in 5" :key="i" class="skeleton-card h-16"></div>
+      </div>
+    </template>
+    <template v-else>
     <DataTable
       ...
     </DataTable>
+    </template>
```

---

### 3.12 useOrderFeed.ts — Full Rewrite

**File:** `src/modules/kds/composables/useOrderFeed.ts`

**Complete replacement:**

```ts
import { ref, onUnmounted } from 'vue'
import { io, type Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/vue-query'
import type { Order } from '@/types'

interface OrderUpdatePayload {
  id: string
  status: Order['status']
  orderNumber: number
}

export function useOrderFeed() {
  const connected = ref(false)
  const socket = ref<Socket | null>(null)
  const queryClient = useQueryClient()

  const WS_URL = import.meta.env.VITE_WS_URL || ''

  function connect() {
    socket.value = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
      reconnectionDelayMax: 30000,
      auth: {
        token: import.meta.env.VITE_WS_TOKEN || '',
      },
      withCredentials: true,
    })

    socket.value.on('connect', () => {
      connected.value = true
    })

    socket.value.on('connected', (data: { message: string }) => {
      console.log('[WS] Server acknowledged:', data.message)
    })

    socket.value.on('order:update', (payload: OrderUpdatePayload) => {
      queryClient.setQueryData<Order[]>(['orders'], (old) => {
        if (!old) return old
        return old.map((o) =>
          o.id === payload.id
            ? { ...o, status: payload.status }
            : o,
        )
      })
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
      }, 5000)
    })

    socket.value.on('connect_error', (err: Error) => {
      console.warn('[WS] Connection error:', err.message)
      connected.value = false
    })

    socket.value.on('disconnect', () => {
      connected.value = false
    })
  }

  connect()

  onUnmounted(() => {
    socket.value?.disconnect()
  })

  return { connected }
}
```

**Changes from original:**

| Issue | Before | After |
|---|---|---|
| Hardcoded URL | `io('http://localhost:3001', ...)` | `io(import.meta.env.VITE_WS_URL || '', ...)` |
| No polling fallback | `transports: ['websocket']` | `transports: ['websocket', 'polling']` |
| No `connect_error` handler | missing | `socket.value.on('connect_error', ...)` with console.warn + connected=false |
| Ignores payload | `queryClient.invalidateQueries({ queryKey: ['orders'] })` | `queryClient.setQueryData(...)` patches cache + delayed invalidation at 5s |
| No auth/credentials | missing | `auth: { token: import.meta.env.VITE_WS_TOKEN || '' }` + `withCredentials: true` |
| `connected` event ignored | missing | `socket.value.on('connected', ...)` logs server message |
| No `reconnectionDelayMax` | missing | Added `reconnectionDelayMax: 30000` for exponential backoff cap |

**Cache patching logic:**
- On `order:update`, the payload `{ id, status, orderNumber }` is used to optimistically update the TanStack Query cache via `setQueryData`
- The patch maps over the existing orders array and replaces the status of the matching order
- A delayed `invalidateQueries` at 5 seconds ensures consistency if the payload shape doesn't match the cache schema (mitigation for stale UI)
- This avoids a network round-trip for every status update

**Edge cases handled:**
- Empty `VITE_WS_URL` → connects to same origin (empty string = current page origin)
- Missing `VITE_WS_TOKEN` → sends empty string (no auth failure)
- `connect_error` → sets `connected` to false, logs warning
- Cache is `null`/`undefined` → `setQueryData` callback returns unchanged
- Delayed invalidation at 5s ensures eventual consistency

---

### 3.13 Summary of All Changes

| # | File | Change Type | Description |
|---|---|---|---|
| 1 | `uno.config.ts` | Config | Added `presetIcons`, `primary` color family, skeleton shortcuts |
| 2 | `src/styles/main.css` | CSS | Added `.field`, skeleton keyframes, `.btn-filter` states |
| 3 | `src/modules/analytics/components/WastageLog.vue` | Fix | `i-ph-plus-bold` → `pi pi-plus` |
| 4 | `src/modules/analytics/components/SalesChart.vue` | Fix | Added `relative` to tooltip parent, centered tooltip |
| 5 | `src/modules/analytics/components/BrandPerformance.vue` | Fix | `border border-[#E9ECEF]` → `card` shortcut |
| 6 | `src/modules/kds/components/OrderCard.vue` | Fix | Inline `style` border → `border border-gray-200` class |
| 7 | `src/modules/inventory/views/StockAdjustment.vue` | Fix | Removed redundant classes from `card` div |
| 8 | `src/modules/analytics/views/AnalyticsDashboard.vue` | Fix+Skeleton | Filter button states + loading skeleton |
| 9 | `src/modules/menu/views/RecipeBuilder.vue` | Fix+Skeleton | `text-primary-400` → `text-brand-400` + loading skeleton |
| 10 | `src/modules/inventory/views/InventoryList.vue` | Skeleton | Added loading skeleton |
| 11 | `src/modules/menu/views/MenuList.vue` | Skeleton | Added loading skeleton |
| 12 | `src/modules/kds/composables/useOrderFeed.ts` | Rewrite | Full WS rewrite with cache patching, polling, auth, error handling |

---

## 4. Self-Verification

### Q1: Does the `field` class now exist and match all usages?

**Yes.** The `.field` class is defined in `main.css` as `display: flex; flex-direction: column; gap: 0.25rem;`. It is used in:
- `StockAdjustment.vue` — lines 9, 31, 51, 65 (4 usages)
- `IngredientForm.vue` — lines 11, 18, 30, 37, 51, 67, 93 (7 usages)

All usages follow the pattern `<div class="field"><label>...</label><input/></div>`, which matches the flex-column layout.

### Q2: Does the WebSocket implementation handle all failure modes?

**Yes.**
- **Transport failure:** `transports: ['websocket', 'polling']` — falls back to HTTP long-polling if WebSocket fails
- **Connection error:** `connect_error` handler sets `connected = false` and logs warning
- **Disconnect:** Existing `disconnect` handler sets `connected = false`
- **Reconnection:** `reconnection: true` with `reconnectionDelay: 2000`, `reconnectionAttempts: 10`, `reconnectionDelayMax: 30000`
- **Auth failure:** `auth: { token }` — server can reject; client handles via `connect_error`
- **Stale cache:** Delayed `invalidateQueries` at 5s after cache patch ensures eventual consistency

### Q3: Are all border colors normalized to `border-gray-200`?

**Yes.** The following changes were made:
- `BrandPerformance.vue`: `border border-[#E9ECEF]` → `card` shortcut (uses `border-gray-200`)
- `OrderCard.vue`: Inline `style="border: 1px solid #E9ECEF"` → `border border-gray-200` class
- `StockAdjustment.vue`: Redundant `bg-white rounded-lg border border-gray-200 p-6` removed (already in `card` shortcut)

The remaining `border-[#E9ECEF]` usages in `OrderDashboard.vue` (lines 103, 45) are inside the detail dialog and column separators — these are structural borders, not card borders, and are outside the scope of this fix (Approach A accepts this inconsistency).

### Q4: Are loading skeletons added to all data views that were missing them?

**Yes.**
- `AnalyticsDashboard.vue` — full-page skeleton matching grid layout
- `InventoryList.vue` — skeleton for search bar + table rows
- `MenuList.vue` — skeleton for search bar + table rows
- `RecipeBuilder.vue` — skeleton for heading + accordion items
- `OrderDashboard.vue` — already had skeletons (pre-existing)

### Q5: Does the WS cache patching handle the payload shape correctly?

**Yes.** The server emits `order:update` with `{ id, status, orderNumber }` (from `server.js` line 40). The `setQueryData` callback:
1. Checks if cache exists (`if (!old) return old`)
2. Maps over the array, replacing the matching order's `status` field
3. Returns the new array (immutable update)
4. After 5 seconds, calls `invalidateQueries` as a safety net

The `Order` type has `status: OrderStatus` which matches the payload's `status` field. The `id` field is the primary key. This is an O(n) operation on the orders array (typically < 100 items for a KDS).

### Q5: Are the filter buttons in AnalyticsDashboard now interactive?

**Yes.** Each button:
- Has `btn-filter` class (defined in main.css with hover/active transitions)
- Uses `:class` binding to toggle between active (orange background + white text + shadow) and inactive (gray background + dark text + hover state) styles
- Has a `@click` handler that updates `activePeriod` ref
- Active button gets `bg-orange-600 text-white shadow-sm`
- Inactive buttons get `bg-gray-100 text-gray-700 hover:bg-gray-200`

---

## 5. Deviations from Original Proposal

| Aspect | Original Proposal | Implemented | Rationale |
|---|---|---|---|
| `text-primary-400` fix | Replace with `text-brand-400` | Same | Matches proposal |
| `primary` colors in UnoCSS | "Add `primary` colors to UnoCSS theme" | Added `primary` color family | Provides fallback if other components use `primary-*` |
| Border normalization | "Commit to `border-gray-200` from the shortcut" | Same | Matches proposal |
| Card styling inconsistency | "Accepts inconsistency as a future concern" | Same — only fixed BrandPerformance and OrderCard | Proposal explicitly accepts this |
| Loading skeletons | "No loading skeletons added outside KDS" | Added to AnalyticsDashboard, InventoryList, MenuList, RecipeBuilder | Judge feedback required this |
| WS cache patching | "Use payload to optimistically update query cache" | `setQueryData` with delayed invalidation at 5s | Matches proposal's "delayed refetch" mitigation |
| WS auth | Not mentioned in Approach A | Added `auth: { token }` + `withCredentials: true` | Judge feedback required addressing WS flaws comprehensively |
| Icon preset | Not mentioned | Added `presetIcons` to UnoCSS | Enables future `i-*` usage; no cost to add now |
| Skeleton shortcuts | Not mentioned | Added `skeleton`, `skeleton-text`, `skeleton-heading`, `skeleton-card` | Needed for loading states across 4 views |
| `.btn-filter` styles | Not mentioned | Added to main.css | Needed for filter button interactive states |

---

## 5. Files Not Modified (Intentionally)

| File | Reason |
|---|---|
| `src/modules/kds/components/KdsColumn.vue` | No issues identified |
| `src/modules/kds/components/OrderTimer.vue` | No issues identified |
| `src/modules/kds/views/OrderDashboard.vue` | Already has skeletons; WS changes handled by composable |
| `src/modules/analytics/components/KpiCard.vue` | Uses `card` shortcut correctly |
| `src/modules/analytics/components/TopSellingTable.vue` | Uses `card` shortcut correctly |
| `src/modules/inventory/components/LowStockBanner.vue` | No issues identified |
| `src/modules/menu/components/MenuItemForm.vue` | No issues identified |
| `src/modules/menu/components/IngredientPicker.vue` | No issues identified |
| `src/api/client.ts` | No changes needed |
| `src/types/` | No changes needed |
| `server.js` | No changes needed (already emits correct payload) |
| `vite.config.ts` | No changes needed |
| `package.json` | No changes needed (dependencies already include socket.io-client) |

---

## 6. Verification Checklist

- [ ] `npm run dev` starts without errors
- [ ] `field` class renders form fields with correct layout in StockAdjustment and IngredientForm
- [ ] WastageLog "Log Wastage" button shows PrimeIcons plus icon (not broken/missing icon)
- [ ] SalesChart tooltip appears centered above bars on hover
- [ ] BrandPerformance card uses consistent border with other cards
- [ ] OrderCard border matches `card` shortcut
- [ ] Analytics filter buttons have hover/active visual feedback
- [ ] RecipeBuilder ingredient bullets show orange color (not invisible)
- [ ] Loading skeletons appear on initial load for Analytics, Inventory, Menu, Recipe pages
- [ ] WebSocket connects without hardcoded URL
- [ ] WebSocket falls back to polling if WebSocket transport fails
- [ ] `connect_error` is handled (no uncaught errors)
- [ ] Order status updates appear immediately (cache patched) without REST call
- [ ] Orders re-fetch from REST after 5 seconds (safety net)
- [ ] Server `connected` event is consumed (no unhandled event warnings)
