import { sql } from 'drizzle-orm'
import { blob, check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

const createdAt = () =>
  integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)

// Key/value settings changed by the admins; defaults in server/utils/settings.ts
export const setting = sqliteTable('setting', {
  key: text().primaryKey(),
  value: text().notNull()
})

// Never deleted: holds no personal data, and every signature points to the
// version the visitor read
export const noticeVersion = sqliteTable('notice_version', {
  id: integer().primaryKey({ autoIncrement: true }),
  bodyMd: text('body_md').notNull(),
  publishedBy: text('published_by').notNull(),
  publishedAt: createdAt()
})

// A tablet. The browser session holds only the device id: every request
// checks here that the device is paired and not revoked
export const device = sqliteTable('device', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  pairingCodeHash: text('pairing_code_hash'),
  pairingExpiresAt: integer('pairing_expires_at', { mode: 'timestamp' }),
  pairedAt: integer('paired_at', { mode: 'timestamp' }),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  createdBy: text('created_by').notNull(),
  createdAt: createdAt()
})

export const event = sqliteTable(
  'event',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    startDate: text('start_date').notNull(), // YYYY-MM-DD
    endDate: text('end_date').notNull(), // YYYY-MM-DD
    createdBy: text('created_by').notNull(),
    createdAt: createdAt()
  },
  (table) => [
    check('event_dates', sql`${table.endDate} >= ${table.startDate}`),
    index('event_dates_idx').on(table.startDate, table.endDate)
  ]
)

export const visit = sqliteTable(
  'visit',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    company: text().notNull(),
    // Internal contact, free text
    host: text(),
    // normalizeName(first + ' ' + last), for the searches from the tablet
    searchName: text('search_name').notNull(),
    eventId: integer('event_id').references(() => event.id, { onDelete: 'set null' }),
    eventGuestId: integer('event_guest_id').references((): any => eventGuest.id, { onDelete: 'set null' }),
    // Both null on the days after the first one of an event: the guest
    // signed on the first day
    noticeVersionId: integer('notice_version_id').references(() => noticeVersion.id),
    signature: blob({ mode: 'buffer' }), // PNG image only, no stroke timing or pressure
    checkInAt: integer('check_in_at', { mode: 'timestamp' }).notNull(),
    checkOutAt: integer('check_out_at', { mode: 'timestamp' }),
    checkOutBy: text('check_out_by', { enum: ['visitor', 'reception', 'auto'] }),
    deviceId: integer('device_id').references(() => device.id, { onDelete: 'set null' })
  },
  (table) => [
    check('visit_signature', sql`(${table.signature} IS NULL) = (${table.noticeVersionId} IS NULL)`),
    check('visit_check_out', sql`(${table.checkOutAt} IS NULL) = (${table.checkOutBy} IS NULL)`),
    index('visit_check_in_idx').on(table.checkInAt),
    index('visit_check_out_idx').on(table.checkOutAt),
    index('visit_search_idx').on(table.searchName)
  ]
)

export const eventGuest = sqliteTable(
  'event_guest',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    eventId: integer('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    company: text().notNull(),
    searchName: text('search_name').notNull(),
    // Not in the prepared list: registered at the tablet
    addedOnSite: integer('added_on_site', { mode: 'boolean' }).notNull().default(false),
    // The visit with the signature, on the first day the guest came
    signedVisitId: integer('signed_visit_id').references(() => visit.id, { onDelete: 'set null' }),
    createdAt: createdAt()
  },
  (table) => [index('event_guest_search_idx').on(table.eventId, table.searchName)]
)

// No personal data in details: rows older than the retention period are
// deleted with the visits
export const auditLog = sqliteTable(
  'audit_log',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    actor: text().notNull(),
    via: text({ enum: ['ldap', 'kiosk', 'system'] }).notNull(),
    action: text().notNull(),
    visitId: integer('visit_id').references(() => visit.id, { onDelete: 'set null' }),
    eventId: integer('event_id').references(() => event.id, { onDelete: 'set null' }),
    deviceId: integer('device_id').references(() => device.id, { onDelete: 'set null' }),
    details: text(),
    at: createdAt()
  },
  (table) => [index('audit_log_at_idx').on(table.at)]
)
