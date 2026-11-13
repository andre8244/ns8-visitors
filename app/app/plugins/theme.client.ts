export default defineNuxtPlugin(() => {
  const { apply, storedTheme } = useTheme()
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  const systemTheme = () => (query.matches ? 'dark' : 'light')

  apply(storedTheme() ?? systemTheme())
  // Follow the operating system until a theme is chosen
  query.addEventListener('change', () => {
    if (!storedTheme()) {
      apply(systemTheme())
    }
  })
})
