import { z } from 'zod'

const bodySchema = z.object({ name: z.string().trim().min(1).max(100) })

// Create a tablet and its pairing code, shown once to the admin
export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const { name } = await readValidatedBody(event, bodySchema.parse)
  const device = useDb()
    .insert(schema.device)
    .values({ name, createdBy: session.user.username ?? session.user.name })
    .returning()
    .get()
  logAudit(session, { action: 'device.create', deviceId: device.id })
  return { id: device.id, name: device.name, ...newPairingCode(device.id) }
})
