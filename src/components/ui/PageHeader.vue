<template>
  <div
    class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    :class="align === 'center' && 'text-center sm:flex-col sm:items-center'"
  >
    <div :class="align === 'center' ? 'sm:text-center' : 'min-w-0'">
      <h1
        class="text-2xl font-semibold text-gray-900 tracking-tight"
        :class="align === 'center' && 'text-center'"
      >
        {{ title }}
      </h1>
      <p v-if="subtitle" class="text-sm text-gray-500 mt-1">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  align?: 'left' | 'center'
}>()
</script>
