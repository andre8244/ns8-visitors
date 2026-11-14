import { eq } from 'drizzle-orm'
import { z } from 'zod'

const bodySchema = z.object({ searchName: z.string().trim().min(1).max(250) })

// Delete every visit (with its signature) and every event registration of a
// person, on request of the person (GDPR right to erasure)
export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const { searchName } = await readValidatedBody(event, bodySchema.parse)
  const counts = useDb().transaction((tx) => ({
    visits: tx.delete(schema.visit).where(eq(schema.visit.searchName, searchName)).run().changes,
    guests: tx.delete(schema.eventGuest).where(eq(schema.eventGuest.searchName, searchName)).run().changes
  }))
  useSqlite().pragma('wal_checkpoint(TRUNCATE)')
  logAudit(session, { action: 'person.delete', details: counts })
  return counts
})
