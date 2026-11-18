import { useI18n } from 'vue-i18n'
import type { Visit } from '~~/shared/types/admin'

// Download the visits matching the filters as a CSV file for spreadsheets
export function useVisitsExport() {
  const { t } = useI18n()
  const { api, errorText } = useApi()
  const exporting = shallowRef(false)
  const exportError = shallowRef('')

  async function exportCsv(filters: Record<string, string>) {
    exporting.value = true
    exportError.value = ''
    try {
      const query = Object.fromEntries(Object.entries(filters).filter(([, value]) => value))
      const visits = await api<Visit[]>('/api/admin/visits/export', { query })
      const rows = [
        [
          t('visits.first_name'),
          t('visits.last_name'),
          t('visits.company'),
          t('visits.host'),
          t('visits.event'),
          t('visits.check_in'),
          t('visits.check_out_column'),
          t('visits.check_out_by_column')
        ],
        ...visits.map((visit) => [
          visit.firstName,
          visit.lastName,
          visit.company,
          visit.host,
          visit.eventName,
          formatDateTimeIso(visit.checkInAt),
          formatDateTimeIso(visit.checkOutAt),
          visit.checkOutBy ? t(`visits.check_out_by.${visit.checkOutBy}`) : ''
        ])
      ]
      const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `${t('register.file_name')}-${todayDate()}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      exportError.value = errorText(err)
    } finally {
      exporting.value = false
    }
  }

  return { exporting, exportError, exportCsv }
}
