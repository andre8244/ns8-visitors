import { useI18n } from 'vue-i18n'

type FetchError = { statusCode?: number; status?: number }

export function errorStatus(error: unknown) {
  const err = error as FetchError | undefined
  return err?.statusCode ?? err?.status
}

// API calls of the admin pages: an expired session goes back to the sign-in
// page. So does the session of a tablet paired in this browser meanwhile,
// kept: the sign-in page tells that signing in replaces it
export function useApi() {
  const { t } = useI18n()
  const { clear, fetch } = useUserSession()

  const api = createApiClient({
    401: async () => {
      await clear()
      await navigateTo('/login')
    },
    403: async () => {
      await fetch()
      await navigateTo('/login')
    }
  })

  // Description of an error that the page does not handle by itself
  function errorText(error: unknown) {
    const status = errorStatus(error)
    return status ? t('errors.generic') : t('errors.network')
  }

  return { api, errorText }
}
