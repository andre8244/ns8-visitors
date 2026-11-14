import { desc } from 'drizzle-orm'

// All the versions of the privacy notice, the current one first
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return useDb().select().from(schema.noticeVersion).orderBy(desc(schema.noticeVersion.id)).all()
})
