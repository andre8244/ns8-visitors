import { eq } from 'drizzle-orm'

// The guests are deleted with the event; the visits stay in the register
export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const id = parseId(event)
  const result = useDb().delete(schema.event).where(eq(schema.event.id, id)).run()
  if (!result.changes) {
    notFound('Event')
  }
  logAudit(session, { action: 'event.delete', details: { eventId: id } })
  return { ok: true }
})
