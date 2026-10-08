<template>
  <aside class="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0 hidden lg:flex">
    <div class="h-16 flex items-center gap-3 px-6 border-b border-gray-200">
      <i class="pi pi-cart-plus text-2xl text-orange-600"></i>
      <span class="font-display font-bold text-lg text-gray-900 tracking-tight">Cloud Kitchen</span>
    </div>
    <nav class="flex-1 py-4 px-3 space-y-1">
      <router-link
        v-for="item in NAV_ITEMS"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
        :class="
          isActive(item.path) ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
        "
      >
        <span class="text-lg" v-html="item.icon"></span>
        {{ item.label }}
      </router-link>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { NAV_ITEMS } from '@/constants/nav'

const route = useRoute()

function isActive(path: string): boolean {
  return route.path.startsWith(path)
}
</script>
