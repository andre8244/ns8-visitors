import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const id = parseId(event)
  const row = useDb()
    .select({ signature: schema.visit.signature })
    .from(schema.visit)
    .where(eq(schema.visit.id, id))
    .get()
  if (!row?.signature) {
    notFound('Signature')
  }
  logAudit(session, { action: 'visit.view_signature', visitId: id })
  setResponseHeader(event, 'Content-Type', 'image/png')
  return row.signature
})
