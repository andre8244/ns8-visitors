import { z } from 'zod'

const bodySchema = z.object({ bodyMd: z.string().trim().min(1).max(50_000) })

// Publish a new version: the tablet shows it from now on, and the visits
// already signed keep pointing to the version they read
export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const { bodyMd } = await readValidatedBody(event, bodySchema.parse)
  const version = useDb()
    .insert(schema.noticeVersion)
    .values({ bodyMd, publishedBy: session.user.username ?? session.user.name })
    .returning()
    .get()
  logAudit(session, { action: 'notice.publish', details: { noticeVersionId: version.id } })
  return version
})
