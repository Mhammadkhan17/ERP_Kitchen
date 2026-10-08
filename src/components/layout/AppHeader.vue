<template>
  <header class="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 lg:hidden">
    <button @click="mobileOpen = !mobileOpen" class="btn-ghost p-2 -ml-2">
      <i class="pi pi-bars text-xl"></i>
    </button>
    <i class="pi pi-cart-plus text-lg text-orange-600"></i>
    <span class="font-bold text-lg">Cloud Kitchen</span>
  </header>

  <div
    v-if="mobileOpen"
    class="fixed inset-0 z-50 lg:hidden"
    @click="mobileOpen = false"
  >
    <div class="absolute inset-0 bg-black/50" />
    <aside class="absolute left-0 top-0 bottom-0 w-60 bg-white shadow-xl" @click.stop>
      <div class="h-16 flex items-center justify-between px-6 border-b border-gray-200">
        <span class="font-bold text-lg">Menu</span>
        <button @click="mobileOpen = false" class="btn-ghost p-1 text-xl">
          <i class="pi pi-times"></i>
        </button>
      </div>
      <nav class="py-4 px-3 space-y-1">
        <router-link
          v-for="item in NAV_ITEMS"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="isActive(item.path) ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-100'"
          @click="mobileOpen = false"
        >
          <span class="text-lg" v-html="item.icon"></span>
          {{ item.label }}
        </router-link>
      </nav>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { NAV_ITEMS } from '@/constants/nav'

const route = useRoute()
const mobileOpen = ref(false)

function isActive(path: string): boolean {
  return route.path.startsWith(path)
}
</script>
