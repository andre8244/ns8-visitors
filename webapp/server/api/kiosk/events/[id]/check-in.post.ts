import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const bodySchema = z.object({
  guestId: z.number().int().positive(),
  // Only on the first day: the guest signs once per event
  signed: signedSchema.optional()
})

export default defineEventHandler(async (event) => {
  const { session, device } = await requireKiosk(event)
  const eventId = parseId(event)
  requireEventToday(eventId)
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = useDb()
  const guest = db
    .select()
    .from(schema.eventGuest)
    .where(and(eq(schema.eventGuest.id, body.guestId), eq(schema.eventGuest.eventId, eventId)))
    .get()
  if (!guest) {
    throw createError({ statusCode: 404, statusMessage: 'Guest not found' })
  }
  if (openVisitToday(guest.id)) {
    throw createError({ statusCode: 409, statusMessage: 'already_checked_in' })
  }
  const needsSignature = !guest.signedVisitId
  if (needsSignature && !body.signed) {
    throw createError({ statusCode: 400, statusMessage: 'signature_required' })
  }
  if (needsSignature) {
    requireCurrentNotice(body.signed!.noticeVersionId)
  }
  const signature = needsSignature ? parseSignature(body.signed!.signature) : null

  const visit = db.transaction((tx) => {
    const created = tx
      .insert(schema.visit)
      .values({
        firstName: guest.firstName,
        lastName: guest.lastName,
        company: guest.company,
        searchName: guest.searchName,
        eventId,
        eventGuestId: guest.id,
        noticeVersionId: needsSignature ? body.signed!.noticeVersionId : null,
        signature,
        checkInAt: new Date(),
        deviceId: device.id
      })
      .returning({ id: schema.visit.id })
      .get()
    if (needsSignature) {
      tx.update(schema.eventGuest).set({ signedVisitId: created.id }).where(eq(schema.eventGuest.id, guest.id)).run()
    }
    return created
  })
  logAudit(session, { action: 'visit.check_in', visitId: visit.id, eventId, deviceId: device.id })
  return { ok: true, signed: needsSignature }
})
