import { and, eq, gt, isNull } from 'drizzle-orm'
import { z } from 'zod'

const bodySchema = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{8}$/) })

// Pair this browser with a tablet created by an admin: the code works once,
// within its expiry
export default defineEventHandler(async (event) => {
  rateLimit(`pair:${getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'}`, 10, 60_000, event)
  const { code } = await readValidatedBody(event, bodySchema.parse)
  const db = useDb()
  const now = new Date()
  const device = db
    .select()
    .from(schema.device)
    .where(
      and(
        eq(schema.device.pairingCodeHash, hashToken(code)),
        gt(schema.device.pairingExpiresAt, now),
        isNull(schema.device.pairedAt),
        isNull(schema.device.revokedAt)
      )
    )
    .get()
  if (!device) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired code' })
  }
  db.update(schema.device)
    .set({ pairedAt: now, lastSeenAt: now, pairingCodeHash: null, pairingExpiresAt: null })
    .where(eq(schema.device.id, device.id))
    .run()
  await replaceUserSession(event, {
    user: { kind: 'kiosk', name: device.name, deviceId: device.id },
    via: 'kiosk',
    signedInAt: Date.now()
  })
  logAudit(null, { action: 'device.pair', deviceId: device.id })
  return { name: device.name }
})
