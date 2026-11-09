import { ref, computed, watch, onUnmounted, type MaybeRefOrGetter, toValue } from 'vue'

export function useTimer(from: MaybeRefOrGetter<string>) {
  const elapsed = ref(0)
  let interval: ReturnType<typeof setInterval> | null = null

  function start() {
    stop()
    const startTime = new Date(toValue(from)).getTime()
    elapsed.value = Math.floor((Date.now() - startTime) / 1000)
    interval = setInterval(() => {
      elapsed.value = Math.floor((Date.now() - startTime) / 1000)
    }, 1000)
  }

  function stop() {
    if (interval) clearInterval(interval)
    interval = null
  }

  const formatted = computed(() => {
    const m = Math.floor(elapsed.value / 60)
    const s = elapsed.value % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  const isUrgent = computed(() => elapsed.value > 900)
  const isWarning = computed(() => elapsed.value > 600 && elapsed.value <= 900)

  start()
  watch(() => toValue(from), start)
  onUnmounted(stop)

  return { elapsed, formatted, isUrgent, isWarning, stop }
}
