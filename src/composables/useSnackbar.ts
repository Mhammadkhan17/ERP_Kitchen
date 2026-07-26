import { useToast } from 'primevue/usetoast'

export function useSnackbar() {
  const toast = useToast()

  function success(summary: string, detail?: string) {
    toast.add({ severity: 'success', summary, detail, life: 3000 })
  }

  function error(summary: string, detail?: string) {
    toast.add({ severity: 'error', summary, detail, life: 5000 })
  }

  function info(summary: string, detail?: string) {
    toast.add({ severity: 'info', summary, detail, life: 3000 })
  }

  function warn(summary: string, detail?: string) {
    toast.add({ severity: 'warn', summary, detail, life: 4000 })
  }

  return { success, error, info, warn }
}
