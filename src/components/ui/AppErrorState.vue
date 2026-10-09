<template>
  <div class="flex flex-col items-center justify-center text-center py-10 px-4 gap-2">
    <i class="pi pi-exclamation-circle text-3xl text-red-600" />
    <p class="text-sm font-medium text-gray-700">{{ message }}</p>
    <Button label="Retry" severity="secondary" size="small" class="mt-2" @click="$emit('retry')" />
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'

withDefaults(defineProps<{ message?: string }>(), {
  message: 'Something went wrong. Please try again.',
})

defineEmits<{ retry: [] }>()
</script>
