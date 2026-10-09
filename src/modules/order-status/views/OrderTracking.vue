<script setup lang="ts">
import { ref, computed } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import { useOrderTracking } from '../composables/useCustomerOrders'
import OrderCardCompact from '../components/OrderCardCompact.vue'
import StatusTimeline from '../components/StatusTimeline.vue'

const input = ref('')
const searched = ref(false)

const orderNumber = computed(() => parseInt(input.value, 10))

const { data: order, isLoading, isError, refetch } = useOrderTracking(orderNumber)

const error = computed(() => {
  if (searched.value && !orderNumber.value) return 'Please enter a valid order number.'
  return null
})

function onSearch() {
  if (!input.value.trim()) return
  searched.value = true
  if (!isNaN(orderNumber.value)) refetch()
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Track your order"
      subtitle="Enter your order number and phone"
      align="center"
    />

    <form class="flex gap-3" @submit.prevent="onSearch">
      <InputText v-model="input" placeholder="Order number (e.g. 2001)" class="flex-1" />
      <Button type="submit" label="Track" icon="pi pi-search" :loading="isLoading" />
    </form>

    <p v-if="error" class="text-sm text-red-600 text-center">{{ error }}</p>

    <AppSkeleton v-if="isLoading" variant="panel" />

    <Transition name="fade">
      <div v-if="order" key="result" class="space-y-5">
        <OrderCardCompact :order="order" />
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-900 mb-4">Order Status</h2>
          <StatusTimeline :status="order.status" :timestamps="order.timestamps" />
        </div>
      </div>
    </Transition>

    <AppEmptyState
      v-if="searched && !order && !isLoading && !isError"
      title="Order not found"
      hint="Check the number on your receipt and try again"
      icon="pi pi-search"
    />

    <AppErrorState
      v-if="isError && !isLoading"
      message="Could not look up this order"
      @retry="onSearch"
    />
  </div>
</template>
