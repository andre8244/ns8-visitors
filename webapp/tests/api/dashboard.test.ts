import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { day, signatureDataUrl, startServer, unix, type Client, type TestServer } from './server'

let server: TestServer
let admin: Client
let kiosk: Client

beforeAll(async () => {
  server = await startServer()
  admin = await server.admin()
  const noticeId = (await admin.post('/api/admin/notice', { bodyMd: 'Informativa' })).data.id
  kiosk = await server.kiosk(admin)
  // A second tablet, revoked: not counted
  await server.kiosk(admin, 'Revoked')
  const revokedId = (await admin.get('/api/admin/devices')).data.find((d: { name: string }) => d.name === 'Revoked').id
  await admin.post(`/api/admin/devices/${revokedId}/revoke`)

  for (const firstName of ['Anna', 'Bruno', 'Carla']) {
    await kiosk.post('/api/kiosk/visits', {
      firstName,
      lastName: 'Rossi',
      company: 'ACME',
      noticeVersionId: noticeId,
      signature: signatureDataUrl()
    })
  }
  const [anna] = (await kiosk.get('/api/kiosk/present?q=anna')).data
  await kiosk.post(`/api/kiosk/visits/${anna.id}/check-out`)

  const db = server.db()
  // Bruno came 10 days ago, Carla 40 days ago: both closed
  const daysAgo = (days: number) => {
    const at = new Date()
    at.setDate(at.getDate() - days)
    return unix(at)
  }
  const move = db.prepare("UPDATE visit SET check_in_at = ?, check_out_at = ?, check_out_by = 'auto' WHERE first_name = ?")
  move.run(daysAgo(10), daysAgo(10) + 3600, 'Bruno')
  move.run(daysAgo(40), daysAgo(40) + 3600, 'Carla')

  await admin.post('/api/admin/events', { name: 'Today', startDate: day(-1), endDate: day(1) })
  await admin.post('/api/admin/events', { name: 'Tomorrow', startDate: day(1), endDate: day(1) })
  await admin.post('/api/admin/events', { name: 'Next week', startDate: day(7), endDate: day(8) })
  await admin.post('/api/admin/events', { name: 'Past', startDate: day(-5), endDate: day(-4) })
})
afterAll(() => server?.stop())

describe('dashboard', () => {
  it('counts visits, events and tablets', async () => {
    const response = await admin.get('/api/admin/stats')
    expect(response.status).toBe(200)
    expect(response.data).toEqual({
      present: 0,
      visitsToday: 1,
      visitsLast30Days: 2,
      eventsToday: 1,
      upcomingEvents: 2,
      pairedTablets: 1
    })
  })

  it('counts a visitor in the office', async () => {
    const [anna] = (await admin.get('/api/admin/visits?q=anna')).data.visits
    expect(anna.checkOutAt).not.toBeNull()
    await server.db().prepare('UPDATE visit SET check_out_at = NULL, check_out_by = NULL WHERE id = ?').run(anna.id)
    expect((await admin.get('/api/admin/stats')).data.present).toBe(1)
  })

  it('is for admins only', async () => {
    expect((await server.client().get('/api/admin/stats')).status).toBe(401)
    expect((await kiosk.get('/api/admin/stats')).status).toBe(403)
  })
})
