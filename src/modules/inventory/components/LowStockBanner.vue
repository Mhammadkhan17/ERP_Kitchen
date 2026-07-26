<template>
  <div v-if="lowStockItems.length > 0" class="mb-4">
    <Message severity="warn" :closable="false">
      <div class="flex flex-col gap-1">
        <span class="font-semibold text-sm">
          Low Stock Alert — {{ lowStockItems.length }} item{{ lowStockItems.length === 1 ? '' : 's' }}
        </span>
        <ul class="text-sm mt-1 space-y-0.5">
          <li v-for="item in lowStockItems" :key="item.id">
            <span class="font-medium">{{ item.name }}</span>
            — {{ item.currentStock }} / {{ item.reorderLevel }}
            <span class="text-gray-500 text-xs">({{ item.unit }})</span>
          </li>
        </ul>
      </div>
    </Message>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Message from 'primevue/message'
import type { Ingredient } from '@/types'

const props = defineProps<{
  ingredients: Ingredient[]
}>()

const lowStockItems = computed(() =>
  props.ingredients.filter((i) => i.currentStock <= i.reorderLevel),
)
</script>
