import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useSnackbar } from '@/composables/useSnackbar'
import type { Ingredient } from '@/types'

export function useIngredients(filters?: { search?: string; unit?: string }) {
  return useQuery({
    queryKey: ['ingredients', filters],
    queryFn: () => api.ingredients.list(filters),
  })
}

export function useIngredient(id: string) {
  return useQuery({
    queryKey: ['ingredients', id],
    queryFn: () => api.ingredients.get(id),
    enabled: !!id,
  })
}

export function useCreateIngredient() {
  const qc = useQueryClient()
  const snackbar = useSnackbar()
  return useMutation({
    mutationFn: (data: Partial<Ingredient>) => api.ingredients.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      snackbar.success('Ingredient created')
    },
    onError: () => snackbar.error('Failed to create ingredient'),
  })
}

export function useUpdateIngredient() {
  const qc = useQueryClient()
  const snackbar = useSnackbar()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Ingredient> }) =>
      api.ingredients.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      snackbar.success('Ingredient updated')
    },
    onError: () => snackbar.error('Failed to update ingredient'),
  })
}

export function useDeleteIngredient() {
  const qc = useQueryClient()
  const snackbar = useSnackbar()
  return useMutation({
    mutationFn: (id: string) => api.ingredients.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      snackbar.success('Ingredient deleted')
    },
    onError: () => snackbar.error('Failed to delete ingredient'),
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  const snackbar = useSnackbar()
  return useMutation({
    mutationFn: ({ id, delta, reason }: { id: string; delta: number; reason: string }) =>
      api.ingredients.adjustStock(id, delta, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      snackbar.success('Stock adjusted')
    },
    onError: () => snackbar.error('Failed to adjust stock'),
  })
}
