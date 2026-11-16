import { z } from 'zod'

const bodySchema = personSchema.merge(signedSchema).extend({
  host: z.string().trim().max(100).optional()
})

// Check-in of a visitor, with the signature on the privacy notice
export default defineEventHandler(async (event) => {
  const { session, device } = await requireKiosk(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  requireCurrentNotice(body.noticeVersionId)
  const signature = parseSignature(body.signature)
  const visit = useDb()
    .insert(schema.visit)
    .values({
      firstName: body.firstName,
      lastName: body.lastName,
      company: body.company,
      host: body.host || null,
      searchName: searchNameOf(body),
      noticeVersionId: body.noticeVersionId,
      signature,
      checkInAt: new Date(),
      deviceId: device.id
    })
    .returning({ id: schema.visit.id })
    .get()
  logAudit(session, { action: 'visit.check_in', visitId: visit.id, deviceId: device.id })
  return { ok: true }
})
