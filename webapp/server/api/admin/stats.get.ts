import { and, count, gt, gte, isNotNull, isNull, lte } from 'drizzle-orm'
import type { DashboardStats } from '~~/shared/types/admin'

// The counters of the dashboard. Days are local to the office
export default defineEventHandler(async (event): Promise<DashboardStats> => {
  await requireAdmin(event)
  const db = useDb()
  const { visit, event: ev, device } = schema
  const today = localDate(new Date())
  const startToday = startOfToday()
  const start30Days = new Date(startToday.getFullYear(), startToday.getMonth(), startToday.getDate() - 29)

  const countVisits = (where: ReturnType<typeof and>) => db.select({ n: count() }).from(visit).where(where).get()!.n
  const countEvents = (where: ReturnType<typeof and>) => db.select({ n: count() }).from(ev).where(where).get()!.n

  return {
    present: countVisits(isNull(visit.checkOutAt)),
    visitsToday: countVisits(gte(visit.checkInAt, startToday)),
    visitsLast30Days: countVisits(gte(visit.checkInAt, start30Days)),
    eventsToday: countEvents(and(lte(ev.startDate, today), gte(ev.endDate, today))),
    upcomingEvents: countEvents(gt(ev.startDate, today)),
    pairedTablets: db
      .select({ n: count() })
      .from(device)
      .where(and(isNotNull(device.pairedAt), isNull(device.revokedAt)))
      .get()!.n
  }
})
