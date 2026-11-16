import type { UserSession } from '#auth-utils'

// Never put personal data (names, companies) in details: the audit log
// must not keep what the retention job deletes. A null session is the
// application itself (automatic jobs).
export function logAudit(
  session: UserSession | null,
  entry: { action: string; visitId?: number; eventId?: number; deviceId?: number; details?: unknown }
) {
  useDb()
    .insert(schema.auditLog)
    .values({
      actor: session?.user?.username ?? session?.user?.name ?? 'system',
      via: session?.via ?? 'system',
      action: entry.action,
      visitId: entry.visitId,
      eventId: entry.eventId,
      deviceId: entry.deviceId,
      details: entry.details === undefined ? null : JSON.stringify(entry.details)
    })
    .run()
}
