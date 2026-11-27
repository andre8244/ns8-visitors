import { count } from 'drizzle-orm'
import { z } from 'zod'

const querySchema = visitFiltersSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { page, pageSize, ...filters } = await getValidatedQuery(event, querySchema.parse)
  const total = useDb().select({ total: count() }).from(schema.visit).where(visitConditions(filters)).get()!.total
  const visits = selectVisits(filters)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all()
  return { visits, total }
})
