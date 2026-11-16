import { eq } from 'drizzle-orm'

// A guest not in the list registers at the tablet: added to the event and
// checked in, with the signature
export default defineEventHandler(async (event) => {
  const { session, device } = await requireKiosk(event)
  const eventId = parseId(event)
  requireEventToday(eventId)
  const body = await readValidatedBody(event, personSchema.merge(signedSchema).parse)
  requireCurrentNotice(body.noticeVersionId)
  const signature = parseSignature(body.signature)
  const searchName = searchNameOf(body)
  const db = useDb()
  const visit = db.transaction((tx) => {
    const guest = tx
      .insert(schema.eventGuest)
      .values({ eventId, firstName: body.firstName, lastName: body.lastName, company: body.company, searchName, addedOnSite: true })
      .returning({ id: schema.eventGuest.id })
      .get()
    const created = tx
      .insert(schema.visit)
      .values({
        firstName: body.firstName,
        lastName: body.lastName,
        company: body.company,
        searchName,
        eventId,
        eventGuestId: guest.id,
        noticeVersionId: body.noticeVersionId,
        signature,
        checkInAt: new Date(),
        deviceId: device.id
      })
      .returning({ id: schema.visit.id })
      .get()
    tx.update(schema.eventGuest).set({ signedVisitId: created.id }).where(eq(schema.eventGuest.id, guest.id)).run()
    return created
  })
  logAudit(session, { action: 'visit.check_in_walk_in', visitId: visit.id, eventId, deviceId: device.id })
  return { ok: true }
})
