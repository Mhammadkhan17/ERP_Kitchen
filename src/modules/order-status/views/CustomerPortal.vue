<script setup lang="ts">
import { ref, computed } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useCustomerOrders } from '../composables/useCustomerOrders'
import OrderCardCompact from '../components/OrderCardCompact.vue'
import StatusTimeline from '../components/StatusTimeline.vue'

const input = ref('')
const loginError = ref('')
const expanded = ref<string | null>(null)

const customerId = ref(localStorage.getItem('tracking_customer_id') ?? '')

const { data: orders, isLoading, isError, refetch } = useCustomerOrders(customerId)

const expandedOrder = computed(() => {
  if (!expanded.value || !orders.value) return null
  return orders.value.find((o) => o.id === expanded.value) ?? null
})

function login() {
  const val = input.value.trim()
  if (!val) {
    loginError.value = 'Please enter a phone number or customer ID.'
    return
  }
  loginError.value = ''
  customerId.value = val
  localStorage.setItem('tracking_customer_id', val)
}

function logout() {
  customerId.value = ''
  localStorage.removeItem('tracking_customer_id')
  expanded.value = null
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center space-y-2">
      <h1 class="text-2xl font-bold text-gray-900">My Orders</h1>
      <p class="text-sm text-gray-500">Live status of all your orders</p>
    </div>

    <div v-if="!customerId" class="space-y-4">
      <p class="text-sm text-gray-500 text-center">
        Enter your phone number or customer ID to see your orders.
      </p>
      <form class="flex gap-3" @submit.prevent="login">
        <InputText
          v-model="input"
          placeholder="Phone number or customer ID"
          class="flex-1"
        />
        <Button type="submit" label="View Orders" icon="pi pi-arrow-right" />
      </form>
      <p v-if="loginError" class="text-sm text-red-600 text-center">{{ loginError }}</p>
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500">Showing orders for <strong>{{ customerId }}</strong></p>
        <Button
          label="Switch"
          icon="pi pi-sign-out"
          severity="secondary"
          size="small"
          @click="logout"
        />
      </div>

      <div v-if="isLoading" class="space-y-4">
        <div
          v-for="n in 3"
          :key="n"
          class="bg-white rounded-xl border border-gray-200 p-5 space-y-3 animate-pulse"
        >
          <div class="flex justify-between">
            <div class="space-y-2">
              <div class="h-3 w-20 bg-gray-200 rounded" />
              <div class="h-4 w-32 bg-gray-200 rounded" />
            </div>
            <div class="h-6 w-20 bg-gray-200 rounded-full" />
          </div>
          <div class="h-3 w-48 bg-gray-200 rounded" />
          <div class="h-px bg-gray-100" />
          <div class="flex justify-between">
            <div class="h-3 w-16 bg-gray-200 rounded" />
            <div class="h-4 w-16 bg-gray-200 rounded" />
          </div>
        </div>
      </div>

      <div v-else-if="isError" class="text-center py-12">
        <i class="pi pi-exclamation-triangle text-3xl text-gray-300 mb-3 block" />
        <p class="text-sm text-gray-500">Failed to load orders.</p>
        <Button label="Retry" severity="secondary" size="small" class="mt-3" @click="() => refetch()" />
      </div>

      <div v-else-if="orders?.length" class="space-y-4">
        <OrderCardCompact
          v-for="order in orders"
          :key="order.id"
          :order="order"
          class="cursor-pointer transition-shadow hover:shadow-md"
          @click="expanded = expanded === order.id ? null : order.id"
        />
        <Transition name="slide-fade">
          <div
            v-if="expanded"
            key="timeline"
            class="bg-white rounded-xl border border-gray-200 p-5 -mt-2"
          >
            <StatusTimeline
              :status="expandedOrder!.status"
              :timestamps="expandedOrder!.timestamps"
            />
          </div>
        </Transition>
      </div>

      <div v-else class="text-center py-12">
        <i class="pi pi-receipt text-3xl text-gray-300 mb-3 block" />
        <p class="text-sm text-gray-500">No orders found for this account.</p>
        <p class="text-xs text-gray-400 mt-1">Try a different phone number or customer ID.</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.25s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
