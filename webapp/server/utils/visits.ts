import { and, desc, eq, gte, isNull, lt, or, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'

export const visitFiltersSchema = z.object({
  from: dateField.optional(),
  to: dateField.optional(),
  q: z.string().trim().max(100).optional(),
  eventId: idField.optional(),
  present: z.enum(['true', 'false']).optional()
})

export type VisitFilters = z.infer<typeof visitFiltersSchema>

export function visitConditions(filters: VisitFilters) {
  const { visit } = schema
  const conditions: (SQL | undefined)[] = []
  if (filters.from) {
    conditions.push(gte(visit.checkInAt, startOfDay(filters.from)))
  }
  if (filters.to) {
    const end = startOfDay(filters.to)
    end.setDate(end.getDate() + 1)
    conditions.push(lt(visit.checkInAt, end))
  }
  if (filters.q) {
    const pattern = containsPattern(normalizeName(filters.q))
    conditions.push(
      or(
        sql`${visit.searchName} LIKE ${pattern} ESCAPE '\\'`,
        sql`lower(${visit.company}) LIKE ${pattern} ESCAPE '\\'`
      )
    )
  }
  if (filters.eventId) {
    conditions.push(eq(visit.eventId, filters.eventId))
  }
  if (filters.present === 'true') {
    conditions.push(isNull(visit.checkOutAt))
  }
  return and(...conditions)
}

// Visits without the signature image, newest first
export function selectVisits(filters: VisitFilters) {
  const { visit, event } = schema
  return useDb()
    .select({
      id: visit.id,
      firstName: visit.firstName,
      lastName: visit.lastName,
      company: visit.company,
      host: visit.host,
      searchName: visit.searchName,
      eventId: visit.eventId,
      eventName: event.name,
      signed: sql<boolean>`${visit.signature} IS NOT NULL`.mapWith(Boolean),
      checkInAt: visit.checkInAt,
      checkOutAt: visit.checkOutAt,
      checkOutBy: visit.checkOutBy
    })
    .from(visit)
    .leftJoin(event, eq(visit.eventId, event.id))
    .where(visitConditions(filters))
    .orderBy(desc(visit.checkInAt), desc(visit.id))
}
