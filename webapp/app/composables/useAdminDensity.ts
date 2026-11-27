import { createSharedComposable } from '@vueuse/core'
import { getPreference, savePreference } from '@nethesis/vue-components'

type Density = 'standard' | 'compact'

// Density of the admin pages, as in My Nethesis: the compact view tightens
// every spacing (html.compact in main.css), keeping the font sizes. Chosen by
// each admin and saved in this browser for that admin (local storage entry
// "preferences-<username>"). The tablet pages, which do not use it, drop it
export const useAdminDensity = createSharedComposable(() => {
  const { user } = useUserSession()
  const isCompact = shallowRef(false)

  watch(
    () => user.value?.username,
    (username) => {
      isCompact.value = username ? load(username) === 'compact' : false
    },
    { immediate: true }
  )

  watchEffect(() => document.documentElement.classList.toggle('compact', isCompact.value))
  onScopeDispose(() => document.documentElement.classList.remove('compact'))

  function load(username: string): Density {
    try {
      return getPreference('density', username) === 'compact' ? 'compact' : 'standard'
    } catch {
      // storage blocked or not valid: the standard view
      return 'standard'
    }
  }

  function toggleDensity() {
    isCompact.value = !isCompact.value
    const username = user.value?.username
    if (!username) return
    try {
      savePreference('density', isCompact.value ? 'compact' : 'standard', username)
    } catch {
      // storage blocked: the view lasts until the page is left
    }
  }

  return { isCompact, toggleDensity }
})
