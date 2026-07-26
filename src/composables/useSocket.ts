import { ref, markRaw, onUnmounted } from 'vue'
import { io, type Socket } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_URL
  ?? `http://localhost:${import.meta.env.VITE_WS_PORT ?? '3001'}`

let singletonSocket: Socket | null = null
let singletonConnected = ref(false)
let singletonError = ref<string | null>(null)
let refCount = 0

function createSocket(): Socket {
  const socket = io(WS_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    randomizationFactor: 0.5,
    reconnectionAttempts: Infinity,
  })

  socket.on('connect', () => {
    singletonConnected.value = true
    singletonError.value = null
  })

  socket.on('connect_error', (err: Error) => {
    singletonError.value = err.message
  })

  socket.on('disconnect', () => {
    singletonConnected.value = false
  })

  return socket
}

function getSocket(): Socket {
  if (!singletonSocket?.connected) {
    singletonSocket?.removeAllListeners()
    singletonSocket?.disconnect()
    singletonSocket = markRaw(createSocket())
  }
  return singletonSocket
}

export function useSocket() {
  const socket = getSocket()
  refCount++

  onUnmounted(() => {
    refCount--
    if (refCount <= 0) {
      singletonSocket?.removeAllListeners()
      singletonSocket?.disconnect()
      singletonSocket = null
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
  singletonSocket?.removeAllListeners()
  singletonSocket?.disconnect()
  singletonSocket = null
  singletonConnected.value = false
}
