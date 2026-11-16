import { and, eq, isNull } from 'drizzle-orm'

// The tablet loses access at its next request
export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const id = parseId(event)
  const result = useDb()
    .update(schema.device)
    .set({ revokedAt: new Date(), pairingCodeHash: null, pairingExpiresAt: null })
    .where(and(eq(schema.device.id, id), isNull(schema.device.revokedAt)))
    .run()
  if (!result.changes) {
    throw createError({ statusCode: 409, statusMessage: 'Device not found or already revoked' })
  }
  logAudit(session, { action: 'device.revoke', deviceId: id })
  return { ok: true }
})
