import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const id = parseId(event)
  const values = await readValidatedBody(event, eventSchema.parse)
  const updated = useDb().update(schema.event).set(values).where(eq(schema.event.id, id)).returning().get()
  if (!updated) {
    notFound('Event')
  }
  logAudit(session, { action: 'event.update', eventId: id })
  return updated
})
