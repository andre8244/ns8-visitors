import { eq } from 'drizzle-orm'

// A new code for a tablet not paired yet. A paired tablet cannot be paired
// again: revoke it and create a new one
export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const id = parseId(event)
  const device = useDb().select().from(schema.device).where(eq(schema.device.id, id)).get()
  if (!device) {
    notFound('Device')
  }
  if (device.pairedAt || device.revokedAt) {
    throw createError({ statusCode: 409, statusMessage: 'Device already paired or revoked' })
  }
  logAudit(session, { action: 'device.new_pairing_code', deviceId: id })
  return { id, name: device.name, ...newPairingCode(id) }
})
