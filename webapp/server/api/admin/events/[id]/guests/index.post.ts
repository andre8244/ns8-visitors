import { eq } from 'drizzle-orm'
import { z } from 'zod'

const bodySchema = z.object({
  guests: z.array(personSchema).min(1).max(MAX_GUESTS_PER_REQUEST)
})

// Add guests typed one by one or imported from a CSV file
export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const eventId = parseId(event)
  const { guests } = await readValidatedBody(event, bodySchema.parse)
  const db = useDb()
  if (!db.select({ id: schema.event.id }).from(schema.event).where(eq(schema.event.id, eventId)).get()) {
    notFound('Event')
  }
  db.insert(schema.eventGuest)
    .values(guests.map((guest) => ({ ...guest, eventId, searchName: searchNameOf(guest) })))
    .run()
  logAudit(session, { action: 'event.add_guests', eventId, details: { count: guests.length } })
  return { added: guests.length }
})
