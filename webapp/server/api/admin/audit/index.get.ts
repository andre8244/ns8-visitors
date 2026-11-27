import { and, count, desc, eq, gte, inArray, lt, type SQL } from 'drizzle-orm'
import { z } from 'zod'

// A filter with several values: once in the query string for each value
const listField = <T extends z.ZodType<string>>(item: T) =>
  z
    .union([item, z.array(item).max(50)])
    .transform((value) => (Array.isArray(value) ? value : [value]))
    .optional()

const querySchema = z.object({
  from: dateField.optional(),
  to: dateField.optional(),
  actor: listField(z.string().max(100)),
  action: listField(z.string().regex(/^[a-z_.]+$/)),
  via: listField(z.enum(['ldap', 'kiosk', 'system'])),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
})

// The audit log, newest first. Viewing it is not recorded, as the other lists
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { page, pageSize, ...filters } = await getValidatedQuery(event, querySchema.parse)
  const { auditLog } = schema
  const conditions: (SQL | undefined)[] = []
  if (filters.from) {
    conditions.push(gte(auditLog.at, startOfDay(filters.from)))
  }
  if (filters.to) {
    const end = startOfDay(filters.to)
    end.setDate(end.getDate() + 1)
    conditions.push(lt(auditLog.at, end))
  }
  if (filters.actor?.length) conditions.push(inArray(auditLog.actor, filters.actor))
  if (filters.action?.length) conditions.push(inArray(auditLog.action, filters.action))
  if (filters.via?.length) conditions.push(inArray(auditLog.via, filters.via))
  const where = and(...conditions)

  const db = useDb()
  const total = db.select({ total: count() }).from(auditLog).where(where).get()!.total
  const entries = db
    .select({
      id: auditLog.id,
      at: auditLog.at,
      actor: auditLog.actor,
      via: auditLog.via,
      action: auditLog.action,
      visitId: auditLog.visitId,
      eventId: auditLog.eventId,
      eventName: schema.event.name,
      deviceId: auditLog.deviceId,
      deviceName: schema.device.name,
      details: auditLog.details
    })
    .from(auditLog)
    .leftJoin(schema.event, eq(auditLog.eventId, schema.event.id))
    .leftJoin(schema.device, eq(auditLog.deviceId, schema.device.id))
    .where(where)
    .orderBy(desc(auditLog.at), desc(auditLog.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all()
    .map((entry) => ({ ...entry, details: entry.details ? (JSON.parse(entry.details) as Record<string, unknown>) : null }))
  // The options of the user filter
  const actors = db
    .selectDistinct({ actor: auditLog.actor })
    .from(auditLog)
    .orderBy(auditLog.actor)
    .all()
    .map((row) => row.actor)
  return { entries, total, actors }
})
