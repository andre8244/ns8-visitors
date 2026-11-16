export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const values = await readValidatedBody(event, eventSchema.parse)
  const created = useDb()
    .insert(schema.event)
    .values({ ...values, createdBy: session.user.username ?? session.user.name })
    .returning()
    .get()
  logAudit(session, { action: 'event.create', eventId: created.id })
  return created
})
