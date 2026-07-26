<script setup lang="ts">
import { ref, computed } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useOrderTracking } from '../composables/useCustomerOrders'
import OrderCardCompact from '../components/OrderCardCompact.vue'
import StatusTimeline from '../components/StatusTimeline.vue'

const input = ref('')
const searched = ref(false)

const orderNumber = computed(() => parseInt(input.value, 10))

const {
  data: order,
  isLoading,
  isError,
  refetch,
} = useOrderTracking(orderNumber)

const error = computed(() => {
  if (isError.value) return 'Something went wrong. Please try again.'
  if (searched.value && !orderNumber.value) return 'Please enter a valid order number.'
  return null
})

function submit() {
  if (!input.value.trim()) return
  searched.value = true
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center space-y-2">
      <h1 class="text-2xl font-bold text-gray-900">Track Your Order</h1>
      <p class="text-sm text-gray-500">Enter your order number to see real-time status</p>
    </div>

    <form class="flex gap-3" @submit.prevent="submit">
      <InputText
        v-model="input"
        placeholder="Order number (e.g. 2001)"
        class="flex-1"
      />
      <Button
        type="submit"
        label="Track"
        icon="pi pi-search"
        :loading="isLoading"
      />
    </form>

    <p v-if="error" class="text-sm text-red-600 text-center">{{ error }}</p>

    <div v-if="isLoading" class="space-y-5">
      <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-3 animate-pulse">
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
      <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-4 animate-pulse">
        <div class="h-4 w-24 bg-gray-200 rounded" />
        <div v-for="n in 4" :key="n" class="flex items-start gap-3">
          <div class="w-6 h-6 rounded-full bg-gray-200 shrink-0" />
          <div class="space-y-1 flex-1">
            <div class="h-3 w-28 bg-gray-200 rounded" />
            <div class="h-3 w-16 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>

    <Transition name="slide-fade">
      <div v-if="order" key="result" class="space-y-5">
        <OrderCardCompact :order="order" />
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-900 mb-4">Order Status</h2>
          <StatusTimeline :status="order.status" :timestamps="order.timestamps" />
        </div>
      </div>
    </Transition>

    <div v-if="searched && !order && !isLoading && !isError" class="text-center py-12">
      <i class="pi pi-search text-3xl text-gray-300 mb-3 block" />
      <p class="text-sm text-gray-500">No order found with that number.</p>
      <p class="text-xs text-gray-400 mt-1">Double-check the number and try again.</p>
    </div>

    <div v-if="isError && !isLoading" class="text-center py-12">
      <i class="pi pi-exclamation-triangle text-3xl text-gray-300 mb-3 block" />
      <p class="text-sm text-gray-500">Something went wrong.</p>
      <Button label="Retry" severity="secondary" size="small" class="mt-3" @click="() => refetch()" />
    </div>
  </div>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
