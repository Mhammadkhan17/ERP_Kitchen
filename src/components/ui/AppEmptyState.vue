<template>
  <div class="flex flex-col items-center justify-center text-center py-10 px-4 gap-2">
    <i v-if="icon" :class="[icon, 'text-3xl text-gray-300']" />
    <p class="text-sm font-medium text-gray-700">{{ title }}</p>
    <p v-if="hint" class="text-xs text-gray-500">{{ hint }}</p>
    <div v-if="$slots.action" class="mt-2">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; hint?: string; icon?: string }>()
</script>
