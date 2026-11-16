import { asc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = parseId(event)
  const db = useDb()
  const found = db.select().from(schema.event).where(eq(schema.event.id, id)).get()
  if (!found) {
    notFound('Event')
  }
  const { eventGuest, visit } = schema
  const guests = db
    .select({
      id: eventGuest.id,
      firstName: eventGuest.firstName,
      lastName: eventGuest.lastName,
      company: eventGuest.company,
      searchName: eventGuest.searchName,
      addedOnSite: eventGuest.addedOnSite,
      signedAt: visit.checkInAt
    })
    .from(eventGuest)
    .leftJoin(visit, eq(eventGuest.signedVisitId, visit.id))
    .where(eq(eventGuest.eventId, id))
    .orderBy(asc(eventGuest.lastName), asc(eventGuest.firstName))
    .all()
  return { event: found, guests }
})
