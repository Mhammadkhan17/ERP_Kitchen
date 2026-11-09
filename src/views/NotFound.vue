<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center gap-4">
    <p class="font-mono text-xs uppercase tracking-wider text-gray-400">Error 404</p>
    <h1 class="text-2xl font-semibold text-gray-900">Page not found</h1>
    <p class="text-sm text-gray-500 max-w-sm">
      This page doesn’t exist. It may have been moved, removed, or never existed.
    </p>
    <Button label="Back to KDS" icon="pi pi-arrow-left" @click="$router.push('/kds')" />
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
</script>
