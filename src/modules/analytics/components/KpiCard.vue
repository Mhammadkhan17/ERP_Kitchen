<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  value: string | number
  icon: string
  subtitle?: string
  trend?: number
}>(), {
  subtitle: '',
  trend: 0,
})
</script>

<template>
  <div class="card flex items-start justify-between gap-4">
    <div class="flex-1 min-w-0">
      <div class="text-sm text-gray-500 font-medium truncate">{{ title }}</div>
      <div class="text-2xl font-bold text-gray-900 mt-1">{{ value }}</div>
      <div v-if="subtitle" class="text-xs text-gray-400 mt-1">{{ subtitle }}</div>
      <div v-if="trend" class="flex items-center gap-1 mt-2">
        <i v-if="trend > 0" class="pi pi-arrow-up text-green-500 text-sm"></i>
        <i v-else class="pi pi-arrow-down text-red-500 text-sm"></i>
        <span :class="trend > 0 ? 'text-green-600' : 'text-red-600'" class="text-sm font-medium">
          {{ Math.abs(trend) }}%
        </span>
      </div>
    </div>
    <i :class="`pi ${icon} text-3xl shrink-0`"></i>
  </div>
</template>
