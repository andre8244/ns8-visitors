import { and, isNull, sql } from 'drizzle-orm'

// Visitors in the office matching the name typed on the tablet, to check out
export default defineEventHandler(async (event) => {
  const { device } = await requireKiosk(event)
  const { q } = await getValidatedQuery(event, searchQuerySchema.parse)
  const text = normalizeName(q)
  if (text.length < SEARCH_MIN_LENGTH) return []
  searchLimit(device.id)
  const { visit } = schema
  return useDb()
    .select({ id: visit.id, firstName: visit.firstName, lastName: visit.lastName, company: visit.company })
    .from(visit)
    .where(and(isNull(visit.checkOutAt), sql`${visit.searchName} LIKE ${containsPattern(text)} ESCAPE '\\'`))
    .orderBy(visit.lastName, visit.firstName)
    .limit(SEARCH_MAX_RESULTS)
    .all()
})
