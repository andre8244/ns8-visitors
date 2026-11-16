import type { UserSession } from '#auth-utils'
import { z } from 'zod'

export const settingsSchema = z.object({
  // Personal data older than this is deleted
  retentionMonths: z.number().int().min(1).max(120),
  // Open visits are closed automatically at this local time
  autoCheckoutTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  // Theme of the tablet pages
  kioskTheme: z.enum(['light', 'dark'])
})

type SettingsValues = z.infer<typeof settingsSchema>

export const defaultSettings: SettingsValues = {
  retentionMonths: 12,
  autoCheckoutTime: '20:00',
  kioskTheme: 'light'
}

export function getSettings(): SettingsValues {
  const rows = useDb().select().from(schema.setting).all()
  const settings = { ...defaultSettings }
  for (const row of rows) {
    const key = row.key as keyof SettingsValues
    if (!(key in settingsSchema.shape)) {
      continue
    }
    // A value that no longer validates falls back to the default
    const parsed = settingsSchema.shape[key].safeParse(JSON.parse(row.value))
    if (parsed.success) {
      Object.assign(settings, { [key]: parsed.data })
    }
  }
  return settings
}

export function updateSettings(session: UserSession, patch: Partial<SettingsValues>) {
  const values = settingsSchema.partial().parse(patch)
  const db = useDb()
  db.transaction((tx) => {
    for (const [key, value] of Object.entries(values)) {
      tx.insert(schema.setting)
        .values({ key, value: JSON.stringify(value) })
        .onConflictDoUpdate({ target: schema.setting.key, set: { value: JSON.stringify(value) } })
        .run()
    }
  })
  logAudit(session, { action: 'settings.update', details: values })
  return getSettings()
}
