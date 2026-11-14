const MAX_ROWS = 50_000

// All the visits matching the filters: the page builds the CSV file, with
// the column names in the interface language
export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const filters = await getValidatedQuery(event, visitFiltersSchema.parse)
  const visits = selectVisits(filters).limit(MAX_ROWS).all()
  // The text filter can hold a name: record only that it was used
  const { q, ...otherFilters } = filters
  logAudit(session, { action: 'visits.export', details: { ...otherFilters, textFilter: !!q, rows: visits.length } })
  return visits
})
