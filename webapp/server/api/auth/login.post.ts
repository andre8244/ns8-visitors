import { z } from 'zod'

const bodySchema = z.object({
  username: z.string().regex(/^[\w.-]+$/),
  password: z.string().min(1)
})

// Failed sign-ins allowed in the window, from one address and for one user
// name: stops password guessing before it reaches LDAP and its own lockout
const MAX_FAILURES = 10
const FAILURE_WINDOW_MS = 15 * 60_000

export default defineEventHandler(async (event) => {
  const { username, password } = await readValidatedBody(event, bodySchema.parse)
  const ipKey = `login-ip:${getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'}`
  const userKey = `login-user:${username.toLowerCase()}`
  checkLimit(ipKey, MAX_FAILURES, FAILURE_WINDOW_MS, event)
  checkLimit(userKey, MAX_FAILURES, FAILURE_WINDOW_MS, event)
  // Counted before asking LDAP, so parallel requests cannot all pass the
  // check; given back when LDAP is down or the password is right
  countHit(ipKey)
  countHit(userKey)
  const forgive = () => {
    forgetHit(ipKey)
    forgetHit(userKey)
  }

  const ldapUser = await ldapAuthenticate(username, password).catch((error) => {
    console.error('LDAP authentication error:', error)
    forgive()
    throw createError({ statusCode: 503, statusMessage: 'LDAP server unavailable' })
  })
  if (!ldapUser) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }
  // The right password clears the failures of the user
  forgetHit(ipKey)
  resetHits(userKey)
  if (!ldapUser.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'User not enabled' })
  }

  await replaceUserSession(event, {
    user: { kind: 'admin', name: ldapUser.name, username },
    via: 'ldap',
    signedInAt: Date.now()
  })
  return { kind: 'admin' }
})
