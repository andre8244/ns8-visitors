import { asc, desc, eq, gte, lt, sql } from 'drizzle-orm'
import { z } from 'zod'

const querySchema = z.object({
  period: z.enum(['upcoming', 'past']).default('upcoming')
})

// Upcoming: events not ended yet, soonest first. Past: most recent first
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { period } = await getValidatedQuery(event, querySchema.parse)
  const today = localDate(new Date())
  const { event: ev, eventGuest } = schema
  return useDb()
    .select({
      id: ev.id,
      name: ev.name,
      startDate: ev.startDate,
      endDate: ev.endDate,
      guests: sql<number>`count(${eventGuest.id})`.mapWith(Number),
      signedGuests: sql<number>`count(${eventGuest.signedVisitId})`.mapWith(Number)
    })
    .from(ev)
    .leftJoin(eventGuest, eq(eventGuest.eventId, ev.id))
    .where(period === 'upcoming' ? gte(ev.endDate, today) : lt(ev.endDate, today))
    .groupBy(ev.id)
    .orderBy(period === 'upcoming' ? asc(ev.startDate) : desc(ev.startDate), asc(ev.name))
    .all()
})
