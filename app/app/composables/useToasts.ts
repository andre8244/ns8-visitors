import type { NeNotificationV2 } from '@nethesis/vue-components'

const DURATION_MS = 5000
// Wait for a drawer or a modal to close before showing the toast
const AFTER_DIALOG_MS = 500

export function useToasts() {
  const toasts = useState<NeNotificationV2[]>('toasts', () => [])

  function remove(id: string) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function showSuccess(title: string, description?: string, { afterDialog = false } = {}) {
    const id = crypto.randomUUID()
    setTimeout(() => {
      toasts.value = [...toasts.value, { id, kind: 'success', title, description, timestamp: new Date(), isShown: true }]
      setTimeout(() => remove(id), DURATION_MS)
    }, afterDialog ? AFTER_DIALOG_MS : 0)
  }

  return { toasts: readonly(toasts), showSuccess, remove }
}
