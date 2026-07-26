export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    preparing: 'Preparing',
    ready: 'Ready',
    dispatched: 'Dispatched',
    cancelled: 'Cancelled',
  }
  return labels[status] || status
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'yellow',
    preparing: 'blue',
    ready: 'green',
    dispatched: 'gray',
    cancelled: 'red',
  }
  return colors[status] || 'gray'
}
