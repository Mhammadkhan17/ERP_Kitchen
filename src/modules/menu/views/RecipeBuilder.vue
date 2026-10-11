<template>
  <div class="flex flex-col gap-4">
    <AppSkeleton v-if="isLoading" variant="cards" :count="3" />
    <AppErrorState v-else-if="isError" @retry="refetch" />
    <template v-else>
      <PageHeader title="Recipe Builder">
        <template #actions>
          <Button
            label="Back to Menu"
            icon="pi pi-arrow-left"
            severity="secondary"
            @click="$router.push('/menu')"
          />
        </template>
      </PageHeader>

      <AppEmptyState
        v-if="!items.length"
        title="No menu items"
        hint="Add a menu item to configure its recipe"
        icon="pi pi-book"
      />

      <div v-else class="flex flex-col gap-2">
        <div v-for="item in items" :key="item.id" class="card">
          <div
            class="flex items-center justify-between cursor-pointer select-none px-4 py-3"
            @click="toggle(item.id)"
          >
            <span class="font-semibold text-gray-800">{{ item.name }}</span>
            <i
              :class="['pi', openPanels.includes(item.id) ? 'pi-chevron-up' : 'pi-chevron-down']"
            />
          </div>

          <div v-if="openPanels.includes(item.id)" class="border-t px-4 py-3">
            <div
              v-if="recipeData[item.id] && recipeData[item.id].loaded"
              class="flex flex-col gap-4"
            >
              <div class="flex items-center gap-2">
                <label class="text-sm font-medium min-w-24">Servings:</label>
                <InputNumber
                  v-model="recipeData[item.id].servings"
                  :min="1"
                  :step="1"
                  :input-style="{ width: '80px' }"
                />
              </div>

              <div class="border-t pt-2">
                <h3 class="text-sm font-semibold text-gray-600 mb-2">Current Ingredients</h3>
                <div
                  v-if="!recipeData[item.id].ingredients.length"
                  class="text-sm text-gray-400 mb-2"
                >
                  No ingredients added yet.
                </div>
                <div
                  v-for="ing in recipeData[item.id].ingredients"
                  :key="ing.ingredientId"
                  class="flex items-center gap-2 text-sm mb-1"
                >
                  <i class="pi pi-circle-fill text-primary-400 text-xs" />
                  <span>{{ getIngredientName(ing.ingredientId) }}</span>
                  <span class="text-gray-400">-</span>
                  <span class="font-medium">{{ ing.quantity }}</span>
                  <span class="text-gray-400">{{ getIngredientUnit(ing.ingredientId) }}</span>
                </div>
              </div>

              <div class="border-t pt-2">
                <h3 class="text-sm font-semibold text-gray-600 mb-2">Add / Edit Ingredients</h3>
                <IngredientPicker
                  v-model:selected="recipeData[item.id].ingredients"
                  :menu-item-id="item.id"
                />
              </div>

              <div class="flex justify-end pt-2">
                <Button
                  label="Save Recipe"
                  icon="pi pi-check"
                  :loading="upsertMutation.isPending.value"
                  @click="saveRecipe(item.id)"
                />
              </div>
            </div>

            <div v-else class="flex items-center justify-center py-6 text-gray-400">
              <i class="pi pi-spin pi-spinner mr-2" />
              Loading recipe...
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { useMenuItems, useUpsertRecipe, loadRecipe } from '../composables/useMenu'
import { useIngredients } from '@/modules/inventory/composables/useInventory'
import { useSnackbar } from '@/composables/useSnackbar'
import IngredientPicker from '../components/IngredientPicker.vue'
import type { RecipeIngredient } from '@/types'

interface RecipeEditState {
  loaded: boolean
  loading: boolean
  servings: number
  ingredients: RecipeIngredient[]
}

const { data: itemsData, isLoading, isError, refetch } = useMenuItems()
const items = computed(() => itemsData.value ?? [])

const ingredientsQuery = useIngredients()
const ingredientsMap = computed(() => {
  const map: Record<string, { name: string; unit: string }> = {}
  for (const ing of ingredientsQuery.data.value ?? []) {
    map[ing.id] = { name: ing.name, unit: ing.unit }
  }
  return map
})

const recipeData = reactive<Record<string, RecipeEditState>>({})
const openPanels = ref<string[]>([])
const upsertMutation = useUpsertRecipe()
const snackbar = useSnackbar()

async function toggle(id: string) {
  const idx = openPanels.value.indexOf(id)
  if (idx >= 0) {
    openPanels.value.splice(idx, 1)
  } else {
    openPanels.value.push(id)
    if (!recipeData[id] || !recipeData[id].loaded) {
      await loadRecipeState(id)
    }
  }
}

async function loadRecipeState(menuItemId: string) {
  if (!recipeData[menuItemId]) {
    recipeData[menuItemId] = { loaded: false, loading: true, servings: 1, ingredients: [] }
  } else {
    recipeData[menuItemId].loading = true
  }

  try {
    const recipe = await loadRecipe(menuItemId)
    recipeData[menuItemId] = {
      loaded: true,
      loading: false,
      servings: recipe?.servings ?? 1,
      ingredients: recipe?.ingredients?.map((i) => ({ ...i })) ?? [],
    }
  } catch {
    snackbar.error('Failed to load recipe')
    recipeData[menuItemId] = {
      loaded: true,
      loading: false,
      servings: 1,
      ingredients: [],
    }
  }
}

function getIngredientName(id: string): string {
  return ingredientsMap.value[id]?.name ?? id
}

function getIngredientUnit(id: string): string {
  return ingredientsMap.value[id]?.unit ?? ''
}

function saveRecipe(menuItemId: string) {
  const data = recipeData[menuItemId]
  if (!data) return

  upsertMutation.mutate(
    {
      menuItemId,
      servings: data.servings,
      ingredients: data.ingredients,
    },
    {
      onSuccess: (recipe) => {
        recipeData[menuItemId] = {
          loaded: true,
          loading: false,
          servings: recipe?.servings ?? data.servings,
          ingredients:
            recipe?.ingredients?.map((i) => ({ ...i })) ?? data.ingredients.map((i) => ({ ...i })),
        }
      },
    },
  )
}
</script>
