export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const patch = await readValidatedBody(event, settingsSchema.partial().parse)
  return updateSettings(session, patch)
})
