import { randomInt } from 'node:crypto'
import type { DeviceStatus } from '~~/shared/types/admin'
import { eq } from 'drizzle-orm'

// No 0/O, 1/I/L: easy to read and type on the tablet
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8
export const PAIRING_CODE_MINUTES = 10

export function newPairingCode(deviceId: number) {
  const code = Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('')
  const expiresAt = new Date(Date.now() + PAIRING_CODE_MINUTES * 60_000)
  useDb()
    .update(schema.device)
    .set({ pairingCodeHash: hashToken(code), pairingExpiresAt: expiresAt })
    .where(eq(schema.device.id, deviceId))
    .run()
  return { code, expiresAt }
}



export function deviceStatus(
  device: Pick<typeof schema.device.$inferSelect, 'revokedAt' | 'pairedAt' | 'pairingExpiresAt'>,
  now = new Date()
): DeviceStatus {
  if (device.revokedAt) return 'revoked'
  if (device.pairedAt) return 'paired'
  if (device.pairingExpiresAt && device.pairingExpiresAt > now) return 'waiting'
  return 'expired'
}
