<template>
  <div class="flex h-screen bg-gray-50">
    <AppDrawer />
    <div class="flex-1 flex flex-col min-w-0">
      <AppHeader />
      <main class="flex-1 overflow-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
  <Toast />
  <ConfirmDialog />
</template>

<script setup lang="ts">
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import AppDrawer from './AppDrawer.vue'
import AppHeader from './AppHeader.vue'
</script>
