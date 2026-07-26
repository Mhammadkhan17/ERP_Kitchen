import { ref, computed, onUnmounted } from 'vue'

export function useTimer(fromIso: string) {
  const elapsed = ref(0)
  let interval: ReturnType<typeof setInterval> | null = null

  function start() {
    const startTime = new Date(fromIso).getTime()
    elapsed.value = Math.floor((Date.now() - startTime) / 1000)
    interval = setInterval(() => {
      elapsed.value = Math.floor((Date.now() - startTime) / 1000)
    }, 1000)
  }

  function stop() {
    if (interval) clearInterval(interval)
  }

  const formatted = computed(() => {
    const m = Math.floor(elapsed.value / 60)
    const s = elapsed.value % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  const isUrgent = computed(() => elapsed.value > 900)
  const isWarning = computed(() => elapsed.value > 600 && elapsed.value <= 900)

  start()
  onUnmounted(stop)

  return { elapsed, formatted, isUrgent, isWarning, stop }
}
