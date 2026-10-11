<template>
  <header class="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 lg:hidden">
    <Button icon="pi pi-bars" text rounded aria-label="Open menu" @click="mobileOpen = !mobileOpen" />
    <i class="pi pi-cart-plus text-lg text-orange-600"></i>
    <span class="font-bold text-lg">Cloud Kitchen</span>
  </header>

  <div v-if="mobileOpen" class="fixed inset-0 z-50 lg:hidden" @click="mobileOpen = false">
    <div class="absolute inset-0 bg-black/50" />
    <aside class="absolute left-0 top-0 bottom-0 w-60 bg-white shadow-lg" @click.stop>
      <div class="h-14 flex items-center justify-between px-6 border-b border-gray-200">
        <span class="font-bold text-lg">Menu</span>
        <Button icon="pi pi-times" text rounded aria-label="Close menu" @click="mobileOpen = false" />
      </div>
      <NavList @navigate="mobileOpen = false" />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import NavList from '@/components/ui/NavList.vue'

const mobileOpen = ref(false)
</script>
