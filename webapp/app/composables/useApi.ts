import { useI18n } from 'vue-i18n'

type FetchError = { statusCode?: number; status?: number }

export function errorStatus(error: unknown) {
  const err = error as FetchError | undefined
  return err?.statusCode ?? err?.status
}

// API calls of the admin pages: an expired session goes back to the sign-in page
export function useApi() {
  const { t } = useI18n()
  const { clear } = useUserSession()

  const api = createApiClient(async () => {
    await clear()
    await navigateTo('/login')
  }, [401])

  // Description of an error that the page does not handle by itself
  function errorText(error: unknown) {
    const status = errorStatus(error)
    return status ? t('errors.generic') : t('errors.network')
  }

  return { api, errorText }
}
