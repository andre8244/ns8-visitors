import type { DashboardStats } from '~~/shared/types/admin'

// The counters of the dashboard, loaded again on reload()
export function useDashboardStats() {
  const { api, errorText } = useApi()
  const stats = shallowRef<DashboardStats | null>(null)
  const loading = shallowRef(true)
  const error = shallowRef('')

  async function reload() {
    try {
      stats.value = await api<DashboardStats>('/api/admin/stats')
      error.value = ''
    } catch (err) {
      error.value = errorText(err)
    } finally {
      loading.value = false
    }
  }
  reload()

  return { stats, loading, error, reload }
}
