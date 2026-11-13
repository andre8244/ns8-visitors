import type { H3Event } from 'h3'

export async function requireAdmin(event: H3Event) {
  const session = await requireUserSession(event)
  if (session.user.kind !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin role required' })
  }
  return session
}

export function parseId(event: H3Event) {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }
  return id
}
