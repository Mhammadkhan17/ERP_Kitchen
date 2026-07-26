<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { OrderStatus, OrderTimestamps } from '@/types'

const props = defineProps<{
  status: OrderStatus
  timestamps?: OrderTimestamps
}>()

const statusOrder: OrderStatus[] = ['pending', 'preparing', 'ready', 'dispatched']

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 30000) })
onUnmounted(() => { clearInterval(timer) })

function relativeTime(iso: string | null): string | null {
  if (!iso) return null
  const ms = now.value - new Date(iso).getTime()
  if (ms < 0) return null
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const steps = computed(() =>
  statusOrder.map((s) => {
    const key = timestampKey(s)
    const iso = props.timestamps?.[key] ?? null
    return { status: s, label: labelFor(s), time: iso, relative: relativeTime(iso) }
  })
)

function labelFor(s: OrderStatus): string {
  const map: Record<string, string> = {
    pending: 'Order Placed',
    preparing: 'Preparing',
    ready: 'Ready for Pickup',
    dispatched: 'Dispatched',
  }
  return map[s] ?? s
}

function timestampKey(s: OrderStatus): keyof OrderTimestamps {
  const map: Record<OrderStatus, keyof OrderTimestamps> = {
    pending: 'placedAt',
    preparing: 'startedAt',
    ready: 'readyAt',
    dispatched: 'dispatchedAt',
    cancelled: 'placedAt',
  }
  return map[s]
}

function stepIndex(s: OrderStatus): number {
  return statusOrder.indexOf(s)
}

function isCompleted(s: OrderStatus): boolean {
  return stepIndex(s) < stepIndex(props.status)
}

function isActive(s: OrderStatus): boolean {
  return s === props.status
}

function stepClass(s: OrderStatus): string {
  if (isCompleted(s)) return 'bg-orange-600 ring-2 ring-orange-200'
  if (isActive(s)) return 'bg-orange-600 ring-4 ring-orange-100 animate-pulse'
  return 'bg-gray-100'
}
</script>

<template>
  <div class="relative">
    <div class="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
    <div class="space-y-5">
      <div
        v-for="step in steps"
        :key="step.status"
        class="flex items-start gap-3"
      >
        <div
          class="relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
          :class="stepClass(step.status)"
        >
          <i v-if="isCompleted(step.status)" class="pi pi-check text-white text-[10px]" />
          <span v-else-if="isActive(step.status)" class="w-2 h-2 rounded-full bg-white" />
          <span v-else class="w-2 h-2 rounded-full bg-gray-300" />
        </div>
        <div class="min-w-0">
          <p
            class="text-sm font-medium"
            :class="isCompleted(step.status) ? 'text-gray-900' : isActive(step.status) ? 'text-orange-700' : 'text-gray-400'"
          >
            {{ step.label }}
          </p>
          <p v-if="step.relative" class="text-xs text-gray-400 mt-0.5">{{ step.relative }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
