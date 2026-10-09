<template>
  <nav class="py-4 px-3 space-y-1">
    <router-link
      v-for="item in NAV_ITEMS"
      :key="item.path"
      :to="item.path"
      class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative"
      :class="isActive(item.path) ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-100'"
      @click="$emit('navigate')"
    >
      <span
        v-if="isActive(item.path)"
        class="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-orange-600"
      />
      <i :class="[NAV_ICON_CLASS[item.icon], 'text-lg']" />
      {{ item.label }}
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { NAV_ITEMS, NAV_ICON_CLASS } from '@/constants/nav'

defineEmits<{ navigate: [] }>()

const route = useRoute()

function isActive(path: string): boolean {
  return route.path.startsWith(path)
}
</script>
