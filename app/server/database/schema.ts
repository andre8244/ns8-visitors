import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

const createdAt = () =>
  integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)

export const auditLog = sqliteTable('audit_log', {
  id: integer().primaryKey({ autoIncrement: true }),
  actor: text().notNull(),
  via: text({ enum: ['ldap', 'kiosk', 'system'] }).notNull(),
  action: text().notNull(),
  details: text(),
  at: createdAt()
})
