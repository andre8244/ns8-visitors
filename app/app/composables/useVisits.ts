import { useI18n } from 'vue-i18n'
import type { Visit } from '~~/shared/types/admin'

export type VisitQuery = {
  q?: string
  from?: string
  to?: string
  present?: 'true'
  page: number
  pageSize: number
}

// One page of visits, loaded again when the query changes or on reload()
export function useVisits(query: () => VisitQuery) {
  const { api, errorText } = useApi()
  const visits = shallowRef<Visit[]>([])
  const total = shallowRef(0)
  const loading = shallowRef(true)
  const error = shallowRef('')

  async function reload() {
    try {
      const params = Object.fromEntries(Object.entries(query()).filter(([, value]) => value !== '' && value !== undefined))
      const result = await api<{ visits: Visit[]; total: number }>('/api/admin/visits', { query: params })
      visits.value = result.visits
      total.value = result.total
      error.value = ''
    } catch (err) {
      error.value = errorText(err)
    } finally {
      loading.value = false
    }
  }

  watch(query, reload, { immediate: true, deep: true })

  return { visits, total, loading, error, reload }
}

// Actions on a visit shared by the pages that list visits
export function useVisitActions(onChange: () => void) {
  const { t } = useI18n()
  const { api, errorText } = useApi()
  const { showSuccess } = useToasts()
  const actionError = shallowRef('')

  async function checkOut(visit: Visit) {
    actionError.value = ''
    try {
      await api(`/api/admin/visits/${visit.id}/check-out`, { method: 'POST' })
      showSuccess(t('visits.checked_out'), t('visits.checked_out_description', { name: fullName(visit) }))
    } catch (err) {
      // 409: closed meanwhile, from the tablet or by the automatic check-out
      if (errorStatus(err) !== 409) {
        actionError.value = errorText(err)
      }
    }
    onChange()
  }

  function personDeleted(name: string) {
    showSuccess(t('visits.person_deleted'), t('visits.person_deleted_description', { name }), { afterDialog: true })
    onChange()
  }

  return { actionError, checkOut, personDeleted }
}
