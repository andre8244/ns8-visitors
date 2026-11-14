import { and, eq, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { session, device } = await requireKiosk(event)
  const id = parseId(event)
  const result = useDb()
    .update(schema.visit)
    .set({ checkOutAt: new Date(), checkOutBy: 'visitor' })
    .where(and(eq(schema.visit.id, id), isNull(schema.visit.checkOutAt)))
    .run()
  if (!result.changes) {
    throw createError({ statusCode: 409, statusMessage: 'Visit not found or already closed' })
  }
  logAudit(session, { action: 'visit.check_out', visitId: id, deviceId: device.id })
  return { ok: true }
})
