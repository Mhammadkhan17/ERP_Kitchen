import { supabase } from './supabase'
import type { ApiClient } from '@/types/api'

async function unwrap<T>(
  result: PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await result
  if (error) throw new Error(error.message)
  return data as T
}

const now = () => new Date().toISOString()

const withId = <T extends { id?: string }>(data: T): T & { id: string } => ({
  ...data,
  id: data.id ?? crypto.randomUUID(),
})

export const api: ApiClient = {
  customers: {
    list: (params) => {
      let q = supabase.from('customers').select('*')
      if (params?.phone !== undefined && params.phone !== '') q = q.eq('phone', String(params.phone))
      return unwrap(q)
    },
  },

  ingredients: {
    list: (params) => {
      let q = supabase.from('ingredients').select('*')
      if (params?.unit) q = q.eq('unit', params.unit)
      if (params?.search) q = q.ilike('name', `%${params.search}%`)
      return unwrap(q)
    },
    get: (id) => unwrap(supabase.from('ingredients').select('*').eq('id', id).single()),
    create: (data) =>
      unwrap(
        supabase
          .from('ingredients')
          .insert({ ...withId(data), updatedAt: data.updatedAt ?? now() })
          .select('*')
          .single(),
      ),
    update: (id, data) =>
      unwrap(supabase.from('ingredients').update(data).eq('id', id).select('*').single()),
    delete: async (id) => {
      await unwrap(supabase.from('ingredients').delete().eq('id', id))
    },
    adjustStock: async (id, delta, reason) => {
      const ing = await api.ingredients.get(id)
      return api.ingredients.update(id, {
        currentStock: Math.max(0, +(ing.currentStock + delta).toFixed(3)),
        lastAdjustReason: reason,
        lastAdjustedAt: now(),
      })
    },
  },

  orders: {
    list: (params) => {
      let q = supabase.from('orders').select('*')
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null && value !== '') q = q.eq(key, String(value))
        }
      }
      return unwrap(q)
    },
    get: (id) => unwrap(supabase.from('orders').select('*').eq('id', id).single()),
    create: (data) =>
      unwrap(
        supabase
          .from('orders')
          .insert({
            ...withId(data),
            updatedAt: now(),
            timestamps: data.timestamps ?? {
              placedAt: now(),
              startedAt: null,
              readyAt: null,
              dispatchedAt: null,
            },
          })
          .select('*')
          .single(),
      ),
    updateStatus: (id, status) =>
      unwrap(
        supabase
          .from('orders')
          .update({ status, updatedAt: now() })
          .eq('id', id)
          .select('*')
          .single(),
      ),
  },

  menu: {
    items: {
      list: () => unwrap(supabase.from('menu_items').select('*')),
      get: (id) => unwrap(supabase.from('menu_items').select('*').eq('id', id).single()),
      create: (data) =>
        unwrap(supabase.from('menu_items').insert(withId(data)).select('*').single()),
      update: (id, data) =>
        unwrap(supabase.from('menu_items').update(data).eq('id', id).select('*').single()),
      delete: async (id) => {
        await unwrap(supabase.from('menu_items').delete().eq('id', id))
      },
    },
    recipes: {
      get: (menuItemId) =>
        unwrap(
          supabase.from('recipes').select('*').eq('menuItemId', menuItemId).limit(1),
        ).then((rows) => rows[0]),
      upsert: async (data) => {
        const rows = await unwrap(
          supabase.from('recipes').select('*').eq('menuItemId', String(data.menuItemId)).limit(1),
        )
        const existing = rows[0]
        return existing
          ? unwrap(supabase.from('recipes').update(data).eq('id', existing.id).select('*').single())
          : unwrap(supabase.from('recipes').insert(withId(data)).select('*').single())
      },
    },
    brands: {
      list: () => unwrap(supabase.from('brands').select('*')),
    },
  },

  analytics: {
    sales: {
      list: (range) => {
        let q = supabase.from('analytics_sales').select('*')
        if (range?.start) q = q.gte('date', range.start)
        if (range?.end) q = q.lte('date', range.end)
        return unwrap(q)
      },
    },
    wastage: {
      list: () => unwrap(supabase.from('wastage_logs').select('*')),
      create: (data) =>
        unwrap(supabase.from('wastage_logs').insert(withId(data)).select('*').single()),
    },
  },
}
