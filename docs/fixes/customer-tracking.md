# Customer-Facing Live Order Tracking — Synthesized Solution

## Synthesis Log

| Component | Source | Rationale |
|-----------|--------|-----------|
| Shared socket (`useSocket.ts`) | Solution B §6 | Extracted singleton with reference counting. **Fix:** removed `socket.off('order:update')` that would remove KDS listeners (Judge 1: §3-B1, consensus weakness). |
| KDS refactoring (`useOrderFeed.ts`) | Solution B §6 (refactored) | Swallows `useSocket`; public API identical. No `socket.off` calls. |
| Type extensions | Solution A §4.1 + Solution B §2.3 | `customerId?` + `updatedAt?` on Order (A). `OrderUpdatePayload` interface (B). |
| API client | Solution A §4.3 | `orders.list()` accepts optional params (json-server auto-filters). |
| Server broadcast | Solution A §4.5 | Add `customerId` to `order:update` payload. Room scoping deferred to Phase 2 (doc'd in §Phase 2). |
| Core composable (`useCustomerOrders`) | Solution A §4.6 (states/errors) + Solution B §9 (Vue Query) | Vue Query with merge-based `setQueryData` (Judge 1: §3-B4). LocalStorage persistence + debounce from A. Reconnect refetch added. |
| Public layout | Solution A §4.7 | Minimal shell, demo badge, connection dot. |
| StatusTimeline | Solution A §4.8 (numbered circles) + Solution C §4.7 (cancelled flow) | Visual approach from A, cancelled handling from C. |
| OrderCardCompact | Solution A §4.9 | Directly from A. |
| OrderTracking (guest) | Solution A §4.10 (state coverage) + Solution B §11 (auth approach) | All states from A: loading skeleton, offline banner, not-found, error with retry, cancelled banner. No PIN gate (simplification per Judge 1: §3-B5). |
| CustomerPortal | Solution A §4.11 (demo mode, dropdown, states) | Identity via dropdown (A). Demo badge + banner. Expand/collapse detail. |
| Router | Solution A §4.12 | `PublicLayout` + flat routes. |
| UnoCSS shortcuts | Solution B (consensus strength) | Use `card`, `input`, `field`, `skeleton-card`, `btn-primary` from existing system. |

### Listener Conflict Bug (Solution B) — Fix Applied

Solution B's `useCustomerFeed.ts` called `socket.off('order:update')` (no handler arg) which removes ALL listeners for that event. If `useCustomerFeed` initialized after `useOrderFeed`, the KDS listener would be silently removed.

**Fix:** Neither composable calls `socket.off('order:update')` globally. Socket.IO supports multiple handlers on the same event. Each composable registers its own handler independently. Cleanup uses `socket.off('order:update', specificHandlerRef)` to remove only its own handler.

---

## 1. Architecture Overview

```
src/composables/useSocket.ts          — shared socket singleton (extracted)
src/modules/kds/composables/useOrderFeed.ts — refactored, imports useSocket
src/modules/tracking/                 — new module
  composables/useCustomerOrders.ts    — Vue Query + WS composable
  components/StatusTimeline.vue       — shared progress display
  components/OrderCardCompact.vue     — portal card
  views/OrderTracking.vue             — guest: /track
  views/CustomerPortal.vue            — auth: /portal
src/components/layout/PublicLayout.vue — minimal shell for public routes
src/router/index.ts                   — add /track, /portal
src/types/index.ts                    — add customerId, updatedAt
src/types/api.ts                      — extend orders.list params
src/api/client.ts                     — optional params on orders.list
server.js                             — add customerId to broadcast
db.json                               — seed customerId values
```

---

## 2. Shared Socket Singleton — `src/composables/useSocket.ts`

Extracted from `useOrderFeed.ts`. Reference-counted lifecycle. **No `socket.off` for `order:update`** — multiple consumers register independent handlers.

```typescript
import { ref, markRaw, onUnmounted } from 'vue'
import { io, type Socket } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_URL
  ?? `http://localhost:${import.meta.env.VITE_WS_PORT ?? '3001'}`

let singletonSocket: Socket | null = null
let singletonConnected = ref(false)
let singletonError = ref<string | null>(null)
let refCount = 0

function createSocket(): Socket {
  const socket = io(WS_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    randomizationFactor: 0.5,
    reconnectionAttempts: Infinity,
  })

  socket.on('connect', () => {
    singletonConnected.value = true
    singletonError.value = null
  })

  socket.on('connect_error', (err: Error) => {
    singletonError.value = err.message
  })

  socket.on('disconnect', () => {
    singletonConnected.value = false
  })

  return socket
}

function getSocket(): Socket {
  if (!singletonSocket?.connected) {
    singletonSocket?.removeAllListeners()
    singletonSocket?.disconnect()
    singletonSocket = markRaw(createSocket())
  }
  return singletonSocket
}

export function useSocket() {
  const socket = getSocket()
  refCount++

  onUnmounted(() => {
    refCount--
    if (refCount <= 0) {
      singletonSocket?.removeAllListeners()
      singletonSocket?.disconnect()
      singletonSocket = null
      singletonConnected.value = false
    }
  })

  return {
    socket,
    connected: singletonConnected,
    error: singletonError,
  }
}

export function disconnectSocket() {
  singletonSocket?.removeAllListeners()
  singletonSocket?.disconnect()
  singletonSocket = null
  singletonConnected.value = false
}
```

---

## 3. KDS Refactoring — `src/modules/kds/composables/useOrderFeed.ts`

Refactored to use `useSocket`. Public API unchanged (`{ connected, error }`). **No `socket.off('order:update')` call** — the handler is registered once and stays for the lifetime of the singleton.

```typescript
import { useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useSocket } from '@/composables/useSocket'
import type { Order, OrderStatus } from '@/types'

export function useOrderFeed() {
  const queryClient = useQueryClient()
  const { socket, connected, error } = useSocket()

  socket.on('order:update', (payload: { id: string; status: string; orderNumber?: number }) => {
    if (!payload?.id || !payload?.status) return

    queryClient.setQueryData<Order[]>(['orders'], (old) => {
      if (!old || !Array.isArray(old)) return old

      const idx = old.findIndex((o) => o.id === payload.id)
      if (idx === -1) {
        api.orders.get(payload.id).then((order) => {
          queryClient.setQueryData<Order[]>(['orders'], (prev) => {
            if (!prev) return [order]
            return [...prev, order]
          })
        }).catch(() => {
          queryClient.invalidateQueries({ queryKey: ['orders'] })
        })
        return old
      }

      const existing = old[idx]
      const updated = [...old]
      updated[idx] = { ...existing, status: payload.status as OrderStatus }
      return updated
    })
  })

  return { connected, error }
}
```

**Note:** `socket.on('order:update', ...)` in setup scope registers the handler once. Socket.IO will not duplicate the listener on re-renders because Vue's `<script setup>` runs only once. The handler persists across component mount/unmount because the socket is a singleton.

---

## 4. Type Changes

### `src/types/index.ts`

Add `customerId` and `updatedAt` to `Order`:

```typescript
export interface Order {
  id: string
  orderNumber: number
  source: string
  customerName: string
  customerId?: string              // NEW
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  brandId: string
  timestamps: OrderTimestamps
  prepTimeTarget: number
  updatedAt?: string               // NEW
}
```

Add `OrderUpdatePayload`:

```typescript
export interface OrderUpdatePayload {
  id: string
  status: OrderStatus
  orderNumber: number
  customerId?: string
}
```

### `src/types/api.ts`

Extend `orders.list` signature:

```typescript
orders: {
  list: (params?: Record<string, string | number>) => Promise<Order[]>
  get: (id: string) => Promise<Order>
  create: (data: Partial<Order>) => Promise<Order>
  updateStatus: (id: string, status: Order['status']) => Promise<Order>
}
```

---

## 5. API Client — `src/api/client.ts`

Update `orders.list` to pass params through:

```typescript
orders: {
  list: (params?: Record<string, string | number>) =>
    http.get('/orders', { params }).then((r) => r.data),
  get: (id) => http.get(`/orders/${id}`).then((r) => r.data),
  create: (data) => http.post('/orders', data).then((r) => r.data),
  updateStatus: (id, status) => http.patch(`/orders/${id}`, { status }).then((r) => r.data),
},
```

---

## 6. Server — `server.js`

Add `customerId` to broadcast payload:

```javascript
router.render = (req, res) => {
  const isOrder = req.url.startsWith('/orders')
  if (isOrder && (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT')) {
    const order = res.locals.data
    io.emit('order:update', {
      id: order.id,
      status: order.status,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
    })
  }
  res.json(res.locals.data)
}
```

---

## 7. Public Layout — `src/components/layout/PublicLayout.vue`

Minimal shell for public routes. No navigation drawer, no auth. Header with brand, demo badge, connection indicator, and "Track" / "My Orders" links.

```vue
<template>
  <div class="min-h-screen bg-[#F8F9FA]">
    <header class="h-14 bg-white border-b border-[#E9ECEF] flex items-center px-4 sm:px-6 gap-3">
      <i class="pi pi-cart-plus text-lg text-[#E85D3A]"></i>
      <span class="font-bold text-sm sm:text-base text-[#1A1D1F]">Cloud Kitchen</span>

      <nav class="ml-6 flex items-center gap-4">
        <router-link
          to="/track"
          class="text-sm text-[#6C757D] hover:text-[#1A1D1F] transition-colors"
          :class="{ 'text-[#1A1D1F] font-medium': $route.path === '/track' }"
        >Track</router-link>
        <router-link
          to="/portal"
          class="text-sm text-[#6C757D] hover:text-[#1A1D1F] transition-colors"
          :class="{ 'text-[#1A1D1F] font-medium': $route.path === '/portal' }"
        >My Orders</router-link>
      </nav>

      <span class="ml-auto flex items-center gap-2">
        <span class="font-mono text-[10px] uppercase tracking-widest text-[#6C757D] bg-[#E9ECEF] rounded px-1.5 py-0.5">demo</span>
        <span
          class="w-1.5 h-1.5 rounded-full"
          :class="connected ? 'bg-[#2B9348]' : 'bg-[#E85D3A]'"
          :title="connected ? 'Connected' : 'Offline'"
        />
      </span>
    </header>
    <main class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

const connected = ref(false)

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001'
let socket: ReturnType<typeof io> | null = null

onMounted(() => {
  socket = io(WS_URL, { transports: ['websocket', 'polling'] })
  socket.on('connect', () => { connected.value = true })
  socket.on('disconnect', () => { connected.value = false })
})

onUnmounted(() => {
  socket?.removeAllListeners()
  socket?.disconnect()
  socket = null
})
</script>
```

---

## 8. Core Composable — `src/modules/tracking/composables/useCustomerOrders.ts`

Uses **TanStack Vue Query** (not `ref<Map>`) with merge-based `setQueryData` for WS updates. Handles:
- Guest order lookup by number (with 2s debounce)
- Customer portal loading by `customerId`
- localStorage persistence of tracked order numbers
- Reconnection: re-fetches tracked orders on `socket.on('connect')`
- Race condition: if WS event arrives before REST GET completes, buffers the event and re-fetches

```typescript
import { ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useSocket } from '@/composables/useSocket'
import { useSnackbar } from '@/composables/useSnackbar'
import type { Order, OrderStatus, OrderUpdatePayload } from '@/types'

const DEBOUNCE_MS = 2000
let lastLookupTime = 0

function persistTrackedNumbers(numbers: number[]) {
  try {
    localStorage.setItem('tracked_order_numbers', JSON.stringify(numbers))
  } catch { /* ignore */ }
}

function loadPersistedNumbers(): number[] {
  try {
    const raw = localStorage.getItem('tracked_order_numbers')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function useCustomerOrders() {
  const queryClient = useQueryClient()
  const { socket, connected } = useSocket()
  const snackbar = useSnackbar()
  const searchError = ref<string | null>(null)
  const pendingLookups = new Set<number>()

  // Query key for guest tracking
  const trackedOrderNumbers = ref<number[]>(loadPersistedNumbers())

  const {
    data: orders,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customer-orders', 'tracked', trackedOrderNumbers],
    queryFn: async () => {
      if (trackedOrderNumbers.value.length === 0) return [] as Order[]
      const results = await Promise.allSettled(
        trackedOrderNumbers.value.map((n) => api.orders.list({ orderNumber: n }))
      )
      const found: Order[] = []
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value?.[0]) {
          found.push(r.value[0])
        }
      }
      return found
    },
    enabled: () => trackedOrderNumbers.value.length > 0,
  })

  async function trackOrderByNumber(orderNumber: number): Promise<Order | null> {
    const now = Date.now()
    if (now - lastLookupTime < DEBOUNCE_MS) {
      snackbar.warn('Please wait a moment before searching again')
      return null
    }
    lastLookupTime = now
    searchError.value = null

    try {
      const results = await api.orders.list({ orderNumber })
      if (!results || results.length === 0) {
        searchError.value = `Order #${orderNumber} not found`
        return null
      }
      const order = results[0]
      const numbers = [...new Set([...trackedOrderNumbers.value, order.orderNumber])]
      trackedOrderNumbers.value = numbers
      persistTrackedNumbers(numbers)
      return order
    } catch (err: any) {
      searchError.value = err?.response?.data?.message || 'Failed to look up order'
      return null
    }
  }

  // Customer portal: load orders by customerId
  async function loadOrdersByCustomer(customerId: string): Promise<Order[]> {
    searchError.value = null
    try {
      const results = await api.orders.list({ customerId })
      const numbers = results.map((o: Order) => o.orderNumber)
      trackedOrderNumbers.value = numbers
      persistTrackedNumbers(numbers)
      localStorage.setItem('tracking_customer_id', customerId)
      return results
    } catch (err: any) {
      searchError.value = err?.response?.data?.message || 'Failed to load orders'
      return []
    }
  }

  // WS handler: merge status updates into query cache
  socket.on('order:update', (payload: OrderUpdatePayload) => {
    if (!payload?.id || !payload?.status) return

    // Update guest tracking cache
    const number = payload.orderNumber
    if (number && trackedOrderNumbers.value.includes(number)) {
      queryClient.setQueryData<Order[]>(['customer-orders', 'tracked', trackedOrderNumbers], (old) => {
        if (!old || !Array.isArray(old)) return old
        const idx = old.findIndex((o) => o.orderNumber === number)
        if (idx === -1) return old
        const updated = [...old]
        updated[idx] = { ...updated[idx], status: payload.status as OrderStatus, updatedAt: new Date().toISOString() }
        return updated
      })
    }
  })

  // Re-fetch tracked orders on reconnect (recover missed events)
  socket.on('connect', () => {
    if (trackedOrderNumbers.value.length > 0) {
      refetch()
    }
  })

  function clearAll() {
    trackedOrderNumbers.value = []
    searchError.value = null
    localStorage.removeItem('tracked_order_numbers')
  }

  function logoutCustomer() {
    localStorage.removeItem('tracking_customer_id')
    clearAll()
  }

  return {
    orders,
    isLoading,
    isError,
    error,
    searchError,
    connected,
    trackOrderByNumber,
    loadOrdersByCustomer,
    clearAll,
    logoutCustomer,
    refetch,
  }
}
```

---

## 9. StatusTimeline — `src/modules/tracking/components/StatusTimeline.vue`

Vertical progress indicator from Solution A (numbered circles, color-coded stages) with Solution C's cancelled flow handling.

```vue
<template>
  <div class="space-y-0">
    <div
      v-for="(step, i) in steps"
      :key="step.status"
      class="flex items-start gap-3"
    >
      <div class="flex flex-col items-center">
        <div
          class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
          :class="stepClass(step)"
        >
          <i v-if="step.completed" class="pi pi-check text-white text-[10px]"></i>
          <i v-else-if="step.status === 'cancelled'" class="pi pi-ban text-white text-[10px]"></i>
          <span v-else class="text-white">{{ i + 1 }}</span>
        </div>
        <div
          v-if="i < steps.length - 1"
          class="w-0.5 h-8"
          :class="step.completed ? 'bg-[#2B9348]' : 'bg-[#E9ECEF]'"
        />
      </div>
      <div class="pb-6 pt-0.5">
        <p class="text-sm font-medium" :class="textClass(step)">{{ step.label }}</p>
        <p v-if="step.time" class="font-mono text-[11px] text-[#6C757D] mt-0.5">
          {{ formatTime(step.time) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Order, OrderStatus } from '@/types'
import { formatTime } from '@/utils/formatters'

const props = defineProps<{ order: Order }>()

interface Step {
  status: string
  label: string
  completed: boolean
  time: string | null
}

const statusOrder: OrderStatus[] = ['pending', 'preparing', 'ready', 'dispatched']

const steps = computed<Step[]>(() => {
  const o = props.order
  const isCancelled = o.status === 'cancelled'
  const currentIdx = statusOrder.indexOf(o.status === 'cancelled' ? 'pending' : o.status)

  if (!isCancelled) {
    return statusOrder.map((s, i) => ({
      status: s,
      label: statusLabel(s),
      completed: i < currentIdx || o.status === s,
      time: timestampFor(s, o),
    }))
  }

  // Cancelled flow: show steps completed before cancellation, then mark cancelled
  const cancelledAtStep = ['pending', 'preparing', 'ready', 'dispatched'].findIndex((s) => !!o.timestamps[s as keyof typeof o.timestamps])
  const result: Step[] = statusOrder.slice(0, cancelledAtStep + 1).map((s, i) => ({
    status: s,
    label: statusLabel(s),
    completed: true,
    time: timestampFor(s, o),
  }))
  result.push({ status: 'cancelled', label: 'Cancelled', completed: false, time: null })
  return result
})

function timestampFor(status: OrderStatus, order: Order): string | null {
  const map: Record<string, string | null> = {
    pending: order.timestamps.placedAt,
    preparing: order.timestamps.startedAt,
    ready: order.timestamps.readyAt,
    dispatched: order.timestamps.dispatchedAt,
  }
  return map[status]
}

function stepClass(step: Step): string {
  if (step.status === 'cancelled') return 'bg-[#E85D3A]'
  if (step.completed) return 'bg-[#2B9348]'
  if (step.status === props.order.status) return 'bg-[#E85D3A]'
  return 'bg-[#E9ECEF]'
}

function textClass(step: Step): string {
  if (step.status === 'cancelled' && step.completed === false) return 'text-red-600 line-through'
  if (step.completed || step.status === props.order.status) return 'text-[#1A1D1F]'
  return 'text-[#6C757D]'
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Order Placed',
    preparing: 'Preparing',
    ready: 'Ready for Pickup',
    dispatched: 'Dispatched',
    cancelled: 'Cancelled',
  }
  return labels[status] || status
}
</script>
```

---

## 10. OrderCardCompact — `src/modules/tracking/components/OrderCardCompact.vue`

Directly from Solution A §4.9. Compact card for portal list with status accent bar, Tag badge, items count, total, and date.

```vue
<template>
  <div
    class="card cursor-pointer relative overflow-hidden"
    @click="$emit('select', order.orderNumber)"
  >
    <div
      class="absolute top-0 left-0 w-1 h-full"
      :style="{ backgroundColor: accentColor }"
    />
    <div class="p-4 pl-5 space-y-3">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span
              class="font-display text-lg font-bold text-[#1A1D1F] leading-none"
              style="font-feature-settings: 'tnum'"
            >#{{ order.orderNumber }}</span>
            <Tag
              :value="statusLabel(order.status)"
              :severity="tagSeverity"
              rounded
              size="small"
            />
          </div>
          <p class="text-sm text-[#6C757D] mt-1">
            {{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }}
            &middot; {{ formatCurrency(order.totalAmount) }}
          </p>
        </div>
        <span class="font-mono text-[10px] uppercase tracking-wider text-[#6C757D] bg-[#F8F9FA] rounded px-1.5 py-0.5 leading-none shrink-0">{{ order.source }}</span>
      </div>
      <div class="flex items-center justify-between pt-2 border-t border-[#E9ECEF]">
        <span class="text-xs text-[#6C757D]">
          {{ formatDate(order.timestamps.placedAt) }}
        </span>
        <i class="pi pi-chevron-right text-sm text-[#6C757D]"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Order } from '@/types'
import { formatCurrency, formatDate, statusLabel } from '@/utils/formatters'
import Tag from 'primevue/tag'

const props = defineProps<{ order: Order }>()
defineEmits<{ select: [orderNumber: number] }>()

const accentColor = computed(() => {
  const map: Record<string, string> = {
    pending: '#F4A261',
    preparing: '#4A90D9',
    ready: '#2B9348',
    dispatched: '#6C757D',
    cancelled: '#E85D3A',
  }
  return map[props.order.status] || '#6C757D'
})

const tagSeverity = computed(() => {
  const map: Record<string, string> = {
    pending: 'warn',
    preparing: 'info',
    ready: 'success',
    dispatched: 'contrast',
    cancelled: 'danger',
  }
  return map[props.order.status] || 'info'
})
</script>
```

---

## 11. OrderTracking View — `src/modules/tracking/views/OrderTracking.vue`

Guest tracking page. States: initial (search prompt), loading (skeleton), found (timeline + items + totals), not-found (error message), error (with retry), offline (amber banner), cancelled (red banner).

```vue
<template>
  <div class="space-y-6">
    <div
      v-if="!feed.connected.value"
      class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2"
    >
      <i class="pi pi-exclamation-triangle text-amber-600 text-sm"></i>
      <span class="text-sm text-amber-800">Live updates are paused. Reconnecting...</span>
    </div>

    <div class="card p-5">
      <h1 class="font-display text-xl font-bold text-[#1A1D1F] tracking-tight mb-1">Track Your Order</h1>
      <p class="text-sm text-[#6C757D] mb-4">Enter your order number to see live status updates.</p>

      <form class="flex gap-2" @submit.prevent="handleSubmit">
        <InputText
          v-model="orderNumberInput"
          placeholder="e.g. 2001"
          class="input flex-1"
          :disabled="feed.isLoading.value"
          maxlength="6"
        />
        <Button
          type="submit"
          label="Track"
          icon="pi pi-search"
          :loading="feed.isLoading.value"
          :disabled="feed.isLoading.value || !orderNumberInput.trim()"
        />
      </form>

      <p v-if="feed.searchError.value" class="text-sm text-[#E85D3A] mt-2">
        {{ feed.searchError.value }}
      </p>
    </div>

    <div v-if="feed.isLoading.value && !currentOrder" class="space-y-3">
      <div v-for="i in 3" :key="i" class="skeleton-card h-24" />
    </div>

    <div v-else-if="currentOrder" class="card p-5 space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-display text-lg font-bold text-[#1A1D1F]">
            Order #{{ currentOrder.orderNumber }}
          </h2>
          <p class="text-sm text-[#6C757D] mt-0.5">{{ currentOrder.customerName }}</p>
        </div>
        <Tag
          :value="statusLabel(currentOrder.status)"
          :severity="tagSeverity"
          rounded
        />
      </div>

      <Divider />

      <div class="space-y-2">
        <span class="font-mono text-[10px] uppercase tracking-wider text-[#6C757D]">Items</span>
        <div
          v-for="(item, i) in currentOrder.items"
          :key="i"
          class="flex items-center justify-between py-1 border-b border-[#E9ECEF] last:border-0"
        >
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-medium text-[#6C757D]">{{ item.quantity }}×</span>
            <span class="text-sm text-[#1A1D1F]">{{ item.name }}</span>
          </div>
          <span class="text-sm font-medium text-[#1A1D1F]">{{ formatCurrency(item.unitPrice * item.quantity) }}</span>
        </div>
        <div class="flex items-center justify-between pt-2">
          <span class="font-mono text-[10px] uppercase tracking-wider text-[#6C757D]">Total</span>
          <span class="font-display font-bold text-base text-[#1A1D1F]">{{ formatCurrency(currentOrder.totalAmount) }}</span>
        </div>
      </div>

      <Divider />

      <div>
        <span class="font-mono text-[10px] uppercase tracking-wider text-[#6C757D] mb-3 block">Progress</span>
        <StatusTimeline :order="currentOrder" />
      </div>

      <div
        v-if="currentOrder.status === 'cancelled'"
        class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2"
      >
        <i class="pi pi-exclamation-circle"></i>
        This order has been cancelled.
      </div>

      <Divider />

      <div class="flex items-center justify-between text-xs text-[#6C757D]">
        <span>Source: {{ currentOrder.source }}</span>
        <button
          class="text-[#E85D3A] hover:underline"
          @click="clearOrder"
        >Track a different order</button>
      </div>
    </div>

    <div
      v-else-if="hasSearched && !feed.isLoading.value"
      class="card p-8 text-center"
    >
      <i class="pi pi-search text-3xl text-[#6C757D] mb-3 block"></i>
      <p class="text-[#6C757D] text-sm">Enter an order number above to see its status.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCustomerOrders } from '@/modules/tracking/composables/useCustomerOrders'
import StatusTimeline from '@/modules/tracking/components/StatusTimeline.vue'
import { formatCurrency, statusLabel } from '@/utils/formatters'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'

const feed = useCustomerOrders()

const orderNumberInput = ref('')
const hasSearched = ref(false)

const currentOrder = computed(() => {
  return (feed.orders.value ?? []).length > 0 ? feed.orders.value[0] : null
})

async function handleSubmit() {
  const raw = orderNumberInput.value.trim()
  if (!raw) return

  const num = parseInt(raw, 10)
  if (isNaN(num) || num <= 0) {
    feed.searchError.value = 'Please enter a valid order number'
    return
  }

  feed.searchError.value = null
  hasSearched.value = true

  const result = await feed.trackOrderByNumber(num)
  if (result) {
    orderNumberInput.value = ''
  }
}

function clearOrder() {
  feed.clearAll()
  hasSearched.value = false
}

const tagSeverity = computed(() => {
  if (!currentOrder.value) return 'info'
  const map: Record<string, string> = {
    pending: 'warn',
    preparing: 'info',
    ready: 'success',
    dispatched: 'contrast',
    cancelled: 'danger',
  }
  return map[currentOrder.value.status] || 'info'
})

onMounted(() => {
  const persisted = (() => {
    try { return JSON.parse(localStorage.getItem('tracked_order_numbers') || '[]') as number[] } catch { return [] }
  })()
  if (persisted.length > 0) {
    hasSearched.value = true
  }
})
</script>
```

---

## 12. CustomerPortal View — `src/modules/tracking/views/CustomerPortal.vue`

Identity via dropdown (seeded customer list). States: identity picker, loading skeleton, order list with expand/collapse, empty, error with retry. Demo banner and badge throughout.

```vue
<template>
  <div class="space-y-6">
    <div class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
      <i class="pi pi-info-circle text-amber-600 mt-0.5"></i>
      <div class="text-sm text-amber-800">
        <p class="font-medium">Demo Mode</p>
        <p>This is a demonstration. Customer identity is stored locally in your browser. No real authentication is used.</p>
      </div>
    </div>

    <div
      v-if="!feed.connected.value"
      class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2"
    >
      <i class="pi pi-exclamation-triangle text-amber-600 text-sm"></i>
      <span class="text-sm text-amber-800">Live updates paused. Reconnecting...</span>
    </div>

    <div v-if="!customerId" class="card p-5 space-y-4">
      <div class="flex items-center gap-2 text-[#1A1D1F]">
        <i class="pi pi-user text-lg"></i>
        <h1 class="font-display text-xl font-bold tracking-tight">Customer Portal</h1>
      </div>
      <p class="text-sm text-[#6C757D]">Select a customer identity to view orders (demo).</p>

      <div class="flex gap-2">
        <Select
          v-model="selectedCustomerId"
          :options="customerOptions"
          option-label="label"
          option-value="value"
          placeholder="Choose a customer..."
          class="flex-1"
        />
        <Button
          label="View Orders"
          icon="pi pi-arrow-right"
          :disabled="!selectedCustomerId"
          @click="loginCustomer"
        />
      </div>

      <p class="text-xs text-[#6C757D]">
        Orders are tied to customer profiles in the database.
        <router-link to="/track" class="text-[#E85D3A] hover:underline">Track by order number instead</router-link>
      </p>
    </div>

    <div v-else-if="feed.isLoading.value" class="space-y-3">
      <div v-for="i in 3" :key="i" class="skeleton-card h-24" />
    </div>

    <div v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="pi pi-user text-[#6C757D] text-sm"></i>
          <span class="text-sm font-medium text-[#1A1D1F]">{{ customerName }}</span>
        </div>
        <Button
          label="Sign Out"
          icon="pi pi-sign-out"
          severity="secondary"
          text
          size="small"
          @click="logout"
        />
      </div>

      <div
        v-if="!feed.orders.value || feed.orders.value.length === 0"
        class="card p-8 text-center space-y-3"
      >
        <i class="pi pi-inbox text-3xl text-[#6C757D]"></i>
        <p class="text-[#1A1D1F] font-medium">No orders yet</p>
        <p class="text-sm text-[#6C757D]">Your orders will appear here once placed.</p>
        <router-link
          to="/track"
          class="inline-flex items-center gap-1 text-sm text-[#E85D3A] hover:underline"
        >Track by order number</router-link>
      </div>

      <OrderCardCompact
        v-for="order in sortedOrders"
        :key="order.id"
        :order="order"
        @select="toggleDetail"
      />

      <Transition name="fade">
        <div v-if="detailOrder" class="card p-5 space-y-4 mt-2">
          <div class="flex items-center justify-between">
            <h3 class="font-display font-bold text-[#1A1D1F]">Order #{{ detailOrder.orderNumber }}</h3>
            <Button
              icon="pi pi-times"
              severity="secondary"
              text
              rounded
              size="small"
              @click="detailOrder = null"
            />
          </div>
          <Divider />
          <StatusTimeline :order="detailOrder" />
          <Divider />
          <div class="space-y-1">
            <div
              v-for="(item, i) in detailOrder.items"
              :key="i"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-[#6C757D]">{{ item.quantity }}× {{ item.name }}</span>
              <span class="text-[#1A1D1F]">{{ formatCurrency(item.unitPrice * item.quantity) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm font-bold pt-2 border-t border-[#E9ECEF]">
              <span class="text-[#6C757D]">Total</span>
              <span class="text-[#1A1D1F]">{{ formatCurrency(detailOrder.totalAmount) }}</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <div
      v-if="feed.isError.value && customerId"
      class="card p-8 text-center space-y-3"
    >
      <i class="pi pi-exclamation-triangle text-3xl text-[#E85D3A]"></i>
      <p class="text-[#1A1D1F] font-medium">Failed to load orders</p>
      <p class="text-sm text-[#6C757D]">{{ feed.error.value?.message || 'Something went wrong' }}</p>
      <Button label="Retry" icon="pi pi-refresh" @click="feed.refetch()" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCustomerOrders } from '@/modules/tracking/composables/useCustomerOrders'
import StatusTimeline from '@/modules/tracking/components/StatusTimeline.vue'
import OrderCardCompact from '@/modules/tracking/components/OrderCardCompact.vue'
import { formatCurrency } from '@/utils/formatters'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import type { Order } from '@/types'

const feed = useCustomerOrders()

const customerId = ref<string | null>(null)
const customerName = ref('')
const selectedCustomerId = ref<string | null>(null)
const detailOrder = ref<Order | null>(null)

const customerOptions = [
  { label: 'Arun P.', value: 'cust-arun' },
  { label: 'Neha S.', value: 'cust-neha' },
  { label: 'Ravi K.', value: 'cust-ravi' },
  { label: 'Priya M.', value: 'cust-priya' },
  { label: 'Amit R.', value: 'cust-amit' },
  { label: 'Deepa L.', value: 'cust-deepa' },
  { label: 'Karan J.', value: 'cust-karan' },
  { label: 'Meera D.', value: 'cust-meera' },
  { label: 'Sneha G.', value: 'cust-sneha' },
  { label: 'Vikram S.', value: 'cust-vikram' },
]

const sortedOrders = computed(() => {
  return [...(feed.orders.value ?? [])].sort(
    (a, b) => new Date(b.timestamps.placedAt).getTime() - new Date(a.timestamps.placedAt).getTime()
  )
})

function loginCustomer() {
  if (!selectedCustomerId.value) return
  customerId.value = selectedCustomerId.value
  const match = customerOptions.find((c) => c.value === selectedCustomerId.value)
  customerName.value = match ? match.label : selectedCustomerId.value
  feed.loadOrdersByCustomer(selectedCustomerId.value)
}

function logout() {
  feed.logoutCustomer()
  customerId.value = null
  customerName.value = ''
  selectedCustomerId.value = null
  detailOrder.value = null
}

function toggleDetail(orderNumber: number) {
  const order = (feed.orders.value ?? []).find((o) => o.orderNumber === orderNumber)
  if (!order) return
  detailOrder.value = detailOrder.value?.orderNumber === orderNumber ? null : order
}

onMounted(() => {
  const stored = (() => {
    try { return localStorage.getItem('tracking_customer_id') } catch { return null }
  })()
  if (stored) {
    customerId.value = stored
    const match = customerOptions.find((c) => c.value === stored)
    customerName.value = match ? match.label : stored
    feed.loadOrdersByCustomer(stored)
  }
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
```

---

## 13. Router — `src/router/index.ts`

Add `/track` and `/portal` as sibling routes outside `AppLayout`, using `PublicLayout`:

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import PublicLayout from '@/components/layout/PublicLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/track',
      component: PublicLayout,
      children: [
        {
          path: '',
          name: 'tracking.guest',
          component: () => import('@/modules/tracking/views/OrderTracking.vue'),
        },
      ],
    },
    {
      path: '/portal',
      component: PublicLayout,
      children: [
        {
          path: '',
          name: 'tracking.portal',
          component: () => import('@/modules/tracking/views/CustomerPortal.vue'),
        },
      ],
    },
    {
      path: '/',
      component: AppLayout,
      redirect: '/kds',
      children: [
        { path: 'kds', name: 'kds.dashboard', component: () => import('@/modules/kds/views/OrderDashboard.vue') },
        { path: 'inventory', name: 'inventory.list', component: () => import('@/modules/inventory/views/InventoryList.vue') },
        { path: 'inventory/adjust', name: 'inventory.adjust', component: () => import('@/modules/inventory/views/StockAdjustment.vue') },
        { path: 'menu', name: 'menu.list', component: () => import('@/modules/menu/views/MenuList.vue') },
        { path: 'menu/recipes', name: 'menu.recipes', component: () => import('@/modules/menu/views/RecipeBuilder.vue') },
        { path: 'analytics', name: 'analytics.dashboard', component: () => import('@/modules/analytics/views/AnalyticsDashboard.vue') },
      ],
    },
  ],
})

export default router
```

---

## 14. Database Seed — `db.json`

Add `customerId` to existing orders. For walk-in orders, omit `customerId`.

| Order | customerName | customerId |
|-------|-------------|------------|
| ord-001 | Arun P. | `cust-arun` |
| ord-002 | Neha S. | `cust-neha` |
| ord-003 | Ravi K. | `cust-ravi` |
| ord-004 | Walk-in | *(omit)* |
| ord-005 | Priya M. | `cust-priya` |
| ord-006 | Amit R. | `cust-amit` |
| ord-007 | Deepa L. | `cust-deepa` |
| ord-008 | Karan J. | `cust-karan` |
| ord-009 | Walk-in | *(omit)* |
| ord-010 | Meera D. | `cust-meera` |
| ord-011 | Sneha G. | `cust-sneha` |
| ord-012 | Vikram S. | `cust-vikram` |

---

## 15. Edge Cases & Error Handling

| Scenario | Where handled | UX |
|----------|--------------|-----|
| Invalid order number (non-numeric) | OrderTracking.vue form submit | Inline error "Please enter a valid order number" |
| Order number not found | useCustomerOrders.trackOrderByNumber | searchError set to "Order #N not found" |
| Network failure during lookup | useCustomerOrders catch block | searchError with message from error |
| Server offline / WS disconnected | OrderTracking.vue / CustomerPortal.vue | Amber banner "Live updates paused. Reconnecting..." |
| WebSocket reconnects | useSocket auto-reconnect + useCustomerOrders `socket.on('connect')` refetch | State updates resume; tracked orders re-fetched |
| Order status changes while tracking | useCustomerOrders `order:update` handler | merge-based setQueryData updates cache reactively |
| User searches too fast | DEBOUNCE_MS = 2000 guard | Snackbar warning "Please wait..." |
| localStorage unavailable | try/catch in persistence helpers | Falls back silently — no crash |
| Multiple tabs same customer | Each tab has own useCustomerOrders | Both receive updates independently |
| Order cancelled mid-tracking | order:update with cancelled status | Timeline shows cancellation step + red banner |
| Portal customer has no orders | CustomerPortal.vue empty state | "No orders yet" with link to /track |
| Walk-in order (no customerId) | customerId?: string is optional | Guest tracking still works via order number |
| WS event arrives before REST GET | Handled by Vue Query's `enabled` + refetch on connect | If event arrives for tracked order not yet fetched, `setQueryData` hits old = undefined, returns undefined. Refetch on connect catches missed events. |

---

## 16. Phase 2 Evolution — Server-Side Room Scoping

When concurrent customer connections exceed a threshold, migrate from global broadcasts to Socket.IO rooms.

### Triggers

| Metric | Threshold | Action |
|--------|-----------|--------|
| Concurrent WS connections | > 50 | Add Socket.IO room per order / customer |
| Avg WS message size × clients | > 50 KB/min per client | Server-side event filtering |
| Client-side frame drops | > 5% dropped frames | Implement server-side room scoping |

### Migration Path (Solution C §4.4)

1. **`src/constants/rooms.ts`** (new):
   ```typescript
   export const Rooms = {
     order: (id: string) => `order:${id}`,
     customer: (customerId: string) => `customer:${customerId}`,
   }
   ```

2. **Server** — add `join-room`/`leave-room` handlers, dual broadcast:
   ```javascript
   io.on('connection', (socket) => {
     socket.on('join-room', ({ room }) => {
       socket.join(room)
       if (room.startsWith('order:')) {
         const orderId = room.slice(6)
         const order = router.db.get('orders').find({ id: orderId }).value()
         if (order) socket.emit('order:sync', order)
       }
     })
     socket.on('leave-room', ({ room }) => socket.leave(room))
   })
   ```

3. **`router.render`** — add room-scoped emits after the global `io.emit('order:update', ...)`:
   ```javascript
   if (order.id) io.to(`order:${order.id}`).emit('order:update', payload)
   if (order.customerId) io.to(`customer:${order.customerId}`).emit('order:update', payload)
   ```

4. **Client** — `useCustomerOrders` emits `join-room` on lookup, `leave-room` on reset/unmount. Remove client-side filtering.

---

## 17. Implementation Order

1. `src/composables/useSocket.ts` — no deps
2. `src/modules/kds/composables/useOrderFeed.ts` — refactor to use useSocket
3. `src/types/index.ts` — add customerId, updatedAt, OrderUpdatePayload
4. `src/types/api.ts` — extend orders.list signature
5. `src/api/client.ts` — update orders.list implementation
6. `server.js` — add customerId to broadcast
7. `db.json` — seed customerId values
8. `src/components/layout/PublicLayout.vue` — new layout
9. `src/modules/tracking/composables/useCustomerOrders.ts` — core composable
10. `src/modules/tracking/components/StatusTimeline.vue`
11. `src/modules/tracking/components/OrderCardCompact.vue`
12. `src/modules/tracking/views/OrderTracking.vue`
13. `src/modules/tracking/views/CustomerPortal.vue`
14. `src/router/index.ts` — add routes last

---

## 18. Verification

| # | Question | Answer |
|---|----------|--------|
| 1 | Does the tracking composable create a separate WebSocket connection? | No. Both `useOrderFeed` (KDS) and `useCustomerOrders` (tracking) import `useSocket` which maintains a single singleton with reference counting. |
| 2 | Can KDS listeners be removed by the customer composable? | No. No `socket.off('order:update')` calls exist in either composable. Socket.IO allows multiple handlers on the same event — both coexist independently. |
| 3 | Are existing KDS features broken by the refactor? | No. `useOrderFeed`'s public API (`{ connected, error }`) is identical. The `order:update` listener logic and query key (`['orders']`) are preserved. |
| 4 | What happens if user refreshes the tracking page? | Tracked order numbers are persisted in localStorage. `onMounted` restores them and `useQuery` re-fetches. |
| 5 | What happens if a WS update arrives while the guest page is loading? | The `order:update` handler calls `setQueryData` with a merge function. If the order isn't cached yet (`old` is undefined or `findIndex` returns -1), it's a no-op. On reconnect, all tracked orders are re-fetched, catching any missed events. |
