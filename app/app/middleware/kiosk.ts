// Tablet pages: only a paired tablet, else the pairing page
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user, fetch } = useUserSession()
  if (!loggedIn.value) {
    await fetch()
  }
  const paired = loggedIn.value && user.value?.kind === 'kiosk'
  if (to.path === '/kiosk/pair') {
    return paired ? navigateTo('/kiosk') : undefined
  }
  if (!paired) {
    return navigateTo('/kiosk/pair')
  }
})
