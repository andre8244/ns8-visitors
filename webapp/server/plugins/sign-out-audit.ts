// An admin signs out with the endpoint of nuxt-auth-utils, which has no hook
// of its own: its clearing of the session is recorded here. The other
// clearings, of an expired or revoked session, are not sign-outs
export default defineNitroPlugin(() => {
  sessionHooks.hook('clear', (session, event) => {
    if (event.path === '/api/_auth/session' && event.method === 'DELETE' && session.user?.kind === 'admin') {
      logAudit(session, { action: 'auth.sign_out' })
    }
  })
})
