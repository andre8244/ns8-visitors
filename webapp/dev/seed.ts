// Fills the development database with synthetic data: visits of the last
// three months, events past, in progress and upcoming, tablets and a privacy
// notice. Names and companies are made up. Development only: never run it on
// a real database.
//
//   pnpm dev:seed            # .data/visitors.sqlite, or NUXT_DATABASE_PATH
//
// It refuses a database that already has visits: delete the file first.
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { deflateSync, crc32 } from 'node:zlib'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { searchNameOf } from '../shared/utils/names.ts'

const APP_DIR = resolve(import.meta.dirname, '..')
const databasePath = resolve(APP_DIR, process.env.NUXT_DATABASE_PATH ?? '.data/visitors.sqlite')

// Same data at every run
let state = 20261117
function random() {
  state = (state * 1103515245 + 12345) % 2 ** 31
  return state / 2 ** 31
}
const pick = <T>(items: T[]) => items[Math.floor(random() * items.length)]!
const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1))

const FIRST_NAMES = [
  'Marco', 'Giulia', 'Luca', 'Francesca', 'Alessandro', 'Chiara', 'Davide', 'Sara', 'Matteo', 'Elena',
  'Simone', 'Martina', 'Andrea', 'Valentina', 'Nicolò', 'Federica', 'Paolo', 'Ilaria', 'Stefano', 'Roberta',
  'Fabio', 'Alessia', 'Riccardo', 'Silvia', 'Gabriele', 'Noemi', 'Lorenzo', 'Beatrice', 'Tommaso', 'Gaia'
]
const LAST_NAMES = [
  'Rossi', 'Bianchi', 'Ferrari', 'Esposito', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno',
  'Gallo', 'Conti', "D'Amico", 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri',
  'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone', 'Longo'
]
const COMPANIES = [
  'Alfa Impianti Srl', 'Beta Informatica', 'Gamma Reti Spa', 'Delta Consulting', 'Epsilon Sistemi',
  'Zeta Telecomunicazioni', 'Eta Software', 'Theta Servizi IT', 'Iota Networks', 'Kappa Digitale',
  'Lambda Solutions', 'Sigma Cloud', 'Omega Elettronica', 'Studio Tecnico Verdi', 'Comune di Esempio'
]
// Free text typed by the visitors, often empty
const HOSTS = ['Andrea', 'Ufficio commerciale', 'Supporto tecnico', 'Amministrazione', 'Laura', 'Michele']

const NOTICE = `# Informativa sul trattamento dei dati personali

Questa informativa è un **testo di prova** per lo sviluppo.

## Titolare del trattamento

Azienda di esempio, via Roma 1, 00100 Città.

## Dati trattati

Nome, cognome, azienda e firma, per la sicurezza della sede.

## Conservazione

I dati vengono cancellati dopo 12 mesi.`

function person() {
  return { firstName: pick(FIRST_NAMES), lastName: pick(LAST_NAMES), company: pick(COMPANIES) }
}

// A signature-like scribble, as a PNG image
function signature() {
  const width = 400
  const height = 120
  const row = width * 3 + 1
  const raw = Buffer.alloc(row * height, 255)
  for (let y = 0; y < height; y++) raw[y * row] = 0
  const phase = random() * 6
  const loops = 3 + random() * 4
  for (let x = 20; x < width - 20; x++) {
    const y = Math.round(height / 2 + 30 * Math.sin((x / width) * loops * Math.PI + phase) * Math.cos(x / 37))
    for (let dy = -1; dy <= 1; dy++) {
      const py = Math.min(height - 1, Math.max(0, y + dy))
      raw.fill(0, py * row + 1 + x * 3, py * row + 4 + x * 3)
    }
  }
  const chunk = (type: string, data: Buffer) => {
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length)
    const typed = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(typed))
    return Buffer.concat([length, typed, crc])
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 2
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ])
}

const unix = (date: Date) => Math.floor(date.getTime() / 1000)

// Local time of a day relative to today
function at(daysFromToday: number, hours: number, minutes = 0) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)
  date.setHours(hours, minutes, 0, 0)
  return date
}

function day(daysFromToday: number) {
  const date = at(daysFromToday, 12)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const isWeekend = (daysFromToday: number) => [0, 6].includes(at(daysFromToday, 12).getDay())

mkdirSync(dirname(databasePath), { recursive: true })
const isNew = !existsSync(databasePath)
const sqlite = new Database(databasePath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')
migrate(drizzle(sqlite), { migrationsFolder: resolve(APP_DIR, 'server/database/migrations') })

const { n: existing } = sqlite.prepare('SELECT count(*) AS n FROM visit').get() as { n: number }
if (existing) {
  console.error(`${databasePath} already has ${existing} visits: delete it first, with the server stopped`)
  process.exit(1)
}

const now = new Date()
const insertNotice = sqlite.prepare(
  "INSERT INTO notice_version (body_md, published_by, created_at) VALUES (?, 'reception', ?)"
)
const insertDevice = sqlite.prepare(
  `INSERT INTO device (name, paired_at, last_seen_at, revoked_at, pairing_expires_at, created_by, created_at)
   VALUES (?, ?, ?, ?, ?, 'reception', ?)`
)
const insertEvent = sqlite.prepare(
  "INSERT INTO event (name, start_date, end_date, created_by) VALUES (?, ?, ?, 'reception')"
)
const insertGuest = sqlite.prepare(
  `INSERT INTO event_guest (event_id, first_name, last_name, company, search_name, added_on_site)
   VALUES (?, ?, ?, ?, ?, ?)`
)
const signGuest = sqlite.prepare('UPDATE event_guest SET signed_visit_id = ? WHERE id = ?')
const insertVisit = sqlite.prepare(
  `INSERT INTO visit (first_name, last_name, company, host, search_name, event_id, event_guest_id,
     notice_version_id, signature, check_in_at, check_out_at, check_out_by, device_id)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
)

const counts = { visits: 0, events: 0, guests: 0 }

sqlite.transaction(() => {
  // Two versions of the notice: the visits of the last weeks signed the second
  const oldNotice = Number(insertNotice.run(NOTICE.replace('12 mesi', '24 mesi'), unix(at(-120, 9))).lastInsertRowid)
  const notice = Number(insertNotice.run(NOTICE, unix(at(-30, 9))).lastInsertRowid)
  const noticeAt = (date: Date) => (date < at(-30, 9) ? oldNotice : notice)

  const entrance = Number(
    insertDevice.run('Ingresso principale', unix(at(-120, 9)), unix(now), null, null, unix(at(-120, 9))).lastInsertRowid
  )
  insertDevice.run('Vecchio tablet', unix(at(-200, 9)), unix(at(-125, 18)), unix(at(-120, 9)), null, unix(at(-200, 9)))
  insertDevice.run('Tablet sala corsi', null, null, null, unix(at(-2, 10)), unix(at(-2, 10)))

  function visit(
    who: { firstName: string; lastName: string; company: string },
    checkIn: Date,
    options: { open?: boolean; eventId?: number; guestId?: number; signed?: boolean; host?: string | null } = {}
  ) {
    const signed = options.signed ?? true
    let checkOut: Date | null = null
    let checkOutBy: string | null = null
    if (!options.open) {
      const kind = random()
      if (kind < 0.7) {
        checkOut = new Date(checkIn.getTime() + between(30, 300) * 60_000)
        checkOutBy = 'visitor'
      } else if (kind < 0.85) {
        checkOut = new Date(checkIn.getTime() + between(30, 300) * 60_000)
        checkOutBy = 'reception'
      } else {
        checkOut = new Date(checkIn)
        checkOut.setHours(20, 0, 0, 0)
        checkOutBy = 'auto'
      }
    }
    // Not closed yet: the check-out would be in the future
    if (checkOut && checkOut > now) {
      checkOut = null
      checkOutBy = null
    }
    counts.visits++
    return Number(
      insertVisit.run(
        who.firstName,
        who.lastName,
        who.company,
        options.host ?? null,
        searchNameOf(who),
        options.eventId ?? null,
        options.guestId ?? null,
        signed ? noticeAt(checkIn) : null,
        signed ? signature() : null,
        unix(checkIn),
        checkOut ? unix(checkOut) : null,
        checkOutBy,
        entrance
      ).lastInsertRowid
    )
  }

  // Visitors on the working days of the last three months; some come back
  const regulars = Array.from({ length: 8 }, person)
  for (let d = -90; d <= 0; d++) {
    if (isWeekend(d)) continue
    const perDay = d === 0 ? 6 : between(0, 5)
    for (let i = 0; i < perDay; i++) {
      const checkIn = at(d, between(8, d === 0 ? Math.max(8, Math.min(now.getHours(), 17)) : 17), between(0, 59))
      if (d === 0 && checkIn > now) checkIn.setTime(now.getTime() - between(5, 120) * 60_000)
      visit(random() < 0.3 ? pick(regulars) : person(), checkIn, {
        // Today some are still in the office
        open: d === 0 && i < 4,
        host: random() < 0.6 ? pick(HOSTS) : null
      })
    }
  }

  function event(name: string, startDay: number, endDay: number, guests: number) {
    const id = Number(insertEvent.run(name, day(startDay), day(endDay)).lastInsertRowid)
    counts.events++
    const list = Array.from({ length: guests }, () => {
      const who = person()
      counts.guests++
      return { ...who, id: Number(insertGuest.run(id, who.firstName, who.lastName, who.company, searchNameOf(who), 0).lastInsertRowid) }
    })
    return { id, list }
  }

  // Past course: most guests came and signed
  const past = event('Workshop sicurezza di rete', -20, -20, 14)
  for (const guest of past.list.slice(0, 12)) {
    const visitId = visit(guest, at(-20, 9, between(0, 30)), { eventId: past.id, guestId: guest.id })
    signGuest.run(visitId, guest.id)
  }

  // Course in progress, from yesterday to tomorrow: signed yesterday, back
  // today without signing; a few first came today; two not in the list
  const current = event('Corso NethServer 8 base', -1, 1, 24)
  current.list.forEach((guest, index) => {
    if (index < 16) {
      const visitId = visit(guest, at(-1, 9, between(0, 30)), { eventId: current.id, guestId: guest.id })
      signGuest.run(visitId, guest.id)
      if (index < 12 && now.getHours() >= 9) {
        visit(guest, at(0, 9, between(0, 20)), { eventId: current.id, guestId: guest.id, signed: false, open: index < 10 })
      }
    } else if (index < 19 && now.getHours() >= 9) {
      const visitId = visit(guest, at(0, 9, between(20, 40)), { eventId: current.id, guestId: guest.id, open: true })
      signGuest.run(visitId, guest.id)
    }
  })
  for (let i = 0; i < 2 && now.getHours() >= 9; i++) {
    const who = person()
    const guestId = Number(insertGuest.run(current.id, who.firstName, who.lastName, who.company, searchNameOf(who), 1).lastInsertRowid)
    counts.guests++
    const visitId = visit(who, at(0, 9, between(30, 50)), { eventId: current.id, guestId, open: true })
    signGuest.run(visitId, guestId)
  }

  // Upcoming events, nobody came yet
  event('Partner day', 10, 10, 30)
  event('Formazione NethVoice', 25, 26, 18)
})()

sqlite.pragma('wal_checkpoint(TRUNCATE)')
sqlite.close()
console.log(
  `${isNew ? 'Created' : 'Filled'} ${databasePath}: ${counts.visits} visits, ${counts.events} events, ${counts.guests} guests, 3 tablets, 2 notice versions`
)
