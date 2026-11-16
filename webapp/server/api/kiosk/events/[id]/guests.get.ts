import { and, eq, sql } from 'drizzle-orm'

// Guests of an event of today matching the name typed on the tablet
export default defineEventHandler(async (event) => {
  const { device } = await requireKiosk(event)
  const eventId = parseId(event)
  requireEventToday(eventId)
  const { q } = await getValidatedQuery(event, searchQuerySchema.parse)
  const text = normalizeName(q)
  if (text.length < SEARCH_MIN_LENGTH) return []
  searchLimit(device.id)
  const { eventGuest } = schema
  return useDb()
    .select({
      id: eventGuest.id,
      firstName: eventGuest.firstName,
      lastName: eventGuest.lastName,
      company: eventGuest.company,
      signed: sql<boolean>`${eventGuest.signedVisitId} IS NOT NULL`.mapWith(Boolean)
    })
    .from(eventGuest)
    .where(
      and(eq(eventGuest.eventId, eventId), sql`${eventGuest.searchName} LIKE ${containsPattern(text)} ESCAPE '\\'`)
    )
    .orderBy(eventGuest.lastName, eventGuest.firstName)
    .limit(SEARCH_MAX_RESULTS)
    .all()
})
