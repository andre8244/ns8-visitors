import { and, eq } from 'drizzle-orm'

// Remove a guest from the list; a visit already registered stays in the register
export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const eventId = parseId(event)
  const guestId = parseId(event, 'guestId')
  const result = useDb()
    .delete(schema.eventGuest)
    .where(and(eq(schema.eventGuest.id, guestId), eq(schema.eventGuest.eventId, eventId)))
    .run()
  if (!result.changes) {
    notFound('Guest')
  }
  logAudit(session, { action: 'event.remove_guest', eventId })
  return { ok: true }
})
