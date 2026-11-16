import { createSharedComposable, useDark, useToggle } from '@vueuse/core'

// Theme of the admin pages: the choice of this browser, else the one of the
// operating system. The tablet pages apply the theme set by the admins.
export const useAdminTheme = createSharedComposable(() => {
  const isDark = useDark({ storageKey: 'visitors-theme', valueDark: 'dark', valueLight: '' })
  const toggleTheme = useToggle(isDark)
  return { isDark, toggleTheme }
})
