import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { signatureDataUrl, signaturePng, startServer, unix, type Client, type TestServer } from './server'

let server: TestServer
let admin: Client
let kiosk: Client
let noticeId: number

const visitor = (overrides: Record<string, unknown> = {}) => ({
  firstName: 'Mario',
  lastName: 'Rossi',
  company: 'ACME',
  noticeVersionId: noticeId,
  signature: signatureDataUrl(),
  ...overrides
})

beforeAll(async () => {
  server = await startServer()
  admin = await server.admin()
  noticeId = (await admin.post('/api/admin/notice', { bodyMd: '# Informativa\n\nTesto **v1**' })).data.id
  kiosk = await server.kiosk(admin, 'Ingresso')
})
afterAll(() => server?.stop())

describe('pairing', () => {
  it('accepts a code once, in any case', async () => {
    const created = await admin.post('/api/admin/devices', { name: 'Reception' })
    expect(created.data.code).toMatch(/^[A-HJKMNP-Z2-9]{8}$/)
    const tablet = server.client()
    const paired = await tablet.post('/api/kiosk/pair', { code: created.data.code.toLowerCase() })
    expect(paired.status).toBe(200)
    expect(paired.data.name).toBe('Reception')
    expect((await tablet.get('/api/kiosk/config')).data.deviceName).toBe('Reception')

    const again = await server.client().post('/api/kiosk/pair', { code: created.data.code })
    expect(again.status).toBe(400)
  })

  it('stores only the hash of the code', async () => {
    const created = await admin.post('/api/admin/devices', { name: 'Hash' })
    const row = server.db().prepare('SELECT pairing_code_hash FROM device WHERE id = ?').get(created.data.id) as {
      pairing_code_hash: string
    }
    expect(row.pairing_code_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(row.pairing_code_hash).not.toContain(created.data.code)
  })

  it('rejects an expired code', async () => {
    const created = await admin.post('/api/admin/devices', { name: 'Expired' })
    server
      .db()
      .prepare('UPDATE device SET pairing_expires_at = ? WHERE id = ?')
      .run(unix(new Date()) - 1, created.data.id)
    expect((await server.client().post('/api/kiosk/pair', { code: created.data.code })).status).toBe(400)
    const devices = await admin.get('/api/admin/devices')
    expect(devices.data.find((device: { id: number }) => device.id === created.data.id).status).toBe('expired')
  })

  it('rejects the code of a revoked tablet', async () => {
    const created = await admin.post('/api/admin/devices', { name: 'Revoked' })
    expect((await admin.post(`/api/admin/devices/${created.data.id}/revoke`)).status).toBe(200)
    expect((await server.client().post('/api/kiosk/pair', { code: created.data.code })).status).toBe(400)
  })

  it('gives no new code to a paired tablet', async () => {
    const created = await admin.post('/api/admin/devices', { name: 'Paired' })
    await server.client().post('/api/kiosk/pair', { code: created.data.code })
    expect((await admin.post(`/api/admin/devices/${created.data.id}/pairing-code`)).status).toBe(409)
  })

  it('replaces the code with a new one', async () => {
    const created = await admin.post('/api/admin/devices', { name: 'New code' })
    const renewed = await admin.post(`/api/admin/devices/${created.data.id}/pairing-code`)
    expect(renewed.status).toBe(200)
    expect((await server.client().post('/api/kiosk/pair', { code: created.data.code })).status).toBe(400)
    expect((await server.client().post('/api/kiosk/pair', { code: renewed.data.code })).status).toBe(200)
  })

  it('limits the attempts from one address to 10 a minute', async () => {
    const tablet = server.client('198.51.100.7')
    for (let i = 0; i < 10; i++) {
      expect((await tablet.post('/api/kiosk/pair', { code: 'AAAAAAAA' })).status).toBe(400)
    }
    const limited = await tablet.post('/api/kiosk/pair', { code: 'AAAAAAAA' })
    expect(limited.status).toBe(429)
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(50)
    expect((await server.client('198.51.100.8').post('/api/kiosk/pair', { code: 'AAAAAAAA' })).status).toBe(400)
  })
})

describe('revocation', () => {
  it('signs the tablet out at its next request', async () => {
    const tablet = await server.kiosk(admin, 'To revoke')
    const id = (await admin.get('/api/admin/devices')).data.find((d: { name: string }) => d.name === 'To revoke').id
    await admin.post(`/api/admin/devices/${id}/revoke`)
    expect((await tablet.get('/api/kiosk/config')).status).toBe(401)
    expect(tablet.cookie).toBe('')
    expect((await admin.post(`/api/admin/devices/${id}/revoke`)).status).toBe(409)
  })
})

describe('config', () => {
  it('gives the current notice, the theme and the events of today', async () => {
    await admin.patch('/api/admin/settings', { kioskTheme: 'dark' })
    const config = await kiosk.get('/api/kiosk/config')
    expect(config.status).toBe(200)
    expect(config.data).toMatchObject({ deviceName: 'Ingresso', theme: 'dark', notice: { id: noticeId } })
    await admin.patch('/api/admin/settings', { kioskTheme: 'light' })
  })
})

describe('visitor check-in', () => {
  it('registers the visit with the signature image', async () => {
    const png = signaturePng(320, 90)
    const response = await kiosk.post('/api/kiosk/visits', visitor({ firstName: ' Nicolò ', signature: signatureDataUrl(png), host: 'Andrea' }))
    expect(response.status).toBe(200)
    const row = server.db().prepare('SELECT * FROM visit ORDER BY id DESC LIMIT 1').get() as Record<string, any>
    expect(row).toMatchObject({
      first_name: 'Nicolò',
      search_name: 'nicolo rossi',
      host: 'Andrea',
      notice_version_id: noticeId,
      check_out_at: null
    })
    expect(Buffer.compare(row.signature, png)).toBe(0)
    expect(row.device_id).toBeTypeOf('number')
  })

  it('rejects missing or too long fields', async () => {
    expect((await kiosk.post('/api/kiosk/visits', visitor({ firstName: '  ' }))).status).toBe(400)
    expect((await kiosk.post('/api/kiosk/visits', visitor({ company: 'x'.repeat(101) }))).status).toBe(400)
    expect((await kiosk.post('/api/kiosk/visits', visitor({ signature: undefined }))).status).toBe(400)
  })

  it('rejects a signature that is not a valid PNG image', async () => {
    const png = signaturePng()
    const invalid = [
      'data:image/jpeg;base64,' + png.toString('base64'),
      signatureDataUrl(Buffer.from('not an image at all, but long enough')),
      // PNG magic bytes, no IHDR
      signatureDataUrl(Buffer.concat([png.subarray(0, 8), Buffer.alloc(40)])),
      signatureDataUrl(signaturePng(4001, 1)),
      // Over 200 KB
      signatureDataUrl(Buffer.concat([png, Buffer.alloc(201 * 1024)]))
    ]
    const before = (server.db().prepare('SELECT count(*) AS n FROM visit').get() as { n: number }).n
    for (const signature of invalid) {
      expect((await kiosk.post('/api/kiosk/visits', visitor({ signature }))).status).toBe(400)
    }
    expect((server.db().prepare('SELECT count(*) AS n FROM visit').get() as { n: number }).n).toBe(before)
  })

  it('asks to show the notice again when a new version is published', async () => {
    const v2 = (await admin.post('/api/admin/notice', { bodyMd: 'Testo v2' })).data.id
    const stale = await kiosk.post('/api/kiosk/visits', visitor())
    expect(stale.status).toBe(409)
    expect(stale.data.statusMessage).toBe('notice_changed')
    expect((await kiosk.get('/api/kiosk/config')).data.notice.id).toBe(v2)
    noticeId = v2
    expect((await kiosk.post('/api/kiosk/visits', visitor())).status).toBe(200)
  })
})

describe('check-out', () => {
  it('finds the present visitors after 3 letters, without accents', async () => {
    expect((await kiosk.get('/api/kiosk/present?q=ni')).data).toEqual([])
    const found = (await kiosk.get('/api/kiosk/present?q=NICOL')).data
    expect(found).toHaveLength(1)
    expect(found[0]).toEqual({ id: expect.any(Number), firstName: 'Nicolò', lastName: 'Rossi', company: 'ACME' })
  })

  it('gives at most 5 results', async () => {
    for (let i = 0; i < 7; i++) {
      await kiosk.post('/api/kiosk/visits', visitor({ firstName: `Luca${i}`, lastName: 'Verdi' }))
    }
    expect((await kiosk.get('/api/kiosk/present?q=verdi')).data).toHaveLength(5)
  })

  it('takes % and _ literally', async () => {
    expect((await kiosk.get('/api/kiosk/present?q=%25%25%25')).data).toEqual([])
    expect((await kiosk.get('/api/kiosk/present?q=___')).data).toEqual([])
  })

  it('closes the visit once', async () => {
    const [found] = (await kiosk.get('/api/kiosk/present?q=nicol')).data
    expect((await kiosk.post(`/api/kiosk/visits/${found.id}/check-out`)).status).toBe(200)
    expect((await kiosk.post(`/api/kiosk/visits/${found.id}/check-out`)).status).toBe(409)
    expect((await kiosk.get('/api/kiosk/present?q=nicol')).data).toEqual([])
    const row = server.db().prepare('SELECT check_out_by FROM visit WHERE id = ?').get(found.id)
    expect(row).toEqual({ check_out_by: 'visitor' })
  })

  it('limits the searches of a tablet to 60 a minute', async () => {
    const tablet = await server.kiosk(admin, 'Search limit')
    // Shorter texts are not searched and do not count
    for (let i = 0; i < 5; i++) await tablet.get('/api/kiosk/present?q=ab')
    for (let i = 0; i < 60; i++) {
      expect((await tablet.get('/api/kiosk/present?q=verdi')).status).toBe(200)
    }
    expect((await tablet.get('/api/kiosk/present?q=verdi')).status).toBe(429)
    // The other tablets can still search
    expect((await kiosk.get('/api/kiosk/present?q=verdi')).status).toBe(200)
  })
})

describe('audit log', () => {
  it('records the tablet actions without personal data', async () => {
    const rows = server.db().prepare('SELECT actor, via, action, details FROM audit_log').all() as Record<string, string>[]
    expect(rows.map((row) => row.action)).toEqual(expect.arrayContaining(['device.pair', 'visit.check_in', 'visit.check_out']))
    expect(rows.find((row) => row.action === 'visit.check_in')).toMatchObject({ actor: 'Ingresso', via: 'kiosk' })
    const text = JSON.stringify(rows)
    for (const personal of ['Rossi', 'Nicol', 'Verdi', 'ACME', 'Andrea']) {
      expect(text).not.toContain(personal)
    }
  })
})
