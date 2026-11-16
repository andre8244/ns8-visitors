// Starts the built server (.output) on a temporary database, and gives
// HTTP clients with their own cookies
import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { deflateSync, crc32 } from 'node:zlib'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { defaults, seal } from 'iron-webcrypto'

const APP_DIR = resolve(import.meta.dirname, '../..')
const SERVER_ENTRY = join(APP_DIR, '.output/server/index.mjs')
const MIGRATIONS = join(APP_DIR, 'server/database/migrations')
const SESSION_COOKIE = 'nuxt-session'
const DAY_MS = 24 * 60 * 60 * 1000
// The types of iron-webcrypto predate the typed arrays of TypeScript 5.7
const webCrypto = globalThis.crypto as unknown as Parameters<typeof seal>[0]

export interface ApiResponse<T = any> {
  status: number
  data: T
  headers: Headers
}

export class Client {
  cookie = ''

  constructor(
    private baseUrl: string,
    private headers: Record<string, string> = {}
  ) {}

  async request<T = any>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(this.baseUrl + path, {
      method,
      headers: {
        ...this.headers,
        ...(this.cookie ? { cookie: this.cookie } : {}),
        ...(body === undefined ? {} : { 'content-type': 'application/json' })
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
    for (const header of response.headers.getSetCookie()) {
      const [pair = ''] = header.split(';')
      const value = pair.slice(pair.indexOf('=') + 1)
      if (pair.startsWith(`${SESSION_COOKIE}=`)) {
        this.cookie = value ? pair : ''
      }
    }
    const type = response.headers.get('content-type') ?? ''
    const data = type.includes('json')
      ? await response.json()
      : type.startsWith('image/')
        ? Buffer.from(await response.arrayBuffer())
        : await response.text()
    return { status: response.status, data, headers: response.headers }
  }

  get<T = any>(path: string) {
    return this.request<T>('GET', path)
  }

  post<T = any>(path: string, body: unknown = {}) {
    return this.request<T>('POST', path, body)
  }

  patch<T = any>(path: string, body: unknown) {
    return this.request<T>('PATCH', path, body)
  }

  delete<T = any>(path: string) {
    return this.request<T>('DELETE', path)
  }
}

export interface TestServer {
  url: string
  databasePath: string
  // A client with no session; the header sets the client address seen by
  // the rate limits
  client(ip?: string): Client
  // A client signed in as an admin, as after the LDAP login
  admin(options?: { signedInDaysAgo?: number }): Promise<Client>
  // A client paired as a tablet named `name`
  kiosk(admin: Client, name?: string): Promise<Client>
  // A direct connection to the database, for fixtures and checks
  db(): Database.Database
  output(): string
  stop(): Promise<void>
}

async function freePort() {
  return new Promise<number>((done, fail) => {
    const server = createServer()
    server.on('error', fail)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => done(typeof address === 'object' && address ? address.port : 0))
    })
  })
}

// A database with the schema, before the server starts: for fixtures the
// startup jobs must see
export function createDatabase(databasePath: string) {
  const sqlite = new Database(databasePath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  migrate(drizzle(sqlite), { migrationsFolder: MIGRATIONS })
  return sqlite
}

export async function startServer(options: { seed?: (db: Database.Database) => void } = {}): Promise<TestServer> {
  if (!existsSync(SERVER_ENTRY)) {
    throw new Error('Build the app first: pnpm build')
  }
  const dir = mkdtempSync(join(tmpdir(), 'visitors-test-'))
  const databasePath = join(dir, 'visitors.sqlite')
  if (options.seed) {
    const sqlite = createDatabase(databasePath)
    try {
      options.seed(sqlite)
    } catch (error) {
      rmSync(dir, { recursive: true, force: true })
      throw error
    } finally {
      sqlite.close()
    }
  }
  const port = await freePort()
  const url = `http://127.0.0.1:${port}`
  const password = 'test-session-password-'.padEnd(48, 'x')
  let output = ''
  const child: ChildProcess = spawn(process.execPath, [SERVER_ENTRY], {
    cwd: dir,
    env: {
      PATH: process.env.PATH,
      TZ: 'Europe/Rome',
      HOST: '127.0.0.1',
      PORT: String(port),
      NUXT_DATABASE_PATH: databasePath,
      NUXT_MIGRATIONS_PATH: MIGRATIONS,
      NUXT_SESSION_PASSWORD: password,
      // Nothing listens there: the LDAP login fails as unavailable
      NUXT_LDAP_HOST: '127.0.0.1',
      NUXT_LDAP_PORT: String(await freePort())
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  child.stdout?.on('data', (chunk) => (output += chunk))
  child.stderr?.on('data', (chunk) => (output += chunk))

  const deadline = Date.now() + 20_000
  for (;;) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited:\n${output}`)
    }
    try {
      await fetch(`${url}/login`)
      break
    } catch {
      if (Date.now() > deadline) throw new Error(`Server not ready:\n${output}`)
      await new Promise((done) => setTimeout(done, 100))
    }
  }

  let ipCounter = 0
  const newIp = () => `192.0.2.${++ipCounter}`
  const connections: Database.Database[] = []

  return {
    url,
    databasePath,
    client: (ip = newIp()) => new Client(url, { 'x-forwarded-for': ip }),
    async admin({ signedInDaysAgo = 0 } = {}) {
      const signedInAt = Date.now() - signedInDaysAgo * DAY_MS
      const session = {
        id: crypto.randomUUID(),
        createdAt: signedInAt,
        data: { user: { kind: 'admin', name: 'Test Admin', username: 'test.admin' }, via: 'ldap', signedInAt }
      }
      const client = new Client(url, { 'x-forwarded-for': newIp() })
      client.cookie = `${SESSION_COOKIE}=${await seal(webCrypto, session, password, { ...defaults, ttl: 365 * DAY_MS })}`
      return client
    },
    async kiosk(admin, name = 'Tablet') {
      const created = await admin.post('/api/admin/devices', { name })
      const client = new Client(url, { 'x-forwarded-for': newIp() })
      const paired = await client.post('/api/kiosk/pair', { code: created.data.code })
      if (paired.status !== 200) throw new Error(`Pairing failed: ${paired.status}`)
      return client
    },
    db() {
      const sqlite = new Database(databasePath)
      sqlite.pragma('foreign_keys = ON')
      connections.push(sqlite)
      return sqlite
    },
    output: () => output,
    async stop() {
      for (const sqlite of connections) sqlite.close()
      if (child.exitCode === null) {
        await new Promise((done) => {
          child.once('exit', done)
          child.kill()
        })
      }
      rmSync(dir, { recursive: true, force: true })
    }
  }
}

// A real PNG image: white, with a black diagonal line
export function signaturePng(width = 300, height = 100) {
  const row = width * 3 + 1
  const raw = Buffer.alloc(row * height, 255)
  for (let y = 0; y < height; y++) {
    raw[y * row] = 0
    const x = Math.round((y * width) / height)
    raw.fill(0, y * row + 1 + x * 3, y * row + 4 + x * 3)
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
  header[8] = 8 // bit depth
  header[9] = 2 // RGB
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ])
}

export const signatureDataUrl = (png = signaturePng()) => `data:image/png;base64,${png.toString('base64')}`

// YYYY-MM-DD of today plus `days`, local time
export function day(days = 0) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Unix seconds, as the database stores the timestamps
export const unix = (date: Date) => Math.floor(date.getTime() / 1000)
