<template>
  <aside class="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0 hidden lg:flex">
    <div class="h-14 flex items-center gap-3 px-6 border-b border-gray-200">
      <i class="pi pi-cart-plus text-2xl text-orange-600"></i>
      <span class="font-display font-bold text-lg text-gray-900 tracking-tight">Cloud Kitchen</span>
    </div>
    <NavList />
  </aside>
</template>

<script setup lang="ts">
import NavList from '@/components/ui/NavList.vue'
</script>
