import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useSnackbar } from '@/composables/useSnackbar'
import type { MenuItem, Recipe } from '@/types'

export function useMenuItems() {
  return useQuery({
    queryKey: ['menuItems'],
    queryFn: () => api.menu.items.list(),
  })
}

export function useMenuItem(id: string) {
  return useQuery({
    queryKey: ['menuItems', id],
    queryFn: () => api.menu.items.get(id),
    enabled: !!id,
  })
}

export function useCreateMenuItem() {
  const qc = useQueryClient()
  const snackbar = useSnackbar()
  return useMutation({
    mutationFn: (data: Partial<MenuItem>) => api.menu.items.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menuItems'] })
      snackbar.success('Menu item created')
    },
    onError: () => snackbar.error('Failed to create menu item'),
  })
}

export function useUpdateMenuItem() {
  const qc = useQueryClient()
  const snackbar = useSnackbar()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MenuItem> }) =>
      api.menu.items.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menuItems'] })
      snackbar.success('Menu item updated')
    },
    onError: () => snackbar.error('Failed to update menu item'),
  })
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: () => api.menu.brands.list(),
  })
}

export function useRecipe(menuItemId: string) {
  return useQuery({
    queryKey: ['recipes', menuItemId],
    queryFn: () => api.menu.recipes.get(menuItemId),
    enabled: !!menuItemId,
  })
}

export function useUpsertRecipe() {
  const qc = useQueryClient()
  const snackbar = useSnackbar()
  return useMutation({
    mutationFn: (data: Partial<Recipe>) => api.menu.recipes.upsert(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] })
      snackbar.success('Recipe saved')
    },
    onError: () => snackbar.error('Failed to save recipe'),
  })
}
