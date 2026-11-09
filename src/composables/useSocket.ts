import { ref, onUnmounted } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/api/supabase'
import type { OrderUpdatePayload } from '@/types'

type Handler = (payload: OrderUpdatePayload) => void

export interface SocketLike {
  on: (event: 'order:update', handler: Handler) => void
  off: (event: 'order:update', handler: Handler) => void
}

const listeners = new Set<Handler>()
const singletonConnected = ref(false)
const singletonError = ref<string | null>(null)

let channel: RealtimeChannel | null = null
let refCount = 0

const socket: SocketLike = {
  on: (_event, handler) => {
    listeners.add(handler)
  },
  off: (_event, handler) => {
    listeners.delete(handler)
  },
}

function dispatch(payload: OrderUpdatePayload) {
  listeners.forEach((handler) => handler(payload))
}

function getChannel(): RealtimeChannel {
  if (channel) return channel

  channel = supabase
    .channel('orders-feed')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        const row = payload.new as Partial<OrderUpdatePayload> | undefined
        if (!row?.id || !row.status || row.orderNumber == null) return
        dispatch({
          id: row.id,
          status: row.status,
          orderNumber: row.orderNumber,
          customerId: row.customerId,
        })
      },
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        singletonConnected.value = true
        singletonError.value = null
      } else if (status === 'CHANNEL_ERROR') {
        singletonConnected.value = false
        singletonError.value = err?.message ?? 'Realtime channel error'
      } else if (status === 'TIMED_OUT') {
        singletonConnected.value = false
        singletonError.value = 'Realtime channel timed out'
      } else if (status === 'CLOSED') {
        singletonConnected.value = false
      }
    })

  return channel
}

export function useSocket() {
  getChannel()
  refCount++

  onUnmounted(() => {
    refCount--
    if (refCount <= 0 && channel) {
      supabase.removeChannel(channel)
      channel = null
      listeners.clear()
      singletonConnected.value = false
    }
  })

  return {
    socket,
    connected: singletonConnected,
    error: singletonError,
  }
}

export function disconnectSocket() {
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
  }
  listeners.clear()
  singletonConnected.value = false
}
