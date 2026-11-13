export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'visitors-theme'

// Admin pages: the theme chosen in this browser, else the one of the
// operating system. The tablet pages apply the theme set by the admin.
export function useTheme() {
  const theme = useState<Theme>('theme', () => 'light')

  function apply(value: Theme) {
    theme.value = value
    document.documentElement.classList.toggle('dark', value === 'dark')
  }

  function storedTheme(): Theme | null {
    try {
      const value = localStorage.getItem(STORAGE_KEY)
      return value === 'light' || value === 'dark' ? value : null
    } catch {
      return null
    }
  }

  function setTheme(value: Theme) {
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // Storage unavailable: the choice lasts until the page is reloaded
    }
    apply(value)
  }

  return { theme, apply, storedTheme, setTheme }
}
