<template>
  <aside class="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0 hidden lg:flex">
    <div class="h-14 flex items-center gap-3 px-6 border-b border-gray-200">
      <i class="pi pi-cart-plus text-2xl text-orange-600"></i>
      <span class="font-display font-bold text-lg text-gray-900 tracking-tight">Cloud Kitchen</span>
    </div>
    <NavList />
    <div class="mt-auto border-t border-gray-200 py-3 px-3 space-y-1">
      <p class="px-3 pb-1 font-mono text-[10px] uppercase tracking-wider text-gray-400">Customer</p>
      <router-link
        to="/track"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        @click="$emit('navigate')"
      >
        <i class="pi pi-search text-lg" />
        Track Order
      </router-link>
      <router-link
        to="/portal"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        @click="$emit('navigate')"
      >
        <i class="pi pi-list text-lg" />
        My Orders
      </router-link>
    </div>
  </aside>
</template>

<script setup lang="ts">
import NavList from '@/components/ui/NavList.vue'

defineEmits<{ navigate: [] }>()
</script>
