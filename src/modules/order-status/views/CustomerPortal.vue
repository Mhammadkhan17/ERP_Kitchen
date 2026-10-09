<script setup lang="ts">
import { ref, computed } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
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
    <PageHeader title="My orders" subtitle="Sign in with your phone to see order history" />

    <div v-if="!customerId" class="space-y-4">
      <p class="text-sm text-gray-500 text-center">
        Enter your phone number or customer ID to see your orders.
      </p>
      <form class="max-w-md mx-auto space-y-3" @submit.prevent="login">
        <div class="field">
          <label for="portal-identity" class="text-sm font-medium text-gray-700">
            Phone number
          </label>
          <InputText
            id="portal-identity"
            v-model="input"
            class="w-full"
            :class="{ 'p-invalid': loginError }"
            @input="loginError = ''"
          />
          <p v-if="loginError" class="text-xs text-red-600">{{ loginError }}</p>
        </div>
        <Button type="submit" label="View Orders" icon="pi pi-arrow-right" class="w-full" />
      </form>
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500">
          Showing orders for <strong>{{ customerId }}</strong>
        </p>
        <Button
          label="Switch"
          icon="pi pi-sign-out"
          severity="secondary"
          size="small"
          @click="logout"
        />
      </div>

      <AppSkeleton v-if="isLoading" variant="cards" :count="2" />

      <AppErrorState
        v-else-if="isError"
        message="Could not load your orders"
        @retry="refetch"
      />

      <div v-else-if="orders?.length" class="space-y-4">
        <OrderCardCompact
          v-for="order in orders"
          :key="order.id"
          :order="order"
          class="cursor-pointer transition-shadow hover:shadow-md"
          @click="expanded = expanded === order.id ? null : order.id"
        />
        <Transition name="fade">
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

      <AppEmptyState
        v-else
        title="No orders yet"
        hint="Orders placed with your phone number appear here"
        icon="pi pi-receipt"
      />
    </template>
  </div>
</template>
