import type { H3Event } from 'h3'

const ADMIN_SESSION_MS = 14 * 24 * 60 * 60 * 1000

export async function requireAdmin(event: H3Event) {
  const session = await requireUserSession(event)
  if (session.user.kind !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin role required' })
  }
  if (!session.signedInAt || Date.now() - session.signedInAt > ADMIN_SESSION_MS) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, statusMessage: 'Session expired' })
  }
  return session
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
