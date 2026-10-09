<template>
  <div v-if="variant === 'cards'" class="grid gap-4" :data-count="count">
    <div v-for="i in count" :key="i" class="card h-40 animate-pulse" />
  </div>
  <div v-else-if="variant === 'kpi'" class="grid gap-4 grid-cols-2 xl:grid-cols-4">
    <div v-for="i in count" :key="i" class="card h-28 animate-pulse" />
  </div>
  <div v-else-if="variant === 'table'" class="card animate-pulse space-y-3">
    <div v-for="i in count" :key="i" class="h-8 rounded bg-gray-200" />
  </div>
  <div v-else class="card h-48 animate-pulse" />
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ variant: 'table' | 'cards' | 'kpi' | 'panel'; count?: number }>(),
  { count: 4 },
)
</script>
