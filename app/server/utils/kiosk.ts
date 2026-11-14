import type { H3Event } from 'h3'
import { and, desc, eq, gte, isNull, lte } from 'drizzle-orm'

const LAST_SEEN_UPDATE_MS = 60_000

// A paired, not revoked tablet. Revoking takes effect at the next request
export async function requireKiosk(event: H3Event) {
  const session = await requireUserSession(event)
  const deviceId = session.user.kind === 'kiosk' ? session.user.deviceId : undefined
  if (!deviceId) {
    throw createError({ statusCode: 403, statusMessage: 'Tablet session required' })
  }
  const db = useDb()
  const device = db.select().from(schema.device).where(eq(schema.device.id, deviceId)).get()
  if (!device?.pairedAt || device.revokedAt) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, statusMessage: 'Tablet not paired' })
  }
  const now = new Date()
  if (!device.lastSeenAt || now.getTime() - device.lastSeenAt.getTime() > LAST_SEEN_UPDATE_MS) {
    db.update(schema.device).set({ lastSeenAt: now }).where(eq(schema.device.id, deviceId)).run()
  }
  return { session, device }
}

export function currentNotice() {
  return useDb().select().from(schema.noticeVersion).orderBy(desc(schema.noticeVersion.id)).limit(1).get()
}

// The visitor signed the version shown on the tablet: if an admin published
// a new one meanwhile, the tablet must show it before signing
export function requireCurrentNotice(noticeVersionId: number) {
  if (currentNotice()?.id !== noticeVersionId) {
    throw createError({ statusCode: 409, statusMessage: 'notice_changed' })
  }
}

export function eventsToday() {
  const today = localDate(new Date())
  return useDb()
    .select({ id: schema.event.id, name: schema.event.name })
    .from(schema.event)
    .where(and(lte(schema.event.startDate, today), gte(schema.event.endDate, today)))
    .orderBy(schema.event.name)
    .all()
}

export function requireEventToday(eventId: number) {
  if (!eventsToday().some((event) => event.id === eventId)) {
    throw createError({ statusCode: 404, statusMessage: 'No event with this id today' })
  }
}

export function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// The open visit of a guest today, if any
export function openVisitToday(guestId: number) {
  return useDb()
    .select({ id: schema.visit.id })
    .from(schema.visit)
    .where(
      and(
        eq(schema.visit.eventGuestId, guestId),
        gte(schema.visit.checkInAt, startOfToday()),
        isNull(schema.visit.checkOutAt)
      )
    )
    .get()
}

// Searches from the tablet: at least 3 letters, a few results, a few
// searches a minute, so nobody can list the names at the entrance
export const SEARCH_MIN_LENGTH = 3
export const SEARCH_MAX_RESULTS = 5

export function searchLimit(deviceId: number) {
  rateLimit(`search:${deviceId}`, 60, 60_000)
}
