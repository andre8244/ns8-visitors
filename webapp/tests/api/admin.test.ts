import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { day, signatureDataUrl, signaturePng, startServer, type Client, type TestServer } from './server'

let server: TestServer
let admin: Client
let kiosk: Client
let noticeId: number

async function checkIn(firstName: string, lastName: string, company: string, signature = signatureDataUrl()) {
  const response = await kiosk.post('/api/kiosk/visits', { firstName, lastName, company, noticeVersionId: noticeId, signature })
  expect(response.status).toBe(200)
}

const lastAudit = (action: string) =>
  server.db().prepare('SELECT * FROM audit_log WHERE action = ? ORDER BY id DESC LIMIT 1').get(action) as
    | Record<string, any>
    | undefined

beforeAll(async () => {
  server = await startServer()
  admin = await server.admin()
  noticeId = (await admin.post('/api/admin/notice', { bodyMd: 'Informativa' })).data.id
  kiosk = await server.kiosk(admin)
  await checkIn('Mario', 'Rossi', 'ACME')
  await checkIn('Giulia', 'Verdi', 'Rossi Srl')
  await checkIn('Paolo', 'Neri', 'Delta')
})
afterAll(() => server?.stop())

describe('register', () => {
  it('lists the visits newest first, without the signature image', async () => {
    const { data } = await admin.get('/api/admin/visits')
    expect(data.total).toBe(3)
    expect(data.visits.map((v: { lastName: string }) => v.lastName)).toEqual(['Neri', 'Verdi', 'Rossi'])
    expect(data.visits[0]).toMatchObject({ signed: true, checkOutAt: null })
    expect(data.visits[0]).not.toHaveProperty('signature')
  })

  it('searches names and companies', async () => {
    const { data } = await admin.get('/api/admin/visits?q=rossi')
    expect(data.visits.map((v: { lastName: string }) => v.lastName).sort()).toEqual(['Rossi', 'Verdi'])
  })

  it('filters by day', async () => {
    expect((await admin.get(`/api/admin/visits?from=${day()}&to=${day()}`)).data.total).toBe(3)
    expect((await admin.get(`/api/admin/visits?to=${day(-1)}`)).data.total).toBe(0)
    expect((await admin.get(`/api/admin/visits?from=${day(1)}`)).data.total).toBe(0)
    expect((await admin.get('/api/admin/visits?from=yesterday')).status).toBe(400)
  })

  it('pages the results', async () => {
    const page = await admin.get('/api/admin/visits?page=2&pageSize=2')
    expect(page.data.total).toBe(3)
    expect(page.data.visits).toHaveLength(1)
    expect((await admin.get('/api/admin/visits?pageSize=101')).status).toBe(400)
  })

  it('shows the signature image and records who saw it', async () => {
    const png = signaturePng(250, 80)
    await checkIn('Sara', 'Gallo', 'Kappa', signatureDataUrl(png))
    const [visit] = (await admin.get('/api/admin/visits?q=gallo')).data.visits
    const response = await admin.get(`/api/admin/visits/${visit.id}/signature`)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(Buffer.compare(response.data, png)).toBe(0)
    expect(lastAudit('visit.view_signature')).toMatchObject({ actor: 'test.admin', via: 'ldap', visit_id: visit.id })
    expect((await admin.get('/api/admin/visits/9999/signature')).status).toBe(404)
  })

  it('closes a visit from the reception', async () => {
    const [visit] = (await admin.get('/api/admin/visits?q=gallo')).data.visits
    expect((await admin.post(`/api/admin/visits/${visit.id}/check-out`)).status).toBe(200)
    expect((await admin.post(`/api/admin/visits/${visit.id}/check-out`)).status).toBe(409)
    const [closed] = (await admin.get('/api/admin/visits?q=gallo')).data.visits
    expect(closed).toMatchObject({ checkOutBy: 'reception', checkOutAt: expect.any(String) })
    expect((await admin.get('/api/admin/visits?present=true')).data.total).toBe(3)
  })
})

describe('export', () => {
  it('gives every matching visit and records only that a text filter was used', async () => {
    const response = await admin.get('/api/admin/visits/export?q=rossi')
    expect(response.data).toHaveLength(2)
    const audit = lastAudit('visits.export')!
    expect(JSON.parse(audit.details)).toEqual({ textFilter: true, rows: 2 })
    expect(audit.details).not.toContain('rossi')
  })
})

describe('people', () => {
  it('deletes every visit and registration of a person, with the signatures', async () => {
    // A signature easy to find in the database files
    const png = signaturePng(777, 33)
    await checkIn('Luca', 'Bassi', 'Omega', signatureDataUrl(png))
    await checkIn('Luca', 'Bassi', 'Omega', signatureDataUrl(png))
    const eventId = (await admin.post('/api/admin/events', { name: 'Evento', startDate: day(), endDate: day() })).data.id
    await admin.post(`/api/admin/events/${eventId}/guests`, { guests: [{ firstName: 'Luca', lastName: 'Bassi', company: 'Omega' }] })
    const files = () =>
      Buffer.concat([server.databasePath, `${server.databasePath}-wal`].map((path) => readFileSync(path, { flag: 'r' })))
    expect(files().includes(png.subarray(-40))).toBe(true)

    const response = await admin.post('/api/admin/people/delete', { searchName: 'luca bassi' })
    expect(response.data).toEqual({ visits: 2, guests: 1 })
    expect((await admin.get('/api/admin/visits?q=bassi')).data.total).toBe(0)
    expect((await admin.get(`/api/admin/events/${eventId}`)).data.guests).toEqual([])
    // secure_delete and the checkpoint: nothing left in the files
    expect(files().includes(png.subarray(-40))).toBe(false)
    expect(lastAudit('person.delete')!.details).not.toContain('bassi')
  })
})

describe('settings', () => {
  it('changes some settings, keeping the others', async () => {
    const response = await admin.patch('/api/admin/settings', { retentionMonths: 6 })
    expect(response.data).toEqual({
      retentionMonths: 6,
      autoCheckoutTime: '20:00',
      kioskTheme: 'light',
      kioskMascot: true
    })
    expect((await admin.get('/api/admin/settings')).data.retentionMonths).toBe(6)
    expect(lastAudit('settings.update')!.details).toBe('{"retentionMonths":6}')
  })

  it.each([
    { retentionMonths: 0 },
    { retentionMonths: 121 },
    { retentionMonths: 1.5 },
    { autoCheckoutTime: '24:00' },
    { autoCheckoutTime: '8:00' },
    { kioskTheme: 'blue' },
    { kioskMascot: 'yes' }
  ])('rejects %o', async (patch) => {
    expect((await admin.patch('/api/admin/settings', patch)).status).toBe(400)
  })
})

describe('notice', () => {
  it('lists the versions, the current one first', async () => {
    await admin.post('/api/admin/notice', { bodyMd: 'Versione 2' })
    const versions = (await admin.get('/api/admin/notice')).data
    expect(versions.map((v: { bodyMd: string }) => v.bodyMd)).toEqual(['Versione 2', 'Informativa'])
    expect(versions[0].publishedBy).toBe('test.admin')
  })

  it('rejects an empty notice', async () => {
    expect((await admin.post('/api/admin/notice', { bodyMd: '   ' })).status).toBe(400)
  })
})

describe('devices', () => {
  it('lists the tablets with their status', async () => {
    await admin.post('/api/admin/devices', { name: 'Waiting' })
    const devices = (await admin.get('/api/admin/devices')).data
    expect(devices.map((d: { name: string; status: string }) => [d.name, d.status])).toEqual([
      ['Waiting', 'waiting'],
      ['Tablet', 'paired']
    ])
    expect(devices[1].lastSeenAt).toEqual(expect.any(String))
  })

  it('rejects an empty name', async () => {
    expect((await admin.post('/api/admin/devices', { name: ' ' })).status).toBe(400)
  })
})
