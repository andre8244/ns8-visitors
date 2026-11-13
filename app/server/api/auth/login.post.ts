import { z } from 'zod'

const bodySchema = z.object({
  username: z.string().regex(/^[\w.-]+$/),
  password: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const { username, password } = await readValidatedBody(event, bodySchema.parse)
  const ldapUser = await ldapAuthenticate(username, password).catch((error) => {
    console.error('LDAP authentication error:', error)
    throw createError({ statusCode: 503, statusMessage: 'LDAP server unavailable' })
  })
  if (!ldapUser) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }
  if (!ldapUser.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'User not enabled' })
  }

  await replaceUserSession(event, {
    user: { kind: 'admin', name: ldapUser.name, username },
    via: 'ldap'
  })
  return { kind: 'admin' }
})
