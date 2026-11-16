import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const now = new Date()
  return useDb()
    .select()
    .from(schema.device)
    .orderBy(desc(schema.device.id))
    .all()
    .map((device) => ({
      id: device.id,
      name: device.name,
      status: deviceStatus(device, now),
      pairingExpiresAt: device.pairingExpiresAt,
      pairedAt: device.pairedAt,
      lastSeenAt: device.lastSeenAt,
      revokedAt: device.revokedAt
    }))
})
