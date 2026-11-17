import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startServer, type Client, type TestServer } from './server'

let server: TestServer
let admin: Client

beforeAll(async () => {
  server = await startServer()
  admin = await server.admin()
})
afterAll(() => server?.stop())

describe('headers', () => {
  it('sends a CSP whose nonce is on every script of the page', async () => {
    const page = await server.client().get('/login')
    const csp = page.headers.get('content-security-policy') ?? ''
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1]
    expect(nonce).toBeTruthy()
    expect(csp).toContain("frame-ancestors 'none'")
    const scripts = (page.data as string).match(/<script\b[^>]*>/g) ?? []
    expect(scripts.length).toBeGreaterThan(0)
    for (const script of scripts) {
      expect(script).toContain(`nonce="${nonce}"`)
    }
  })

  it('uses a new nonce for every page', async () => {
    const nonce = async () =>
      (await server.client().get('/kiosk')).headers.get('content-security-policy')?.match(/'nonce-([^']+)'/)?.[1]
    expect(await nonce()).not.toBe(await nonce())
  })

  it('forbids framing and caching of the API', async () => {
    const response = await admin.get('/api/admin/settings')
    expect(response.headers.get('x-frame-options')).toBe('DENY')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('referrer-policy')).toBe('no-referrer')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})

describe('sessions', () => {
  it('rejects the admin API without a session', async () => {
    const client = server.client()
    expect((await client.get('/api/admin/visits')).status).toBe(401)
    expect((await client.get('/api/admin/settings')).status).toBe(401)
    expect((await client.post('/api/admin/notice', { bodyMd: 'x' })).status).toBe(401)
  })

  it('rejects the tablet API without a session', async () => {
    const client = server.client()
    expect((await client.get('/api/kiosk/config')).status).toBe(401)
    expect((await client.get('/api/kiosk/present?q=abc')).status).toBe(401)
  })

  it('rejects a cookie sealed with another password', async () => {
    const client = server.client()
    client.cookie = 'nuxt-session=Fe26.2**forged'
    expect((await client.get('/api/admin/settings')).status).toBe(401)
  })

  it('ends the admin session after 14 days', async () => {
    expect((await (await server.admin({ signedInDaysAgo: 13 })).get('/api/admin/settings')).status).toBe(200)
    const expired = await server.admin({ signedInDaysAgo: 15 })
    expect((await expired.get('/api/admin/settings')).status).toBe(401)
    // The cookie is cleared
    expect(expired.cookie).toBe('')
  })

  it('gives a tablet no access to the admin API', async () => {
    const kiosk = await server.kiosk(admin)
    expect((await kiosk.get('/api/kiosk/config')).status).toBe(200)
    expect((await kiosk.get('/api/admin/visits')).status).toBe(403)
    expect((await kiosk.get('/api/admin/devices')).status).toBe(403)
  })

  it('gives an admin no access to the tablet API', async () => {
    expect((await admin.get('/api/kiosk/config')).status).toBe(403)
  })
})

describe('login', () => {
  it('rejects a user name with invalid characters before asking LDAP', async () => {
    const response = await server.client().post('/api/auth/login', { username: 'a*)(uid=*', password: 'x' })
    expect(response.status).toBe(400)
  })

  it('answers 503 when LDAP is unreachable, without counting a failure', async () => {
    const client = server.client()
    for (let i = 0; i < 12; i++) {
      expect((await client.post('/api/auth/login', { username: 'mario', password: 'x' })).status).toBe(503)
    }
  })
})
