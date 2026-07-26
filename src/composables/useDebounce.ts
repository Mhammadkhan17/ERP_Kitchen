import { ref, watch } from 'vue'

export function useDebounce<T>(source: () => T, delay = 300) {
  const debounced = ref(source()) as ReturnType<typeof ref<T>>

  watch(source, () => {
    const timeout = setTimeout(() => {
      debounced.value = source()
    }, delay)
    return () => clearTimeout(timeout)
  }, { immediate: true })

  return debounced
}
