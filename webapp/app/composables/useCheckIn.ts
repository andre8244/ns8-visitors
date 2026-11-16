import { useI18n } from 'vue-i18n'

// Sends a check-in and turns its errors into texts for the visitor
export function useCheckIn() {
  const { t } = useI18n()
  const { loadConfig, errorText } = useKiosk()
  const saving = shallowRef(false)
  const error = shallowRef('')

  async function run(request: () => Promise<unknown>) {
    saving.value = true
    error.value = ''
    try {
      await request()
      return true
    } catch (err) {
      const status = errorStatus(err)
      const message = (err as { statusMessage?: string; data?: { statusMessage?: string } })?.data?.statusMessage
      if (status === 409 && message === 'notice_changed') {
        // An admin published a new version: show it before signing again
        await loadConfig()
        error.value = t('kiosk.notice_changed')
      } else if (status === 409 && message === 'already_checked_in') {
        error.value = t('kiosk.already_checked_in')
      } else {
        error.value = errorText(err)
      }
      return false
    } finally {
      saving.value = false
    }
  }

  return { saving, error, run }
}
