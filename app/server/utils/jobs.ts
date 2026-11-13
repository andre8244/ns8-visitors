import { and, eq, isNull, lt } from 'drizzle-orm'

// Close the visits still open after the closing time of their day
export function autoCheckOut(now: Date) {
  const db = useDb()
  const { autoCheckoutTime } = getSettings()
  const open = db
    .select({ id: schema.visit.id, checkInAt: schema.visit.checkInAt })
    .from(schema.visit)
    .where(isNull(schema.visit.checkOutAt))
    .all()

  let closed = 0
  db.transaction((tx) => {
    for (const visit of open) {
      const at = autoCheckOutAt(visit.checkInAt, autoCheckoutTime)
      if (at <= now) {
        tx.update(schema.visit)
          .set({ checkOutAt: at, checkOutBy: 'auto' })
          .where(and(eq(schema.visit.id, visit.id), isNull(schema.visit.checkOutAt)))
          .run()
        closed++
      }
    }
  })
  if (closed) {
    logAudit(null, { action: 'visit.auto_check_out', details: { count: closed } })
  }
  return closed
}

// Delete the personal data older than the retention period: visits with
// their signatures, events with their guests, audit log rows
export function deleteExpired(now: Date) {
  const db = useDb()
  const { retentionMonths } = getSettings()
  const cutoff = monthsBefore(now, retentionMonths)

  const counts = db.transaction((tx) => ({
    visits: tx.delete(schema.visit).where(lt(schema.visit.checkInAt, cutoff)).run().changes,
    events: tx.delete(schema.event).where(lt(schema.event.endDate, localDate(cutoff))).run().changes,
    auditLog: tx.delete(schema.auditLog).where(lt(schema.auditLog.at, cutoff)).run().changes
  }))

  if (counts.visits || counts.events || counts.auditLog) {
    // secure_delete overwrites the freed pages; the checkpoint also
    // empties the WAL file, which still holds the old pages
    useSqlite().pragma('wal_checkpoint(TRUNCATE)')
    logAudit(null, { action: 'retention.delete', details: { ...counts, cutoff: cutoff.toISOString() } })
  }
  return counts
}
