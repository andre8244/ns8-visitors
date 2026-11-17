import { useI18n } from 'vue-i18n'

export type KioskConfig = {
  deviceName: string
  theme: 'light' | 'dark'
  notice: { id: number; bodyMd: string } | null
  events: { id: number; name: string }[]
}

// State and API calls of the tablet pages. A revoked tablet goes back to
// the pairing page
export function useKiosk() {
  const { t } = useI18n()
  const config = useState<KioskConfig | null>('kiosk-config', () => null)
  const { clear } = useUserSession()

  const api = createApiClient(async () => {
    await clear()
    await navigateTo('/kiosk/pair')
  }, [401, 403])

  async function loadConfig() {
    config.value = await api<KioskConfig>('/api/kiosk/config')
    document.documentElement.classList.toggle('dark', config.value.theme === 'dark')
    // Read by the script in the page head at the next load
    try {
      localStorage.setItem('visitors-kiosk-theme', config.value.theme)
    } catch {
      // Storage disabled: the theme applies when the configuration loads
    }
  }

  function errorText(error: unknown) {
    const status = errorStatus(error)
    if (!status) return t('kiosk.network_error')
    if (status === 429) return t('kiosk.too_many_requests')
    return t('kiosk.generic_error')
  }

  return { config, api, loadConfig, errorText }
}
