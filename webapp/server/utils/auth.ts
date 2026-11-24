import type { H3Event } from 'h3'

const ADMIN_SESSION_MS = 14 * 24 * 60 * 60 * 1000
// How often LDAP confirms that an admin can still sign in
const ADMIN_CHECK_MS = 60 * 60 * 1000

type AdminSession = Awaited<ReturnType<typeof requireUserSession>>

export async function requireAdmin(event: H3Event) {
  const session = await requireUserSession(event)
  if (session.user.kind !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin role required' })
  }
  if (!session.signedInAt || Date.now() - session.signedInAt > ADMIN_SESSION_MS) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, statusMessage: 'Session expired' })
  }
  if (Date.now() - (session.checkedAt ?? session.signedInAt) > ADMIN_CHECK_MS) {
    return await recheckAdmin(event, session)
  }
  return session
}

// The session ends within an hour when the user is removed from the admin
// group, disabled or deleted. When LDAP is unavailable the session goes on,
// and LDAP is asked again an hour later
async function recheckAdmin(event: H3Event, session: AdminSession) {
  const username = session.user.username ?? ''
  let stillAdmin = true
  try {
    stillAdmin = await ldapIsAdmin(username)
  } catch (error) {
    console.error('LDAP check of an admin session failed:', error)
  }
  if (!stillAdmin) {
    await clearUserSession(event)
    logAudit(session, { action: 'auth.session_revoked' })
    throw createError({ statusCode: 401, statusMessage: 'Session revoked' })
  }
  const checkedAt = Date.now()
  await setUserSession(event, { via: session.via, signedInAt: session.signedInAt, checkedAt })
  return { ...session, checkedAt }
}

export function parseId(event: H3Event, name = 'id') {
  const id = Number(getRouterParam(event, name))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }
  return id
}

export function notFound(what: string): never {
  throw createError({ statusCode: 404, statusMessage: `${what} not found` })
}
