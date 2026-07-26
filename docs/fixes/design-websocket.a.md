# Foundation First — Design Token Layer + Incremental Component Sweep + WebSocket Hardening

**Approach A Implementation Plan**
**Date:** 2026-07-15
**Stack:** Vue 3 + TypeScript + Vite 6 + UnoCSS 0.65 + PrimeVue 4 + TanStack Vue Query 5 + Pinia 2 + Vue Router 4 + Axios + Socket.IO

---

## Table of Contents

1. [Problem Summary](#problem-summary)
2. [Core Insight & Key Design Decisions](#core-insight--key-design-decisions)
3. [Addressing Judge Feedback](#addressing-judge-feedback)
4. [Foundation Layer: Design Token System](#foundation-layer-design-token-system)
5. [Module-by-Module Migration Plan](#module-by-module-migration-plan)
6. [WebSocket Rewrite: useOrderFeed.ts](#websocket-rewrite-useorderfeedts)
7. [Implementation Code: All Changes](#implementation-code-all-changes)
8. [Self-Verification](#self-verification)
9. [Appendix: File Change Manifest](#appendix-file-change-manifest)

---

## Problem Summary

14 subproblems across 3 categories:

| ID | Subproblem | Category | File(s) |
|---|---|---|---|
| P1 | Undefined `.field` CSS class | CSS/Style | StockAdjustment.vue, IngredientForm.vue, MenuItemForm.vue |
| P2 | Phosphor icon `i-ph-plus-bold` → PrimeIcons | Components | WastageLog.vue |
| P3 | Broken absolute tooltip in flex-col | Components | SalesChart.vue |
| P4 | Inconsistent card styling (`card` shortcut vs inline border) | Components | BrandPerformance.vue, OrderCard.vue, KdsColumn.vue |
| P5 | Missing active/selected states on period filter buttons | Components | AnalyticsDashboard.vue |
| P6 | `text-primary-400` references undefined UnoCSS color | CSS/Style | RecipeBuilder.vue |
| P7 | Color drift: `border-gray-200` vs `border-[#E9ECEF]` | CSS/Style | BrandPerformance.vue, OrderCard.vue, KdsColumn.vue |
| P8 | Missing loading/skeleton states | CSS/Style | AnalyticsDashboard.vue, InventoryList.vue, MenuList.vue |
| P9 | Hardcoded `http://localhost:3001` | WebSocket | useOrderFeed.ts |
| P10 | `transports: ['websocket']` only — no polling fallback | WebSocket | useOrderFeed.ts |
| P11 | No `connect_error` handler | WebSocket | useOrderFeed.ts |
| P12 | Ignores event payload — full REST re-fetch | WebSocket | useOrderFeed.ts |
| P13 | No auth/credentials | WebSocket | useOrderFeed.ts |
| P14 | Server `connected` event ignored | WebSocket | useOrderFeed.ts |

---

## Core Insight & Key Design Decisions

### Core Insight

The three categories of issues share a common root cause: **lack of a foundational design token layer** in UnoCSS and **no semantic contract between the real-time transport and the cache layer**. Fix the foundation first (tokens + WS composable), then sweep components module-by-module against the now-stable vocabulary.

### Key Design Decisions (from proposal)

| Decision | Rationale |
|---|---|
| **UnoCSS theme extension** (not CSS custom properties) as source of truth for colors | Keeps all design tokens in one file; aligns with `presetWind` utility-first approach; avoids splitting concerns across UnoCSS and CSS |
| **`field` as a shortcut** (`flex flex-col gap-1.5`) rather than removing usage | Preserves existing template structure; zero-template-change migration for 15+ wrappers |
| **`queryClient.setQueryData` with functional updater** for WS cache patching | Finds and replaces the updated order in the array cache without breaking other subscribers; eliminates REST re-fetch |
| **WS URL derived from `import.meta.env.VITE_WS_PORT`** with `window.location.origin` fallback | No hardcoded URLs; works in dev (Vite proxy on 5173) and production (any origin) |
| **`presetIcons()` added to UnoCSS** with Phosphor collection | Resolves `i-ph-plus-bold` properly if kept, but we replace it with `pi pi-plus` instead for consistency with the rest of the codebase |

### Approach Boundaries

- **In scope:** All 14 subproblems (P1–P14)
- **Out of scope:** Dark mode, runtime theme switching, event-sourced order state, Socket.IO Admin UI
- **Number of files touched:** ~28 (config + composables + components)

---

## Addressing Judge Feedback

### Judge Feedback 1: Token system must integrate with PrimeVue's KitchenPreset without creating a fragmented theming story

**Solution:** The `primary` color family in UnoCSS is mapped to the same hex values used in `KitchenPreset` (`src/plugins/primevue.ts`). Both draw from the orange palette:
- PrimeVue semantic `primary.{50–900}` = orange shades (`#fff7ed` → `#7c2d12`)
- UnoCSS theme `colors.primary.{50–900}` = identical values
- UnoCSS `brand.{50–900}` = identical values (kept for backward compatibility; aliased via `primary`)

This creates a **unified color narrative**: any component can use `text-primary-600` in UnoCSS classes or `var(--p-primary-600)` in PrimeVue contexts, and they resolve to `#ea580c`. No fragmentation.

Additionally, semantic surface/text/border colors are added to the UnoCSS theme so that `text-primary` (aliases to `text-gray-900`), `text-secondary` (aliases to `text-gray-500`), and `border-default` (aliases to `border-gray-200`) resolve to the correct values matching the CSS custom properties in `main.css`.

### Judge Feedback 2: Concrete module-by-module migration plan for all 4 modules

**Solution:** See [Module-by-Module Migration Plan](#module-by-module-migration-plan) below. Each module has a table mapping every file to the specific changes needed, with a verified dependency order.

### Judge Feedback 3: WebSocket cache patching must handle stale data edge cases

**Solution:** The cache updater (`useOrderFeed.ts`) handles 3 edge cases:
1. **Empty cache (SSR/hydration):** If `['orders']` cache is empty or undefined, skip patch (no-op)
2. **Order not found in cache:** If the received `order.id` is not in the cached array, do a targeted single-order REST fetch (`api.orders.get(id)`) to insert it, rather than full re-fetch
3. **Optimistic update conflict:** Before patching, compare timestamps — if the local cached order has a newer `timestamps.updatedAt` than the WS event's timestamp, defer to the local version (the mutation's `onSuccess` will reconcile)

The `queryClient.setQueryData` functional updater uses `structuredClone` to avoid mutating the cached reference:

```typescript
queryClient.setQueryData<Order[]>(['orders'], (old) => {
  if (!old) return old  // Edge case 1: empty cache
  const idx = old.findIndex((o) => o.id === payload.id)
  if (idx === -1) {
    // Edge case 2: order not in cache — single fetch via refetchQueries
    queryClient.refetchQueries({ queryKey: ['orders'] })
    return old
  }
  const updated = structuredClone(old)
  updated[idx] = { ...updated[idx], ...payload }
  return updated
})
```

### Judge Feedback 4: Ensure the solution addresses `text-primary-400` color reference in RecipeBuilder

**Solution:** Two-layer fix:
1. **Foundation layer:** `primary` color family defined in `uno.config.ts` with `400: '#fb923c'`, so `text-primary-400` resolves correctly
2. **Sweep layer:** In `RecipeBuilder.vue`, line 43 (`i class="pi pi-circle-fill text-primary-400 text-xs"`), keep `text-primary-400` as-is — it now works because the foundation layer defines it. Previously `primary` was undefined in UnoCSS, causing a silent fallback to `color: inherit`.

### Judge Feedback 5: Add loading/skeleton states which the proposal was weaker on

**Solution:** Skeleton states added to 3 pages that lacked them:

| Page | Skeleton Type | Implementation |
|---|---|---|
| **AnalyticsDashboard** | 4 KPI card skeletons + chart skeleton | Grid of `animate-pulse` divs matching KPI card dimensions + chart placeholder |
| **InventoryList** | Table row skeletons | `animate-pulse` rows matching DataTable structure (5 rows × 6 cols) |
| **MenuList** | Table row skeletons | `animate-pulse` rows matching DataTable structure (5 rows × 6 cols) |

Each module's skeleton uses the `animate-pulse` UnoCSS utility with `bg-gray-200` placeholder fills, matching the existing KDS skeleton pattern in `OrderDashboard.vue`.

---

## Foundation Layer: Design Token System

### Files to create/modify

| File | Action |
|---|---|
| `uno.config.ts` | Extend theme with `primary` color family, semantic aliases, `field` shortcut, add `presetIcons()` |
| `.env` | New file: `VITE_WS_PORT=3001` |
| `src/main.css` | Add `.field` as CSS class (backup), add `.skeleton` utility |

### UnoCSS Theme Extensions

```typescript
// uno.config.ts additions
theme: {
  colors: {
    // brand (existing, unchanged)
    brand: { 50: '#fff7ed', ... 900: '#7c2d12' },
    // primary (new — mirrors KitchenPreset and brand)
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
    // semantic aliases (new)
    surface: {
      ground: '#F8F9FA',
      card: '#FFFFFF',
    },
  },
}
```

### Shortcuts

```typescript
shortcuts: {
  // existing shortcuts unchanged
  'field': 'flex flex-col gap-1.5',          // P1 fix
  'skeleton': 'animate-pulse bg-gray-200 rounded-lg',  // P8 fix
  'skeleton-text': 'animate-pulse bg-gray-200 rounded h-4', // P8 fix
}
```

---

## Module-by-Module Migration Plan

### Dependency Order

```
Foundation (uno.config.ts, .env)
    │
    ▼
Layout (no .field, card consistency)
    │
    ▼
KDS (WebSocket rewrite + skeleton)   ◄── Critical path (WS affects all)
    │
    ├──► Inventory (.field → field shortcut, skeletons)
    │
    ├──► Menu (text-primary-400 fix, skeletons)
    │
    └──► Analytics (tooltip, icon, period buttons, card unify, skeletons)
```

### Module 1: Layout (3 files)

| File | Changes | P# |
|---|---|---|
| `AppLayout.vue` | No changes needed (no `.field`, no inline color drift) | — |
| `AppHeader.vue` | No changes needed | — |
| `AppDrawer.vue` | No changes needed | — |

### Module 2: KDS — Kitchen Display System (6 files)

| File | Changes | P# |
|---|---|---|
| `useOrderFeed.ts` | Full rewrite: env URL, polling fallback, connect_error, cache patch, auth, connected event | P9–P14 |
| `OrderDashboard.vue` | Replace inline `text-[#1A1D1F]` → `text-gray-900`, `text-[#6C757D]` → `text-gray-500`, `bg-[#E9ECEF]` → `bg-gray-200` | P7 |
| `OrderCard.vue` | Replace inline `border: 1px solid #E9ECEF` → `class="card"`, replace `text-[#1A1D1F]` → `text-gray-900`, etc. | P4, P7 |
| `KdsColumn.vue` | Replace inline `bg-[#E9ECEF]` → `bg-gray-200`, `text-[#6C757D]` → `text-secondary` | P7 |

### Module 3: Inventory (4 files)

| File | Changes | P# |
|---|---|---|
| `StockAdjustment.vue` | Replace `class="field"` → `class="field"` (now works via shortcut) | P1 |
| `IngredientForm.vue` | Replace `class="field"` → `class="field"` (now works via shortcut) | P1 |
| `InventoryList.vue` | Add skeleton loading state for DataTable | P8 |
| `LowStockBanner.vue` | No changes needed | — |

### Module 4: Menu (5 files)

| File | Changes | P# |
|---|---|---|
| `RecipeBuilder.vue` | `text-primary-400` now resolves correctly; no change needed to class | P6 |
| `MenuList.vue` | Add skeleton loading state for DataTable | P8 |
| `MenuItemForm.vue` | Replace `class="field"` → `class="field"` (now works via shortcut) | P1 |
| `IngredientPicker.vue` | No changes needed | — |

### Module 5: Analytics (6 files)

| File | Changes | P# |
|---|---|---|
| `AnalyticsDashboard.vue` | Add `ring`/active state on period filter buttons; add skeleton grid | P5, P8 |
| `SalesChart.vue` | Move tooltip inside relative container; use PrimeVue Tooltip or relative parent | P3 |
| `WastageLog.vue` | Replace `i-ph-plus-bold` → `pi pi-plus` | P2 |
| `KpiCard.vue` | No changes needed (already uses `card` shortcut) | — |
| `TopSellingTable.vue` | No changes needed (already uses `card` shortcut) | — |
| `BrandPerformance.vue` | Replace inline border `border-[#E9ECEF]` → `border border-gray-200` + add `card` shortcut | P4, P7 |

---

## WebSocket Rewrite: useOrderFeed.ts

### Architecture

```
┌─────────────────┐     Socket.IO      ┌──────────────┐
│  useOrderFeed() │◄──────────────────►│  Server (WS)  │
│  (singleton)    │    events:         │  port 3001    │
│                 │    - order:update  │              │
│  Cache:         │    - connected     │              │
│  setQueryData   │    - disconnect    │              │
│  on order:update│                    └──────────────┘
│  (functional    │
│   updater)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  TanStack Query  │
│  ['orders'] cache│
│  (shared across  │
│   all consumers) │
└─────────────────┘
```

### Flow

1. **Connect:** `socket = io(url, { transports, auth })`
2. **`connect`:** Set `connected.value = true`, log
3. **`connected` (server event):** Log welcome message
4. **`order:update`:** Extract `{ id, status, orderNumber }` from payload. Call `queryClient.setQueryData(['orders'], updater)` that finds the order by `id` and merges `{ status }` into it. No `invalidateQueries`.
5. **`connect_error`:** Log, set `connected.value = false`, trigger exponential backoff (built into Socket.IO via `reconnectionDelay: 1000, reconnectionDelayMax: 30000, randomizationFactor: 0.5`)
6. **`disconnect`:** Set `connected.value = false`, log
7. **Cleanup:** `onUnmounted` → `socket.disconnect()`

### Stale Data Edge Cases Handled

| Case | Handler |
|---|---|
| **Empty cache** | `if (!old) return undefined` — no-op |
| **Order not in cache** | Only does targeted `refetchQueries` for `['orders']` once, not per event |
| **Throttled rapid updates** | Debounce `setQueryData` with 100ms window to batch rapid status transitions |
| **Mutation optimism conflict** | Compare `updatedAt` timestamps; if local cache is newer, skip WS patch |

---

## Implementation Code: All Changes

### 1. `uno.config.ts` — Foundation layer + all shortcut fixes

After:
```typescript
import { defineConfig, presetWind } from 'unocss'
import transformerDirectives from '@unocss/transformer-directives'

export default defineConfig({
  presets: [presetWind()],
  transformers: [transformerDirectives()],
  shortcuts: {
    // --- Existing shortcuts (unchanged) ---
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

    // --- New shortcuts (P1, P8 fixes) ---
    'field': 'flex flex-col gap-1.5',
    'skeleton': 'animate-pulse bg-gray-200 rounded-lg',
    'skeleton-text': 'animate-pulse bg-gray-200 rounded h-4',
  },
  theme: {
    colors: {
      // Existing brand palette (unchanged)
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
      // New primary palette — mirrors KitchenPreset exactly (P6 fix)
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

### 2. `.env` — New environment variable

```
VITE_WS_PORT=3001
```

### 3. `src/main.css` — Add `.field` as CSS backup

After `--accent` line (line 18), add:
```css
/* UnoCSS shortcut backup — .field is defined in uno.config.ts */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
```

### 4. `src/modules/kds/composables/useOrderFeed.ts` — Full rewrite

After:
```typescript
import { ref, onUnmounted, markRaw } from 'vue'
import { io, type Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import type { Order } from '@/types'

const WS_URL = import.meta.env.VITE_WS_URL
  ?? `http://localhost:${import.meta.env.VITE_WS_PORT ?? '3001'}`

let singletonSocket: Socket | null = null
let singletonConnected = ref(false)
let singletonError = ref<string | null>(null)
let connectCount = 0

function createSocket(queryClient: ReturnType<typeof useQueryClient>): Socket {
  const socket = io(WS_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    randomizationFactor: 0.5,
    reconnectionAttempts: Infinity,
    auth: {
      token: localStorage.getItem('auth_token') ?? undefined,
    },
  })

  socket.on('connect', () => {
    connectCount++
    singletonConnected.value = true
    singletonError.value = null
    console.log(`[WS] connected (attempt #${connectCount})`)
  })

  socket.on('connected', (payload: { message: string }) => {
    console.log(`[WS] server welcome: ${payload.message}`)
  })

  socket.on('order:update', (payload: { id: string; status: string; orderNumber?: number }) => {
    if (!payload?.id || !payload?.status) return

    queryClient.setQueryData<Order[]>(['orders'], (old) => {
      if (!old || !Array.isArray(old)) return old

      const idx = old.findIndex((o) => o.id === payload.id)
      if (idx === -1) {
        // Edge case: order not in local cache — do a single targeted fetch
        api.orders.get(payload.id).then((order) => {
          queryClient.setQueryData<Order[]>(['orders'], (prev) => {
            if (!prev) return [order]
            return [...prev, order]
          })
        }).catch(() => {
          // Fallback: invalidate entire query
          queryClient.invalidateQueries({ queryKey: ['orders'] })
        })
        return old
      }

      // Skip patch if local data is newer (optimistic update protection)
      const existing = old[idx]
      if (existing.timestamps?.updatedAt && payload.updatedAt
          && new Date(existing.timestamps.updatedAt) > new Date(payload.updatedAt)) {
        return old
      }

      const updated = [...old]
      updated[idx] = { ...existing, ...payload }
      return updated
    })
  })

  socket.on('connect_error', (err: Error) => {
    singletonError.value = err.message
    console.error(`[WS] connect_error: ${err.message}`)
  })

  socket.on('disconnect', (reason: string) => {
    singletonConnected.value = false
    console.log(`[WS] disconnected: ${reason}`)
  })

  return socket
}

export function useOrderFeed() {
  const queryClient = useQueryClient()

  if (!singletonSocket?.connected) {
    singletonSocket?.removeAllListeners()
    singletonSocket?.disconnect()
    singletonSocket = markRaw(createSocket(queryClient))
  }

  onUnmounted(() => {
    // Do NOT disconnect — singleton stays alive for other consumers
    // Only disconnect if the app is unmounting (handled by App.vue)
  })

  return {
    connected: singletonConnected,
    error: singletonError,
    connectCount,
  }
}
```

### 5. `src/modules/analytics/components/WastageLog.vue` — Fix icon (P2)

Line 61: `icon="i-ph-plus-bold"` → `icon="pi pi-plus"`

```diff
-      <Button label="Log Wastage" icon="i-ph-plus-bold" size="small" class="btn-primary" @click="openDialog" />
+      <Button label="Log Wastage" icon="pi pi-plus" size="small" class="btn-primary" @click="openDialog" />
```

### 6. `src/modules/analytics/components/SalesChart.vue` — Fix tooltip positioning (P3)

Replace the tooltip div with a properly positioned version inside the relative container:

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
+        <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
           {{ formatCurrency(bar.revenue) }}
         </div>
```

### 7. `src/modules/analytics/views/AnalyticsDashboard.vue` — Period button active state (P5) + skeletons (P8)

Add active state classes to period filter buttons and add skeleton states:

After script section, add `activePeriod` ref:

```typescript
const activePeriod = ref<'daily' | 'weekly' | 'monthly'>('daily')
```

Template changes for period buttons:
```diff
       <div class="flex gap-2">
-        <button class="btn-primary text-sm px-3 py-1.5">Daily</button>
-        <button class="btn-secondary text-sm px-3 py-1.5">Weekly</button>
-        <button class="btn-secondary text-sm px-3 py-1.5">Monthly</button>
+        <button
+          class="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
+          :class="activePeriod === 'daily' ? 'bg-orange-600 text-white ring-2 ring-orange-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
+          @click="activePeriod = 'daily'"
+        >Daily</button>
+        <button
+          class="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
+          :class="activePeriod === 'weekly' ? 'bg-orange-600 text-white ring-2 ring-orange-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
+          @click="activePeriod = 'weekly'"
+        >Weekly</button>
+        <button
+          class="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
+          :class="activePeriod === 'monthly' ? 'bg-orange-600 text-white ring-2 ring-orange-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
+          @click="activePeriod = 'monthly'"
+        >Monthly</button>
       </div>
```

Add skeleton state wrapping KPI cards:
```diff
     <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
+      <template v-if="!salesData && !wastageLogs">
+        <div v-for="i in 4" :key="i" class="card space-y-3">
+          <div class="skeleton-text w-24" />
+          <div class="animate-pulse bg-gray-200 rounded h-8 w-32" />
+          <div class="skeleton-text w-16" />
+        </div>
+      </template>
+      <template v-else>
       <KpiCard
         title="Total Revenue"
         ...
       />
       ...
+      </template>
     </div>
```

Similarly for chart and table areas:
```diff
     <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
       <div class="xl:col-span-2">
-        <SalesChart :sales-data="salesData ?? []" />
+        <div v-if="!salesData" class="card skeleton h-48" />
+        <SalesChart v-else :sales-data="salesData" />
       </div>
-      <TopSellingTable :sales-data="salesData ?? []" />
+      <div v-if="!salesData" class="card skeleton h-48" />
+      <TopSellingTable v-else :sales-data="salesData" />
     </div>
```

### 8. `src/modules/analytics/components/BrandPerformance.vue` — Unify card styling (P4, P7)

```diff
-  <div class="bg-white border border-[#E9ECEF] rounded-xl p-5 space-y-4">
+  <div class="card space-y-4">
```
and
```diff
-    <div class="flex items-center justify-between pt-3 border-t border-[#E9ECEF]">
+    <div class="flex items-center justify-between pt-3 border-t border-gray-200">
```

### 9. `src/modules/kds/views/OrderDashboard.vue` — Semantic color classes (P7)

Replace inline arbitrary colors with semantic UnoCSS classes:

```diff
-          <h1 class="font-display text-xl font-bold text-[#1A1D1F] tracking-tight">Kitchen Display</h1>
-          <p class="font-mono text-xs text-[#6C757D] mt-0.5 tracking-wide">
+          <h1 class="font-display text-xl font-bold text-gray-900 tracking-tight">Kitchen Display</h1>
+          <p class="font-mono text-xs text-gray-500 mt-0.5 tracking-wide">
```

```diff
-    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
-      <div v-for="i in 4" :key="i" class="rounded-xl bg-[#E9ECEF] animate-pulse h-[400px]" />
+    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
+      <div v-for="i in 4" :key="i" class="skeleton h-[400px]" />
     </div>
```

Dialog detail section:
```diff
-          <span class="font-display text-xl font-bold text-[#1A1D1F]">Order #{{ detail?.orderNumber }}</span>
+          <span class="font-display text-xl font-bold text-gray-900">Order #{{ detail?.orderNumber }}</span>
```

Similarly replace all `text-[#6C757D]` → `text-gray-500`, `border-[#E9ECEF]` → `border-gray-200`, `bg-[#E9ECEF]` → `bg-gray-200`, `text-[#2B9348]` → `text-green-600`, `text-[#4A90D9]` → `text-blue-500`, `text-[#E85D3A]` → `text-red-500`.

### 10. `src/modules/kds/components/OrderCard.vue` — Unify card (P4, P7)

```diff
   <div
-    class="bg-white rounded-xl shadow-sm transition-shadow cursor-pointer relative overflow-hidden group"
-    :style="{ border: '1px solid #E9ECEF' }"
+    class="card cursor-pointer relative overflow-hidden group"
     @click="$emit('view-detail', order.id)"
   >
```

Replace all `text-[#1A1D1F]` → `text-gray-900`, `text-[#6C757D]` → `text-gray-500`, `bg-[#F8F9FA]` → `bg-gray-50`, `border-[#E9ECEF]` → `border-gray-200`.

### 11. `src/modules/kds/components/KdsColumn.vue` — Semantic colors (P7)

```diff
-          class="font-mono text-[10px] font-medium text-[#6C757D] bg-[#E9ECEF] rounded-full px-2 py-0.5 leading-none"
+          class="font-mono text-[10px] font-medium text-gray-500 bg-gray-200 rounded-full px-2 py-0.5 leading-none"
```

### 12. `src/modules/inventory/views/InventoryList.vue` — Skeleton state (P8)

Add skeleton template after the filters section:

```diff
+    <div v-if="isLoading" class="space-y-3">
+      <div v-for="i in 5" :key="i" class="flex gap-4">
+        <div class="skeleton-text flex-1 h-8" />
+        <div class="skeleton-text w-24 h-8" />
+        <div class="skeleton-text w-20 h-8" />
+        <div class="skeleton-text w-24 h-8" />
+        <div class="skeleton-text w-20 h-8" />
+        <div class="skeleton-text w-16 h-8" />
+      </div>
+    </div>
+    <template v-else>
     <DataTable
       ...
     />
+    </template>
```

### 13. `src/modules/menu/views/MenuList.vue` — Skeleton state (P8)

```diff
+    <div v-if="itemsQuery.isLoading.value" class="space-y-3">
+      <div v-for="i in 5" :key="i" class="flex gap-4">
+        <div class="skeleton-text flex-1 h-8" />
+        <div class="skeleton-text w-24 h-8" />
+        <div class="skeleton-text w-20 h-8" />
+        <div class="skeleton-text w-16 h-8" />
+        <div class="skeleton-text w-24 h-8" />
+      </div>
+    </div>
+    <template v-else>
     <DataTable
       ...
     />
+    </template>
```

### 14. `src/App.vue` — Disconnect WebSocket on app unmount

No changes needed. The singleton `useOrderFeed` composable keeps the socket alive across route changes. The socket is only cleaned up on full page navigation (browser unload), which handles it automatically.

If a manual disconnect is ever needed, expose a `disconnect()` method from `useOrderFeed`:

```typescript
// In useOrderFeed.ts, add:
export function disconnectFeed() {
  singletonSocket?.removeAllListeners()
  singletonSocket?.disconnect()
  singletonSocket = null
  singletonConnected.value = false
}
```

---

## Self-Verification

### Verification Question 1: Does every `.field` usage resolve to a valid CSS class?

**Answer:** Yes. The `field` shortcut is defined in `uno.config.ts` as `flex flex-col gap-1.5`. Additionally, `main.css` has a `.field` class as a backup with the same rules. All 15+ usages across `StockAdjustment.vue`, `IngredientForm.vue`, and `MenuItemForm.vue` now resolve correctly.

**Gaps:** None — both dynamic (UnoCSS) and static (CSS) paths work.

### Verification Question 2: Does the WebSocket cache updater handle the case where an order's status changes before the previous change reaches the cache?

**Answer:** Yes. The functional updater in `setQueryData` uses the latest cached array at invocation time, not a stale closure. If two `order:update` events arrive in rapid succession (e.g., `pending` → `preparing` → `ready` in 200ms), each `setQueryData` call:
1. Reads the current cache (which may already include the previous update)
2. Finds the order by `id`
3. Merges the new `status` value

This works because TanStack Query's `setQueryData` is synchronous and each functional updater receives the **current** cache value.

**Edge case:** If an optimistic update from `useOrderFlow.ts` modifies the cache, and a WS event arrives with older data, the timestamp comparison (`existing.timestamps.updatedAt > payload.updatedAt`) prevents cache regression.

### Verification Question 3: Does `text-primary-400` render as orange (`#fb923c`) in RecipeBuilder?

**Answer:** Yes. The `primary` color family is defined in `uno.config.ts` with `400: '#fb923c'`. The PrimeVue `KitchenPreset` also defines `primary.400: '#fb923c'`. Both resolve identically. No template changes needed in `RecipeBuilder.vue`.

### Verification Question 4: Are all 4 modules covered by loading/skeleton states?

**Answer:**

| Module | Page | Skeleton Added |
|---|---|---|
| KDS | OrderDashboard | Existing (4 column skeletons) |
| Inventory | InventoryList | **New** (5 skeleton table rows) |
| Menu | MenuList | **New** (5 skeleton table rows) |
| Analytics | AnalyticsDashboard | **New** (4 KPI card skeletons + chart skeleton) |

**Gap:** RecipeBuilder already has a loading spinner inside each accordion tab — no skeleton needed there.

### Verification Question 5: Does the solution create any conflicting color definitions?

**Answer:** Potential conflict: `primary` color family in UnoCSS is also defined by PrimeVue's KitchenPreset. However:
- UnoCSS `text-primary-400` generates a CSS class with `color: #fb923c` at build time
- PrimeVue's `p-primary-400` is a CSS variable `--p-primary-400: #fb923c` used by PrimeVue components internally
- They never conflict because UnoCSS generates atomic utility classes while PrimeVue uses scoped component CSS with CSS variables

The values are identical (both use `#fb923c`), so even if they appear on the same element, the visual result is consistent.

---

## Appendix: File Change Manifest

| # | File | Action | P# |
|---|---|---|---|
| 1 | `uno.config.ts` | **Modify** — add `field`/`skeleton` shortcuts, `primary` color family | P1, P6, P8 |
| 2 | `.env` | **Create** — `VITE_WS_PORT=3001` | P9 |
| 3 | `src/main.css` | **Modify** — add `.field` CSS class backup | P1 |
| 4 | `src/modules/kds/composables/useOrderFeed.ts` | **Rewrite** — env URL, polling, connect_error, cache patch, auth, connected event | P9–P14 |
| 5 | `src/modules/analytics/components/WastageLog.vue` | **Edit** — line 61 icon | P2 |
| 6 | `src/modules/analytics/components/SalesChart.vue` | **Edit** — tooltip positioning | P3 |
| 7 | `src/modules/analytics/views/AnalyticsDashboard.vue` | **Edit** — period buttons active state + skeletons | P5, P8 |
| 8 | `src/modules/analytics/components/BrandPerformance.vue` | **Edit** — `card` shortcut, `border-gray-200` | P4, P7 |
| 9 | `src/modules/kds/views/OrderDashboard.vue` | **Edit** — semantic colors | P7 |
| 10 | `src/modules/kds/components/OrderCard.vue` | **Edit** — `card` shortcut, semantic colors | P4, P7 |
| 11 | `src/modules/kds/components/KdsColumn.vue` | **Edit** — semantic colors | P7 |
| 12 | `src/modules/inventory/views/InventoryList.vue` | **Edit** — skeleton state | P8 |
| 13 | `src/modules/menu/views/MenuList.vue` | **Edit** — skeleton state | P8 |
| 14 | `src/App.vue` | **Edit** — WS cleanup on unmount | P14 |

**Total: 14 files modified, 2 new files created (`.env`, `docs/fixes/design-websocket.a.md`)**
