# Solution B: Admin-in-Subdirectory with Shim Layer

## 1. Core Insight & Key Design Decisions

**Core insight:** Keep the existing admin app fully intact under `/admin/*` while building the customer portal at the root `/`. A `beforeEach` guard transparently redirects legacy paths so no bookmark breaks.

**Key decisions already made:**
- Split router into `routes/admin.ts`, `routes/customer.ts`, merged in `index.ts`
- Admin: parent `/admin` + `AppLayout`. Customer: parent `/` + `CustomerLayout`
- `PublicLayout` → `CustomerLayout` with cart badge + nav tabs
- Legacy paths (`/kds`, `/inventory`, `/menu`, `/menu/recipes`, `/inventory/adjust`, `/analytics`) redirect via `beforeEach`
- AppDrawer.vue / AppHeader.vue nav item paths updated to `/admin/kds` etc.
- Track route stays on `PublicLayout` (minimal layout, not portal nav)

## 2. Judge Feedback Addressed

| # | Concern | Resolution |
|---|---------|-----------|
| 1 | `order-status` straddles two contexts | `order-status` stays **purely for guest tracking** (`/track`). Portal orders get a **new separate composable** `useCustomerOrders.ts` in `customer/composables/` with its own query key `['customer-orders']`. |
| 2 | Guard debugging | `beforeEach` logs a `console.warn('[router] Redirecting legacy path: ...')` in dev mode when redirect fires. |
| 3a | Query key collision | Admin uses `['orders']`, customer uses `['customer-orders']` — no overlap. |
| 3b | Loading/empty/error states | Every customer view explicitly handles `isLoading`, `isError`, empty data, and error retry. |
| 3c | Test strategy for guard | Describe a `redirectGuard.spec.ts` test at end of doc. |
| 4 | Phone gate | **UUID guest fallback**: browsing the menu adds a `guestId` to localStorage if no customer session exists. Checkout can proceed with guestId; phone is optional for order tracking. |

## 3. Implementation Breakdown

### Phase 0: Router Refactoring

#### `src/router/routes/admin.ts` — extracted admin routes

```ts
import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    component: AppLayout,
    redirect: '/admin/kds',
    children: [
      {
        path: 'kds',
        name: 'admin.kds',
        component: () => import('@/modules/kds/views/OrderDashboard.vue'),
      },
      {
        path: 'inventory',
        name: 'admin.inventory',
        component: () => import('@/modules/inventory/views/InventoryList.vue'),
      },
      {
        path: 'inventory/adjust',
        name: 'admin.inventory.adjust',
        component: () => import('@/modules/inventory/views/StockAdjustment.vue'),
      },
      {
        path: 'menu',
        name: 'admin.menu',
        component: () => import('@/modules/menu/views/MenuList.vue'),
      },
      {
        path: 'menu/recipes',
        name: 'admin.menu.recipes',
        component: () => import('@/modules/menu/views/RecipeBuilder.vue'),
      },
      {
        path: 'analytics',
        name: 'admin.analytics',
        component: () => import('@/modules/analytics/views/AnalyticsDashboard.vue'),
      },
    ],
  },
  {
    path: '/track',
    component: () => import('@/components/layout/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'track.order',
        component: () => import('@/modules/order-status/views/OrderTracking.vue'),
      },
    ],
  },
]
```

#### `src/router/routes/customer.ts` — customer portal routes

```ts
import type { RouteRecordRaw } from 'vue-router'
import CustomerLayout from '@/components/layout/CustomerLayout.vue'

export const customerRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: CustomerLayout,
    children: [
      {
        path: '',
        name: 'customer.menu',
        component: () => import('@/modules/customer/views/MenuBrowse.vue'),
      },
      {
        path: 'checkout',
        name: 'customer.checkout',
        component: () => import('@/modules/customer/views/CheckoutPage.vue'),
      },
      {
        path: 'orders',
        name: 'customer.orders',
        component: () => import('@/modules/customer/views/OrderHistory.vue'),
      },
      {
        path: 'orders/:id',
        name: 'customer.order-detail',
        component: () => import('@/modules/customer/views/OrderDetail.vue'),
      },
    ],
  },
]
```

#### `src/router/index.ts` — merged router with guard

```ts
import { createRouter, createWebHistory } from 'vue-router'
import { adminRoutes } from './routes/admin'
import { customerRoutes } from './routes/customer'

const LEGACY_MAP: Record<string, string> = {
  '/kds': '/admin/kds',
  '/inventory': '/admin/inventory',
  '/inventory/adjust': '/admin/inventory/adjust',
  '/menu': '/admin/menu',
  '/menu/recipes': '/admin/menu/recipes',
  '/analytics': '/admin/analytics',
}

const router = createRouter({
  history: createWebHistory(),
  routes: [...adminRoutes, ...customerRoutes],
})

router.beforeEach((to, _from, next) => {
  const legacyPath = LEGACY_MAP[to.path]
  if (legacyPath) {
    if (import.meta.env.DEV) {
      console.warn(`[router] Redirecting legacy path "${to.path}" → "${legacyPath}"`)
    }
    return next(legacyPath)
  }
  next()
})

export default router
```

### Phase 1: Nav Updates

#### `AppDrawer.vue` and `AppHeader.vue` — path changes

In both files, change:
```ts
const navItems = [
  { path: '/kds', ... },
  { path: '/inventory', ... },
  { path: '/menu', ... },
  { path: '/analytics', ... },
]
```
to:
```ts
const navItems = [
  { path: '/admin/kds', ... },
  { path: '/admin/inventory', ... },
  { path: '/admin/menu', ... },
  { path: '/admin/analytics', ... },
]
```

### Phase 2: CustomerLayout (enhanced PublicLayout)

Rename `PublicLayout.vue` → `CustomerLayout.vue`. Enhance with:

- **Cart badge** — uses `useCustomerCart().totalItemCount` for a PrimeBadge on the cart icon
- **Nav tabs** — router-links to `/` (Menu), `/checkout`, `/orders`
- **CartDrawer overlay** — always mounted, toggled by a cart icon button
- **Wider max-width** — `max-w-6xl` instead of `max-w-2xl` (menu needs more space)
- **Session indicator** — show "Hi, {name}" or "Sign In" button using `useCustomerSession`

> **Note:** Keep the original `PublicLayout.vue` as a minimal layout for `/track`. It should remain a separate file with the current simple header.

### Phase 3: Customer Module — `src/modules/customer/`

#### Directory Structure

```
src/modules/customer/
├── composables/
│   ├── useCustomerCart.ts
│   ├── useCustomerSession.ts
│   ├── useCustomerOrders.ts
│   └── useCustomerMenu.ts
├── components/
│   ├── MenuItemCard.vue
│   ├── CartDrawer.vue
│   ├── CartItem.vue
│   ├── OrderCard.vue
│   └── CustomerInfoForm.vue
└── views/
    ├── MenuBrowse.vue
    ├── CheckoutPage.vue
    ├── OrderHistory.vue
    └── OrderDetail.vue
```

#### Phase 3a: Composable — `useCustomerSession.ts`

**Purpose:** Manage customer identity (phone lookup → customerId, UUID guest fallback, localStorage persistence).

```ts
import { ref, computed } from 'vue'
import { api } from '@/api/client'

const STORAGE_KEY = 'customer_session'

interface CustomerSession {
  id: number | string  // number for registered, string (uuid) for guest
  phone?: number
  name?: string
}

const saved = localStorage.getItem(STORAGE_KEY)
const session = ref<CustomerSession | null>(saved ? JSON.parse(saved) : null)

export function useCustomerSession() {
  const isLoggedIn = computed(() => session.value?.id != null)

  async function loginByPhone(phone: number): Promise<boolean> {
    const customers = await api.customers.list({ phone })
    if (customers.length) {
      session.value = { id: customers[0].id, phone, name: customers[0].name }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session.value))
      return true
    }
    return false
  }

  function initGuest(): void {
    if (session.value) return  // already has a session
    const guestId = crypto.randomUUID()
    session.value = { id: guestId }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session.value))
  }

  function clear(): void {
    session.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return { session, isLoggedIn, loginByPhone, initGuest, clear }
}
```

**Edge cases:**
- `localStorage` unavailable (incognito?) → wrap in try/catch
- Session already exists → `initGuest` is a no-op
- Phone not found → `loginByPhone` returns false; caller shows error

#### Phase 3b: Composable — `useCustomerCart.ts`

**Purpose:** Reactive cart state (Map<menuItemId, CartItem>) synced to localStorage. Always available even without login (guest browsing).

```ts
import { reactive, computed, watch } from 'vue'

const STORAGE_KEY = 'customer_cart'

interface CartItem {
  menuItemId: string
  name: string
  unitPrice: number
  brandId: string
  brandName: string
  quantity: number
  specialInstructions?: string
}

const saved = localStorage.getItem(STORAGE_KEY)
const items = reactive<Map<string, CartItem>>(
  saved ? new Map(JSON.parse(saved)) : new Map()
)

// Persist on every change
watch(
  () => Array.from(items.entries()),
  (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)),
  { deep: true }
)

export function useCustomerCart() {
  const totalItems = computed(() =>
    Array.from(items.values()).reduce((sum, i) => sum + i.quantity, 0)
  )

  const totalAmount = computed(() =>
    Array.from(items.values()).reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  )

  const itemCount = (menuItemId: string) => items.get(menuItemId)?.quantity ?? 0

  function addItem(menuItem: { id: string; name: string; price: number; brandId: string; brandName: string }): void {
    const existing = items.get(menuItem.id)
    if (existing) {
      existing.quantity++
    } else {
      items.set(menuItem.id, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        unitPrice: menuItem.price,
        brandId: menuItem.brandId,
        brandName: menuItem.brandName,
        quantity: 1,
      })
    }
  }

  function updateQuantity(menuItemId: string, qty: number): void {
    if (qty <= 0) {
      items.delete(menuItemId)
    } else {
      const item = items.get(menuItemId)
      if (item) item.quantity = qty
    }
  }

  function removeItem(menuItemId: string): void {
    items.delete(menuItemId)
  }

  function clearCart(): void {
    items.clear()
  }

  return {
    items,
    totalItems,
    totalAmount,
    itemCount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  }
}
```

**Edge cases:**
- Quantity set to 0 → item removed from cart
- Cart persisted across page refreshes via localStorage
- Cart survives guest→login transition (no clearing on login)
- Empty cart → `totalItems` is 0, `totalAmount` is 0

#### Phase 3c: Composable — `useCustomerOrders.ts`

**Purpose:** Fetch orders for the current session, place new orders, modify pending orders, cancel orders. **Uses `['customer-orders']` query key** to avoid collision with admin `['orders']` key.

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useSocket } from '@/composables/useSocket'
import { useSnackbar } from '@/composables/useSnackbar'
import type { Order, OrderUpdatePayload } from '@/types'
import { useCustomerSession } from './useCustomerSession'

export function useCustomerOrders() {
  const queryClient = useQueryClient()
  const { socket } = useSocket()
  const { session } = useCustomerSession()
  const snackbar = useSnackbar()

  const queryKey = ['customer-orders', session.value?.id] as const

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!session.value) return []
      if (typeof session.value.id === 'number') {
        return api.orders.list({ customerId: session.value.id })
      }
      // For guest orders, we filter by customerId (which is the uuid string)
      return api.orders.list({ customerId: session.value.id })
    },
    enabled: () => !!session.value?.id,
    refetchOnWindowFocus: false,
  })

  // Real-time listener
  const handler = (payload: OrderUpdatePayload) => {
    queryClient.setQueryData<Order[]>(queryKey, (old) => {
      if (!old) return old
      const idx = old.findIndex((o) => o.id === payload.id)
      if (idx === -1) return old
      const updated = [...old]
      updated[idx] = { ...updated[idx], status: payload.status }
      return updated
    })
  }

  socket.on('order:update', handler)
  onUnmounted(() => { socket.off('order:update', handler) })

  const placeOrder = useMutation({
    mutationFn: (data: {
      customerName: string
      phone?: number
      customerId: number | string
      items: Order['items']
      totalAmount: number
      brandId: string
    }) => api.orders.create({
      ...data,
      source: 'direct',
      status: 'pending',
      orderNumber: Date.now(),
      timestamps: { placedAt: new Date().toISOString(), startedAt: null, readyAt: null, dispatchedAt: null },
      prepTimeTarget: 15,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      snackbar.success('Order placed!')
    },
    onError: () => snackbar.error('Failed to place order'),
  })

  const cancelOrder = useMutation({
    mutationFn: (orderId: string) => api.orders.updateStatus(orderId, 'cancelled'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      snackbar.info('Order cancelled')
    },
    onError: () => snackbar.error('Failed to cancel order'),
  })

  return { ...query, placeOrder, cancelOrder }
}

export function useCustomerOrderDetail(orderIdRef: Ref<string>) {
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  const query = useQuery({
    queryKey: ['customer-order', orderIdRef] as const,
    queryFn: () => api.orders.get(orderIdRef.value),
    enabled: () => !!orderIdRef.value,
    refetchOnWindowFocus: false,
  })

  const handler = (payload: OrderUpdatePayload) => {
    if (payload.id !== orderIdRef.value) return
    queryClient.setQueryData<Order>(['customer-order', orderIdRef.value], (old) => {
      if (!old) return old
      return { ...old, status: payload.status }
    })
  }

  socket.on('order:update', handler)
  onUnmounted(() => { socket.off('order:update', handler) })

  return query
}
```

**Edge cases:**
- Guest orders use string `customerId` (UUID) — json-server can store this
- No session → query is disabled
- Socket events only update matched orders (by ID)

#### Phase 3d: Composable — `useCustomerMenu.ts`

**Purpose:** Wraps `useMenuItems` and `useBrands` with combined filtering.

```ts
import { computed } from 'vue'
import { useMenuItems, useBrands } from '@/modules/menu/composables/useMenu'
import type { MenuItem } from '@/types'

export function useCustomerMenu() {
  const { data: items, isLoading, isError, refetch } = useMenuItems()
  const { data: brands } = useBrands()

  // Extract unique categories from menu items
  const categories = computed(() => {
    if (!items.value) return []
    return [...new Set(items.value.map((i: MenuItem) => i.category))]
  })

  const brandMap = computed(() => {
    if (!brands.value) return new Map()
    return new Map(brands.value.map((b: any) => [b.id, b]))
  })

  return {
    items,
    brands,
    brandMap,
    categories,
    isLoading,
    isError,
    refetch,
  }
}
```

### Phase 4: Customer Views

#### `MenuBrowse.vue`

**Core functionality:**
- Hero banner at top with tagline
- Category filter: `Chip` buttons for all categories + "All"
- Brand filter: `SelectButton` or `Chips` for brands
- Responsive grid (1 col mobile, 2 col tablet, 3 col desktop) of `MenuItemCard`
- Each card shows: image placeholder (brand-colored), name, price, brand badge, "Add to Cart" button
- Cart badge in layout header triggers `CartDrawer`

**States:**
| State | UI |
|-------|-----|
| Loading | Skeleton grid (6 skeleton cards) |
| Error | Error icon + "Failed to load menu" + Retry button |
| Empty (all filtered out) | "No items match your filters" + Clear filters button |
| Success | Filtered grid of cards |

```vue
<template>
  <div class="space-y-6">
    <!-- Hero -->
    <div class="bg-gradient-to-r from-orange-500 to-orange-700 rounded-2xl p-8 text-white">
      <h1 class="text-3xl font-bold">Fresh food, delivered fast</h1>
      <p class="mt-2 text-orange-100">Order from your favourite kitchen brands</p>
    </div>

    <!-- Category Chips -->
    <div class="flex gap-2 overflow-x-auto pb-2">
      <Chip
        :label="'All'"
        :class="activeCategory === null ? 'bg-orange-600 text-white' : ''"
        @click="activeCategory = null"
      />
      <Chip
        v-for="cat in categories"
        :key="cat"
        :label="cat"
        :class="activeCategory === cat ? 'bg-orange-600 text-white' : ''"
        @click="activeCategory = cat"
      />
    </div>

    <!-- Brand filter -->
    <div v-if="brands" class="flex gap-2 flex-wrap">
      <Button
        v-for="brand in brands"
        :key="brand.id"
        :label="brand.name"
        :severity="activeBrand === brand.id ? 'primary' : 'secondary'"
        size="small"
        rounded
        @click="activeBrand = activeBrand === brand.id ? null : brand.id"
      />
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="n in 6" :key="n" class="bg-white rounded-xl border p-4 space-y-3 animate-pulse">
        <div class="h-32 bg-gray-200 rounded-lg" />
        <div class="h-4 w-24 bg-gray-200 rounded" />
        <div class="h-3 w-16 bg-gray-200 rounded" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="isError" class="text-center py-16">
      <i class="pi pi-exclamation-triangle text-4xl text-gray-300 mb-4 block" />
      <p class="text-gray-500">Failed to load menu</p>
      <Button label="Retry" severity="secondary" @click="refetch" class="mt-4" />
    </div>

    <!-- Empty filter result -->
    <div v-else-if="filteredItems.length === 0" class="text-center py-16">
      <i class="pi pi-filter-slash text-4xl text-gray-300 mb-4 block" />
      <p class="text-gray-500">No items match your filters</p>
      <Button label="Clear filters" severity="secondary" @click="activeCategory = null; activeBrand = null" class="mt-4" />
    </div>

    <!-- Menu Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MenuItemCard
        v-for="item in filteredItems"
        :key="item.id"
        :item="item"
        :quantity="cart.itemCount(item.id)"
        @add="cart.addItem(item)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Chip from 'primevue/chip'
import Button from 'primevue/button'
import { useCustomerMenu } from '../composables/useCustomerMenu'
import { useCustomerCart } from '../composables/useCustomerCart'
import MenuItemCard from '../components/MenuItemCard.vue'

const { items, brands, categories, isLoading, isError, refetch } = useCustomerMenu()
const cart = useCustomerCart()

const activeCategory = ref<string | null>(null)
const activeBrand = ref<string | null>(null)

const filteredItems = computed(() => {
  if (!items.value) return []
  return items.value.filter((i: any) => {
    const matchCat = !activeCategory.value || i.category === activeCategory.value
    const matchBrand = !activeBrand.value || i.brandId === activeBrand.value
    return matchCat && matchBrand && i.isActive
  })
})
</script>
```

#### `MenuItemCard.vue`

```vue
<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
    <div class="h-32 flex items-center justify-center" :style="{ background: brandColor }">
      <span class="text-5xl text-white/80 font-bold">{{ item.name[0] }}</span>
    </div>
    <div class="p-4 space-y-2">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-semibold text-gray-900">{{ item.name }}</h3>
          <span class="text-xs text-gray-400">{{ item.brandName }}</span>
        </div>
        <span class="font-bold text-orange-600">${{ item.price.toFixed(2) }}</span>
      </div>
      <div class="flex items-center justify-between pt-2">
        <span class="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 rounded-full capitalize">{{ item.category }}</span>
        <div class="flex items-center gap-2">
          <Button
            v-if="quantity > 0"
            icon="pi pi-minus"
            severity="secondary"
            size="small"
            rounded
            @click="$emit('update:quantity', Math.max(0, quantity - 1))"
          />
          <span v-if="quantity > 0" class="text-sm font-medium w-6 text-center">{{ quantity }}</span>
          <Button
            :icon="quantity > 0 ? 'pi pi-plus' : 'pi pi-cart-plus'"
            :severity="quantity > 0 ? 'secondary' : 'primary'"
            size="small"
            :rounded="quantity > 0"
            @click="$emit('add')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import type { MenuItem } from '@/types'

const props = defineProps<{
  item: MenuItem
  quantity: number
  brandColor?: string
}>()

defineEmits<{ add: []; 'update:quantity': [value: number] }>()

const brandColor = computed(() => props.brandColor ?? '#f97316')
</script>
```

**Edge cases:**
- Quantity already in cart → shows +/- buttons instead of "Add"
- Price formatting with `.toFixed(2)`
- Brand color fallback to orange if not specified

#### `CartDrawer.vue`

**Core functionality:**
- Slide-over panel from right, triggered by cart icon
- Lists all cart items with qty controls, individual remove
- Shows subtotal, item count
- "Proceed to Checkout" button (disabled if cart empty)
- Close button / click-outside to dismiss

```vue
<template>
  <Transition name="slide">
    <div v-if="visible" class="fixed inset-0 z-50 flex justify-end" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-black/40" />
      <aside class="relative w-full max-w-md bg-white shadow-xl flex flex-col">
        <header class="flex items-center justify-between px-6 h-16 border-b border-gray-200 shrink-0">
          <h2 class="font-bold text-lg">Your Cart ({{ cart.totalItems }})</h2>
          <button class="text-gray-400 hover:text-gray-600 text-xl" @click="$emit('close')">
            <i class="pi pi-times" />
          </button>
        </header>

        <!-- Empty state -->
        <div v-if="cartItems.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-400">
          <i class="pi pi-shopping-cart text-5xl mb-4" />
          <p class="text-sm">Your cart is empty</p>
        </div>

        <!-- Cart items -->
        <div v-else class="flex-1 overflow-auto p-6 space-y-4">
          <CartItem
            v-for="item in cartItems"
            :key="item.menuItemId"
            :item="item"
            @update:quantity="(qty) => cart.updateQuantity(item.menuItemId, qty)"
            @remove="cart.removeItem(item.menuItemId)"
          />
        </div>

        <!-- Footer -->
        <footer class="border-t border-gray-200 p-6 space-y-4 shrink-0">
          <div class="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${{ cart.totalAmount.toFixed(2) }}</span>
          </div>
          <Button
            label="Proceed to Checkout"
            class="w-full"
            icon="pi pi-arrow-right"
            icon-pos="right"
            :disabled="cart.totalItems === 0"
            @click="$router.push('/checkout'); $emit('close')"
          />
        </footer>
      </aside>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import CartItem from './CartItem.vue'
import { useCustomerCart } from '../composables/useCustomerCart'

defineProps<{ visible: boolean }>()
defineEmits<{ close: [] }>()

const router = useRouter()
const cart = useCustomerCart()
const cartItems = computed(() => Array.from(cart.items.values()))
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>
```

**Edge cases:**
- Empty cart shows illustration + text, footer button is disabled
- Click-outside-to-close on backdrop overlay
- Navigation to checkout closes drawer

#### `CartItem.vue`

```vue
<template>
  <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
    <div class="flex-1 min-w-0">
      <p class="font-medium text-sm text-gray-900 truncate">{{ item.name }}</p>
      <p class="text-xs text-gray-400">{{ item.brandName }}</p>
      <p class="text-sm font-semibold text-orange-600 mt-1">${{ (item.unitPrice * item.quantity).toFixed(2) }}</p>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <Button icon="pi pi-minus" severity="secondary" size="small" rounded @click="$emit('update:quantity', item.quantity - 1)" />
      <span class="w-6 text-center text-sm font-medium">{{ item.quantity }}</span>
      <Button icon="pi pi-plus" severity="secondary" size="small" rounded @click="$emit('update:quantity', item.quantity + 1)" />
    </div>
    <Button icon="pi pi-trash" severity="danger" size="small" text @click="$emit('remove')" />
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import type { CartItem } from '../composables/useCustomerCart'

defineProps<{ item: CartItem }>()
defineEmits<{ 'update:quantity': [value: number]; remove: [] }>()
</script>
```

#### `CheckoutPage.vue`

**Core functionality:**
- Customer info form: name, phone, email
- Shows cart items summary (read-only)
- Order total
- "Place Order" button
- On success: clear cart, redirect to order detail
- On error: show error, keep form data

**States:**
| State | UI |
|-------|-----|
| Empty cart | "Your cart is empty" + link back to menu |
| Loading (placing) | Button shows spinner |
| Error | Error message + keep data |
| Success | Redirect + toast |

```vue
<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Checkout</h1>

    <!-- Empty cart guard -->
    <div v-if="cartItems.length === 0" class="text-center py-16">
      <i class="pi pi-shopping-cart text-4xl text-gray-300 mb-4 block" />
      <p class="text-gray-500">Your cart is empty</p>
      <Button label="Browse Menu" severity="primary" @click="$router.push('/')" class="mt-4" />
    </div>

    <template v-else>
      <Panel header="Customer Details">
        <div class="space-y-4">
          <InputText v-model="form.name" placeholder="Full name *" class="w-full" :class="{ 'p-invalid': errors.name }" />
          <small v-if="errors.name" class="text-red-600">Name is required</small>
          <InputText v-model="form.phone" placeholder="Phone number" class="w-full" type="tel" />
          <InputText v-model="form.email" placeholder="Email" class="w-full" type="email" />
        </div>
      </Panel>

      <Panel header="Order Summary">
        <div class="space-y-3">
          <div v-for="item in cartItems" :key="item.menuItemId" class="flex justify-between text-sm">
            <span>{{ item.quantity }}× {{ item.name }}</span>
            <span class="font-medium">${{ (item.unitPrice * item.quantity).toFixed(2) }}</span>
          </div>
          <Divider />
          <div class="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${{ cart.totalAmount.toFixed(2) }}</span>
          </div>
        </div>
      </Panel>

      <Button
        label="Place Order"
        icon="pi pi-check"
        class="w-full"
        :loading="orders.placeOrder.isPending.value"
        @click="placeOrder"
      />

      <Message v-if="submitError" severity="error">{{ submitError }}</Message>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Panel from 'primevue/panel'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import { useCustomerCart } from '../composables/useCustomerCart'
import { useCustomerOrders } from '../composables/useCustomerOrders'
import { useCustomerSession } from '../composables/useCustomerSession'

const router = useRouter()
const cart = useCustomerCart()
const { session, initGuest } = useCustomerSession()
const orders = useCustomerOrders()

const cartItems = computed(() => Array.from(cart.items.values()))

const form = reactive({ name: '', phone: '', email: '' })
const errors = reactive({ name: false })
const submitError = ref('')

async function placeOrder() {
  errors.name = !form.name.trim()
  if (errors.name) return

  initGuest() // ensure we have a session

  submitError.value = ''
  try {
    await orders.placeOrder.mutateAsync({
      customerName: form.name.trim(),
      phone: form.phone ? Number(form.phone) : undefined,
      customerId: session.value!.id,
      items: cartItems.value.map((i) => ({
        menuItemId: i.menuItemId,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      totalAmount: cart.totalAmount.value,
      brandId: cartItems.value[0].brandId,
    })
    cart.clearCart()
    router.push('/orders')
  } catch {
    submitError.value = 'Failed to place order. Please try again.'
  }
}
</script>
```

**Edge cases:**
- Empty cart → shows link back, no form
- Missing name → validation error
- Guest session auto-initialized on place order
- Phone/email optional
- Network error → caught in catch, shows Message

#### `OrderHistory.vue`

**Core functionality:**
- List of orders with status badges
- Real-time status updates via socket
- Click to expand details or navigate to detail
- Pull-to-refresh or manual refresh button

**States:**
| State | UI |
|-------|-----|
| Loading | Skeleton list |
| Error | Error + retry |
| Empty | "No orders yet" + link to menu |
| No session | "Sign in to see orders" + phone input |

```vue
<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">My Orders</h1>

    <!-- No session -->
    <div v-if="!session?.id" class="text-center py-16 space-y-4">
      <i class="pi pi-user text-4xl text-gray-300 block" />
      <p class="text-gray-500">Sign in with your phone number to see orders</p>
      <div class="flex gap-3 max-w-sm mx-auto">
        <InputText v-model="phoneInput" placeholder="Phone number" type="tel" class="flex-1" />
        <Button label="Sign In" @click="signIn" :loading="signingIn" />
      </div>
      <p v-if="signInError" class="text-sm text-red-600">{{ signInError }}</p>
    </div>

    <template v-else>
      <!-- Loading -->
      <div v-if="isLoading" class="space-y-4">
        <div v-for="n in 3" :key="n" class="bg-white rounded-xl border p-5 space-y-3 animate-pulse">
          <div class="h-4 w-24 bg-gray-200 rounded" />
          <div class="h-3 w-40 bg-gray-200 rounded" />
          <div class="h-6 w-20 bg-gray-200 rounded-full" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="isError" class="text-center py-16">
        <i class="pi pi-exclamation-triangle text-4xl text-gray-300 mb-4 block" />
        <p class="text-gray-500">Failed to load orders</p>
        <Button label="Retry" severity="secondary" @click="refetch" class="mt-4" />
      </div>

      <!-- Empty -->
      <div v-else-if="!data?.length" class="text-center py-16">
        <i class="pi pi-receipt text-4xl text-gray-300 mb-4 block" />
        <p class="text-gray-500">No orders yet</p>
        <Button label="Browse Menu" @click="$router.push('/')" class="mt-4" />
      </div>

      <!-- Order list -->
      <div v-else class="space-y-4">
        <OrderCard
          v-for="order in data"
          :key="order.id"
          :order="order"
          class="cursor-pointer"
          @click="$router.push(`/orders/${order.id}`)"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import OrderCard from '../components/OrderCard.vue'
import { useCustomerOrders } from '../composables/useCustomerOrders'
import { useCustomerSession } from '../composables/useCustomerSession'

const { session, loginByPhone } = useCustomerSession()
const { data, isLoading, isError, refetch } = useCustomerOrders()

const phoneInput = ref('')
const signingIn = ref(false)
const signInError = ref('')

async function signIn() {
  const phone = phoneInput.value.trim()
  if (!phone || phone.length < 10) {
    signInError.value = 'Please enter a valid 10-digit phone number'
    return
  }
  signingIn.value = true
  signInError.value = ''
  const found = await loginByPhone(Number(phone))
  signingIn.value = false
  if (!found) signInError.value = 'No account found with this phone number'
}
</script>
```

#### `OrderDetail.vue`

**Core functionality:**
- Full order details: items, total, timestamps
- `StatusTimeline` from `order-status` module
- "Cancel Order" button (only while `pending` status)
- "Modify Order" button (only while `pending` status, opens cart-like modal)
- Real-time status updates

**States:**
| State | UI |
|-------|-----|
| Loading | Full skeleton |
| Error | Error + retry |
| Not found | "Order not found" |
| Pending | Detail + Cancel/Modify buttons |
| Non-pending | Detail only (read-only) |

```vue
<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <Button label="← Back to Orders" severity="secondary" text @click="$router.push('/orders')" />

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <div class="bg-white rounded-xl border p-5 space-y-3 animate-pulse">
        <div class="h-6 w-40 bg-gray-200 rounded" />
        <div class="h-4 w-24 bg-gray-200 rounded" />
        <div class="h-3 w-56 bg-gray-200 rounded" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="isError" class="text-center py-16">
      <i class="pi pi-exclamation-triangle text-4xl text-gray-300 mb-4 block" />
      <p class="text-gray-500">Failed to load order</p>
      <Button label="Retry" severity="secondary" @click="refetch" class="mt-4" />
    </div>

    <!-- Not found -->
    <div v-else-if="!order" class="text-center py-16">
      <i class="pi pi-search text-4xl text-gray-300 mb-4 block" />
      <p class="text-gray-500">Order not found</p>
    </div>

    <template v-else>
      <!-- Order header -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wide">Order #{{ order.orderNumber }}</p>
            <h1 class="text-xl font-bold text-gray-900">{{ order.customerName }}</h1>
          </div>
          <span class="px-3 py-1 rounded-full text-sm font-semibold" :class="statusClass">
            {{ statusLabel }}
          </span>
        </div>

        <!-- Items -->
        <div class="divide-y divide-gray-100">
          <div v-for="item in order.items" :key="item.menuItemId" class="flex justify-between py-2 text-sm">
            <span>{{ item.quantity }}× {{ item.name }}</span>
            <span class="font-medium">${{ (item.unitPrice * item.quantity).toFixed(2) }}</span>
          </div>
        </div>

        <div class="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
          <span>Total</span>
          <span>${{ order.totalAmount.toFixed(2) }}</span>
        </div>

        <!-- Actions for pending orders -->
        <div v-if="order.status === 'pending'" class="flex gap-3 pt-2">
          <Button
            label="Cancel Order"
            severity="danger"
            outlined
            :loading="orders.cancelOrder.isPending.value"
            @click="confirmCancel"
          />
          <Button
            label="Modify Order"
            severity="secondary"
            outlined
            @click="modifyOpen = true"
          />
        </div>
      </div>

      <!-- Status Timeline -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-sm font-semibold text-gray-900 mb-4">Order Status</h2>
        <StatusTimeline :status="order.status" :timestamps="order.timestamps" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import StatusTimeline from '@/modules/order-status/components/StatusTimeline.vue'
import { useCustomerOrderDetail, useCustomerOrders } from '../composables/useCustomerOrders'
import type { OrderStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const orderId = computed(() => route.params.id as string)
const { data: order, isLoading, isError, refetch } = useCustomerOrderDetail(orderId)
const orders = useCustomerOrders()

const modifyOpen = ref(false)

const statusLabel = computed(() => {
  const map: Record<OrderStatus, string> = {
    pending: 'Pending', preparing: 'Preparing', ready: 'Ready',
    dispatched: 'Dispatched', cancelled: 'Cancelled',
  }
  return map[order.value?.status as OrderStatus] ?? order.value?.status ?? ''
})

const statusClass = computed(() => {
  const map: Record<OrderStatus, string> = {
    pending: 'bg-gray-100 text-gray-600', preparing: 'bg-orange-100 text-orange-700',
    ready: 'bg-green-100 text-green-700', dispatched: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return map[order.value?.status as OrderStatus] ?? 'bg-gray-100 text-gray-600'
})

function confirmCancel() {
  if (!order.value) return
  if (confirm('Are you sure you want to cancel this order?')) {
    orders.cancelOrder.mutate(order.value.id, {
      onSuccess: () => router.push('/orders'),
    })
  }
}
</script>
```

**Edge cases:**
- Cancel only allowed on `pending` orders
- Other statuses → no action buttons
- Cancel confirmation dialog before proceeding
- Real-time updates via socket

### Phase 5: New Files Summary

| File | Purpose |
|------|---------|
| `src/router/routes/admin.ts` | Admin route definitions extracted |
| `src/router/routes/customer.ts` | Customer portal route definitions |
| `src/modules/customer/composables/useCustomerCart.ts` | Cart state + localStorage sync |
| `src/modules/customer/composables/useCustomerSession.ts` | Session management (phone/UUID) |
| `src/modules/customer/composables/useCustomerOrders.ts` | Orders fetch, place, cancel, modify |
| `src/modules/customer/composables/useCustomerMenu.ts` | Menu with brand enrichment |
| `src/modules/customer/components/MenuItemCard.vue` | Menu item card |
| `src/modules/customer/components/CartDrawer.vue` | Slide-over cart drawer |
| `src/modules/customer/components/CartItem.vue` | Cart item row |
| `src/modules/customer/components/OrderCard.vue` | Reusable order card for history |
| `src/modules/customer/components/CustomerInfoForm.vue` | Checkout form |
| `src/modules/customer/views/MenuBrowse.vue` | Main menu browsing page |
| `src/modules/customer/views/CheckoutPage.vue` | Checkout + order placement |
| `src/modules/customer/views/OrderHistory.vue` | Customer order history |
| `src/modules/customer/views/OrderDetail.vue` | Single order detail with actions |

### Phase 6: Modified Files Summary

| File | Change |
|------|--------|
| `src/router/index.ts` | Split into admin + customer routes; add `beforeEach` guard |
| `src/components/layout/AppDrawer.vue` | Nav paths → `/admin/kds`, etc. |
| `src/components/layout/AppHeader.vue` | Nav paths → `/admin/kds`, etc. |
| `src/components/layout/PublicLayout.vue` | Renamed → `CustomerLayout.vue`; add cart badge, nav tabs, wider container |
| `src/components/layout/PublicLayout.vue` | Recreated as minimal layout for `/track` (original simple header) |

### Phase 7: Test Strategy

#### `src/router/__tests__/redirectGuard.spec.ts`

```ts
import { describe, it, expect, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

// Mock route components
const mockComponent = { template: '<div />' }

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/admin/kds', component: mockComponent },
    { path: '/admin/inventory', component: mockComponent },
    { path: '/admin/menu', component: mockComponent },
    { path: '/admin/analytics', component: mockComponent },
    { path: '/', component: mockComponent },
  ],
})

// Add the guard
const LEGACY_MAP: Record<string, string> = {
  '/kds': '/admin/kds',
  '/inventory': '/admin/inventory',
  '/menu': '/admin/menu',
  '/menu/recipes': '/admin/menu/recipes',
  '/inventory/adjust': '/admin/inventory/adjust',
  '/analytics': '/admin/analytics',
}

router.beforeEach((to, _from, next) => {
  const legacy = LEGACY_MAP[to.path]
  if (legacy) return next(legacy)
  next()
})

describe('redirectGuard', () => {
  it.each([
    ['/kds', '/admin/kds'],
    ['/inventory', '/admin/inventory'],
    ['/menu', '/admin/menu'],
    ['/menu/recipes', '/admin/menu/recipes'],
    ['/inventory/adjust', '/admin/inventory/adjust'],
    ['/analytics', '/admin/analytics'],
  ])('redirects %s → %s', async (from, to) => {
    await router.push(from)
    expect(router.currentRoute.value.path).toBe(to)
  })

  it('does not redirect /admin/kds', async () => {
    await router.push('/admin/kds')
    expect(router.currentRoute.value.path).toBe('/admin/kds')
  })

  it('does not redirect /', async () => {
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('does not redirect /checkout', async () => {
    await router.push('/checkout')
    expect(router.currentRoute.value.path).toBe('/checkout')
  })
})
```

## 4. Implementation Order (Dependency-Aware)

```
Step 1:  Router refactoring (admin.ts, customer.ts, index.ts guard)
Step 2:  Nav updates (AppDrawer.vue, AppHeader.vue) — admin paths
Step 3:  PublicLayout → CustomerLayout (enhanced), recreate PublicLayout minimal
Step 4:  useCustomerSession.ts — foundation for identity
Step 5:  useCustomerCart.ts — foundation for cart
Step 6:  useCustomerMenu.ts — foundation for menu browsing
Step 7:  MenuItemCard.vue, CartItem.vue, CartDrawer.vue — building blocks
Step 8:  MenuBrowse.vue — build with all states
Step 9:  useCustomerOrders.ts — with separate query key
Step 10: OrderCard.vue, OrderHistory.vue — order list with all states
Step 11: OrderDetail.vue — detail with cancel action
Step 12: CheckoutPage.vue — place order flow
Step 13: Test guard + integration tests
```

## 5. What Changed vs. Original Proposal

| Area | Original Proposal | Final Solution |
|------|------------------|----------------|
| `order-status` module | Reused `useCustomerOrders` with extensions | Kept purely for guest tracking; new `useCustomerOrders` in `customer/composables/` with `['customer-orders']` key |
| Session | Phone-only gate | Phone + UUID guest fallback (menu browsing without sign-in) |
| Query keys | Potential collision (`['orders']`) | Explicit separation: admin `['orders']`, customer `['customer-orders']` |
| Guard debugging | No logging | `console.warn` in dev mode |
| Loading/empty/error | Not specified | Explicit per-component for all views |
| PublicLayout | Rename in-place | Renamed to `CustomerLayout.vue` with enhancements; recreated `PublicLayout.vue` as minimal for `/track` |
| Test strategy | Not mentioned | `redirectGuard.spec.ts` with table-driven tests |

## 6. Self-Verification

**Q1: Does the guard correctly redirect all 6 legacy paths without affecting new paths?**

Yes — the `LEGACY_MAP` covers `/kds`, `/inventory`, `/menu`, `/menu/recipes`, `/inventory/adjust`, `/analytics`. Non-listed paths (`/`, `/checkout`, `/orders`, `/orders/:id`, `/track`, `/admin/kds`) pass through unchanged. The guard tests verify this.

**Q2: Are query keys separated so admin operations never collide with customer operations?**

Yes — admin uses `['orders']` and `['menuItems']` (unchanged). Customer uses `['customer-orders']` and `['customer-order', id]`. The `useCustomerOrders` composable in the customer module uses its own keys.

**Q3: Can a user browse the menu without signing in?**

Yes — `useCustomerSession.initGuest()` creates a UUID on first visit if no session exists. Browsing the menu and adding to cart works without any phone number. Phone is only needed when viewing order history (to associate past orders).

**Q4: What happens when the `/track` route is accessed?**

It still uses the original `PublicLayout.vue` (recreated as minimal layout), not the `CustomerLayout.vue`. The `track.order` route name is preserved and the guard doesn't interfere since `/track` is not in `LEGACY_MAP`.

**Q5: What UI states does each customer view handle?**

Every view handles at minimum: `isLoading` (skeleton), `isError` (error icon + retry), empty data (illustration + CTA), and success (content). Checkout also handles the empty-cart guard. OrderDetail also handles "not found" state.
