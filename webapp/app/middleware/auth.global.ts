export default defineNuxtRouteMiddleware(async (to) => {
  // The tablet pages use their own device session (phase 4)
  if (to.path === '/login' || to.path.startsWith('/kiosk')) {
    return
  }
  const { loggedIn, user, fetch } = useUserSession()
  // Single-page app: the session is not loaded yet on the first navigation
  if (!loggedIn.value) {
    await fetch()
  }
  if (!loggedIn.value || user.value?.kind !== 'admin') {
    return navigateTo('/login')
  }
  if (to.path === '/') {
    return navigateTo('/admin')
  }
})
