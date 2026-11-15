// The automatic jobs run when the server starts: the fixtures are written
// before, then the test checks what the jobs changed
import { readFileSync } from 'node:fs'
import type Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import { signaturePng, startServer, unix, type TestServer } from './server'

let server: TestServer | undefined
afterEach(async () => {
  await server?.stop()
  server = undefined
})

const at = (daysAgo: number, hours: number, minutes = 0) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hours, minutes, 0, 0)
  return date
}

const monthsAgo = (months: number) => {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  return date
}

function addVisit(db: Database.Database, name: string, checkInAt: Date, signature = signaturePng()) {
  return db
    .prepare(
      `INSERT INTO visit (first_name, last_name, company, search_name, notice_version_id, signature, check_in_at)
       VALUES (?, 'Test', 'Company', ?, 1, ?, ?)`
    )
    .run(name, `${name.toLowerCase()} test`, signature, unix(checkInAt)).lastInsertRowid as number
}

const seedNotice = (db: Database.Database) =>
  db.prepare("INSERT INTO notice_version (body_md, published_by) VALUES ('Informativa', 'test')").run()

describe('automatic check-out', () => {
  it('closes the visits of the past days at the closing time', async () => {
    let yesterday = 0
    let today = 0
    server = await startServer({
      seed(db) {
        seedNotice(db)
        yesterday = addVisit(db, 'Yesterday', at(1, 10))
        // Before or after the closing time, it closes later
        today = addVisit(db, 'Today', new Date(Date.now() - 1000))
      }
    })
    const db = server.db()
    const visit = (id: number) =>
      db.prepare('SELECT check_out_at, check_out_by FROM visit WHERE id = ?').get(id) as Record<string, unknown>
    expect(visit(yesterday)).toEqual({ check_out_at: unix(at(1, 20)), check_out_by: 'auto' })
    expect(visit(today)).toEqual({ check_out_at: null, check_out_by: null })
    const audit = db.prepare("SELECT actor, via, details FROM audit_log WHERE action = 'visit.auto_check_out'").get()
    expect(audit).toEqual({ actor: 'system', via: 'system', details: '{"count":1}' })
  })

  it('uses the closing time of the settings', async () => {
    let id = 0
    server = await startServer({
      seed(db) {
        seedNotice(db)
        db.prepare("INSERT INTO setting (key, value) VALUES ('autoCheckoutTime', '\"18:30\"')").run()
        id = addVisit(db, 'Late', at(2, 9))
      }
    })
    const row = server.db().prepare('SELECT check_out_at FROM visit WHERE id = ?').get(id)
    expect(row).toEqual({ check_out_at: unix(at(2, 18, 30)) })
  })
})

describe('retention', () => {
  it('deletes the personal data older than 12 months, with the signatures', async () => {
    const oldSignature = signaturePng(555, 44)
    server = await startServer({
      seed(db) {
        seedNotice(db)
        addVisit(db, 'Old', monthsAgo(13), oldSignature)
        addVisit(db, 'Recent', monthsAgo(11))
        const insertEvent = db.prepare("INSERT INTO event (name, start_date, end_date, created_by) VALUES (?, ?, ?, 'test')")
        const iso = (date: Date) => date.toISOString().slice(0, 10)
        const oldEvent = insertEvent.run('Old', iso(monthsAgo(14)), iso(monthsAgo(13))).lastInsertRowid
        insertEvent.run('Recent', iso(monthsAgo(11)), iso(monthsAgo(11)))
        db.prepare(
          "INSERT INTO event_guest (event_id, first_name, last_name, company, search_name) VALUES (?, 'A', 'B', 'C', 'a b')"
        ).run(oldEvent)
        db.prepare("INSERT INTO audit_log (actor, via, action, created_at) VALUES ('x', 'ldap', 'old.action', ?)").run(
          unix(monthsAgo(13))
        )
      }
    })
    const db = server.db()
    const names = (table: string, column: string) =>
      (db.prepare(`SELECT ${column} AS value FROM ${table}`).all() as { value: string }[]).map((row) => row.value)
    expect(names('visit', 'first_name')).toEqual(['Recent'])
    expect(names('event', 'name')).toEqual(['Recent'])
    expect(names('event_guest', 'first_name')).toEqual([])
    expect(names('audit_log', 'action')).not.toContain('old.action')

    const audit = db.prepare("SELECT details FROM audit_log WHERE action = 'retention.delete'").get() as { details: string }
    expect(JSON.parse(audit.details)).toMatchObject({ visits: 1, events: 1, auditLog: 1 })

    const files = Buffer.concat(
      [server.databasePath, `${server.databasePath}-wal`].map((path) => readFileSync(path))
    )
    expect(files.includes(oldSignature.subarray(-40))).toBe(false)
  })

  it('uses the retention period of the settings', async () => {
    server = await startServer({
      seed(db) {
        seedNotice(db)
        db.prepare("INSERT INTO setting (key, value) VALUES ('retentionMonths', '1')").run()
        addVisit(db, 'TwoMonths', monthsAgo(2))
        addVisit(db, 'TwoWeeks', at(14, 10))
      }
    })
    const rows = server.db().prepare('SELECT first_name FROM visit').all()
    expect(rows).toEqual([{ first_name: 'TwoWeeks' }])
  })

  it('falls back to the default for an invalid setting', async () => {
    server = await startServer({
      seed(db) {
        seedNotice(db)
        db.prepare("INSERT INTO setting (key, value) VALUES ('retentionMonths', '0')").run()
        addVisit(db, 'TwoMonths', monthsAgo(2))
      }
    })
    expect(server.db().prepare('SELECT count(*) AS n FROM visit').get()).toEqual({ n: 1 })
  })
})
