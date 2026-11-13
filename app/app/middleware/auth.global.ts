export default defineNuxtRouteMiddleware((to) => {
  // The tablet pages use their own device session (phase 4)
  if (to.path === '/login' || to.path.startsWith('/kiosk')) {
    return
  }
  const { loggedIn, user } = useUserSession()
  if (!loggedIn.value || user.value?.kind !== 'admin') {
    return navigateTo('/login')
  }
  if (to.path === '/') {
    return navigateTo('/admin')
  }
})
