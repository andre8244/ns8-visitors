import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { day, signatureDataUrl, startServer, unix, type Client, type TestServer } from './server'

let server: TestServer
let admin: Client
let kiosk: Client
let noticeId: number
let eventId: number

const signed = () => ({ noticeVersionId: noticeId, signature: signatureDataUrl() })

async function findGuest(q: string, id = eventId) {
  const response = await kiosk.get(`/api/kiosk/events/${id}/guests?q=${encodeURIComponent(q)}`)
  return response.data[0]
}

beforeAll(async () => {
  server = await startServer()
  admin = await server.admin()
  noticeId = (await admin.post('/api/admin/notice', { bodyMd: 'Informativa' })).data.id
  kiosk = await server.kiosk(admin)
  eventId = (await admin.post('/api/admin/events', { name: 'Corso NS8', startDate: day(), endDate: day(1) })).data.id
  await admin.post(`/api/admin/events/${eventId}/guests`, {
    guests: [
      { firstName: 'Anna', lastName: 'Bianchi', company: 'Alfa' },
      { firstName: 'Bruno', lastName: 'Bianchi', company: 'Beta' },
      { firstName: 'Carla', lastName: 'Conti', company: 'Gamma' }
    ]
  })
})
afterAll(() => server?.stop())

describe('event management', () => {
  it('rejects an end date before the start date', async () => {
    const response = await admin.post('/api/admin/events', { name: 'X', startDate: day(2), endDate: day(1) })
    expect(response.status).toBe(400)
    expect((await admin.post('/api/admin/events', { name: 'X', startDate: '2026-1-1', endDate: day() })).status).toBe(400)
  })

  it('updates an event', async () => {
    const created = (await admin.post('/api/admin/events', { name: 'Old', startDate: day(5), endDate: day(5) })).data
    const updated = await admin.patch(`/api/admin/events/${created.id}`, { name: 'New', startDate: day(5), endDate: day(6) })
    expect(updated.data).toMatchObject({ name: 'New', endDate: day(6) })
    expect((await admin.patch('/api/admin/events/9999', { name: 'X', startDate: day(), endDate: day() })).status).toBe(404)
  })

  it('accepts at most 2000 guests a request', async () => {
    const guests = Array.from({ length: 2001 }, (_, i) => ({ firstName: `N${i}`, lastName: 'L', company: 'C' }))
    expect((await admin.post(`/api/admin/events/${eventId}/guests`, { guests })).status).toBe(400)
    expect((await admin.post('/api/admin/events/9999/guests', { guests: guests.slice(0, 1) })).status).toBe(404)
  })

  it('lists upcoming and past events with the guest counts', async () => {
    const past = (await admin.post('/api/admin/events', { name: 'Ieri', startDate: day(-2), endDate: day(-1) })).data
    const upcoming = (await admin.get('/api/admin/events')).data
    expect(upcoming.find((e: { id: number }) => e.id === eventId)).toMatchObject({ guests: 3, signedGuests: 0 })
    expect(upcoming.some((e: { id: number }) => e.id === past.id)).toBe(false)
    expect((await admin.get('/api/admin/events?period=past')).data.map((e: { id: number }) => e.id)).toEqual([past.id])
  })
})

describe('tablet', () => {
  it('shows only the events of today', async () => {
    const future = (await admin.post('/api/admin/events', { name: 'Domani', startDate: day(1), endDate: day(1) })).data
    const events = (await kiosk.get('/api/kiosk/config')).data.events
    expect(events).toEqual([{ id: eventId, name: 'Corso NS8' }])
    expect((await kiosk.get(`/api/kiosk/events/${future.id}/guests?q=bianchi`)).status).toBe(404)
  })

  it('finds the guests after 3 letters, in name order', async () => {
    expect((await kiosk.get(`/api/kiosk/events/${eventId}/guests?q=bi`)).data).toEqual([])
    const found = (await kiosk.get(`/api/kiosk/events/${eventId}/guests?q=bianchi`)).data
    expect(found.map((g: { firstName: string }) => g.firstName)).toEqual(['Anna', 'Bruno'])
    expect(found[0]).toEqual({ id: expect.any(Number), firstName: 'Anna', lastName: 'Bianchi', company: 'Alfa', signed: false })
  })

  it('asks for the signature on the first day', async () => {
    const guest = await findGuest('anna')
    const unsigned = await kiosk.post(`/api/kiosk/events/${eventId}/check-in`, { guestId: guest.id })
    expect(unsigned.status).toBe(400)
    expect(unsigned.data.statusMessage).toBe('signature_required')

    const response = await kiosk.post(`/api/kiosk/events/${eventId}/check-in`, { guestId: guest.id, signed: signed() })
    expect(response.data).toEqual({ ok: true, signed: true })
    expect((await findGuest('anna')).signed).toBe(true)
  })

  it('does not check in a guest twice', async () => {
    const guest = await findGuest('anna')
    const again = await kiosk.post(`/api/kiosk/events/${eventId}/check-in`, { guestId: guest.id })
    expect(again.status).toBe(409)
    expect(again.data.statusMessage).toBe('already_checked_in')
  })

  it('checks in again without signature after the check-out', async () => {
    const guest = await findGuest('anna')
    const [visit] = (await kiosk.get('/api/kiosk/present?q=anna')).data
    await kiosk.post(`/api/kiosk/visits/${visit.id}/check-out`)
    const response = await kiosk.post(`/api/kiosk/events/${eventId}/check-in`, { guestId: guest.id })
    expect(response.data).toEqual({ ok: true, signed: false })
  })

  it('does not ask for the signature on the next days', async () => {
    const guest = await findGuest('carla')
    await kiosk.post(`/api/kiosk/events/${eventId}/check-in`, { guestId: guest.id, signed: signed() })
    // Move the first check-in to yesterday, closed
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const db = server.db()
    db.prepare("UPDATE event SET start_date = ? WHERE id = ?").run(day(-1), eventId)
    db.prepare("UPDATE visit SET check_in_at = ?, check_out_at = ?, check_out_by = 'auto' WHERE event_guest_id = ?").run(
      unix(yesterday),
      unix(yesterday) + 3600,
      guest.id
    )
    const response = await kiosk.post(`/api/kiosk/events/${eventId}/check-in`, { guestId: guest.id })
    expect(response.data).toEqual({ ok: true, signed: false })
    const visits = db.prepare('SELECT signature, notice_version_id FROM visit WHERE event_guest_id = ? ORDER BY id').all(guest.id) as {
      signature: Buffer | null
      notice_version_id: number | null
    }[]
    expect(visits).toHaveLength(2)
    expect(visits[0]!.signature).not.toBeNull()
    expect(visits[1]).toEqual({ signature: null, notice_version_id: null })
  })

  it('asks for the signature on a later day to a guest absent on the first', async () => {
    // The event started yesterday (previous test): Bruno comes for the first time today
    const guest = await findGuest('bruno')
    expect(guest.signed).toBe(false)
    const unsigned = await kiosk.post(`/api/kiosk/events/${eventId}/check-in`, { guestId: guest.id })
    expect(unsigned.status).toBe(400)
    expect(unsigned.data.statusMessage).toBe('signature_required')

    const response = await kiosk.post(`/api/kiosk/events/${eventId}/check-in`, { guestId: guest.id, signed: signed() })
    expect(response.data).toEqual({ ok: true, signed: true })
    const visit = server.db().prepare('SELECT signature, notice_version_id FROM visit WHERE event_guest_id = ?').get(guest.id) as {
      signature: Buffer | null
      notice_version_id: number | null
    }
    expect(visit.signature).not.toBeNull()
    expect(visit.notice_version_id).toBe(noticeId)
  })

  it('rejects a guest of another event', async () => {
    const other = (await admin.post('/api/admin/events', { name: 'Altro', startDate: day(), endDate: day() })).data
    await admin.post(`/api/admin/events/${other.id}/guests`, { guests: [{ firstName: 'Dario', lastName: 'Esposito', company: 'D' }] })
    const guest = await findGuest('esposito', other.id)
    const response = await kiosk.post(`/api/kiosk/events/${eventId}/check-in`, { guestId: guest.id, signed: signed() })
    expect(response.status).toBe(404)
  })

  it('adds a guest not in the list, signed and marked as added on site', async () => {
    const response = await kiosk.post(`/api/kiosk/events/${eventId}/walk-in`, {
      firstName: 'Elena',
      lastName: 'Fabbri',
      company: 'Zeta',
      ...signed()
    })
    expect(response.status).toBe(200)
    const detail = (await admin.get(`/api/admin/events/${eventId}`)).data
    const guest = detail.guests.find((g: { lastName: string }) => g.lastName === 'Fabbri')
    expect(guest).toMatchObject({ addedOnSite: true, signedAt: expect.any(String) })
    expect((await findGuest('fabbri')).signed).toBe(true)
  })

  it('rejects a walk-in without signature', async () => {
    const response = await kiosk.post(`/api/kiosk/events/${eventId}/walk-in`, {
      firstName: 'X',
      lastName: 'Y',
      company: 'Z',
      noticeVersionId: noticeId
    })
    expect(response.status).toBe(400)
  })
})

describe('deletion', () => {
  it('removes a guest, keeping the visit in the register', async () => {
    const guest = (await admin.get(`/api/admin/events/${eventId}`)).data.guests.find((g: { firstName: string }) => g.firstName === 'Anna')
    expect((await admin.delete(`/api/admin/events/${eventId}/guests/${guest.id}`)).status).toBe(200)
    expect((await admin.delete(`/api/admin/events/${eventId}/guests/${guest.id}`)).status).toBe(404)
    const visits = (await admin.get(`/api/admin/visits?eventId=${eventId}&q=anna`)).data
    expect(visits.total).toBe(2)
  })

  it('deletes the guests with the event, keeping the visits', async () => {
    expect((await admin.delete(`/api/admin/events/${eventId}`)).status).toBe(200)
    const db = server.db()
    expect(db.prepare('SELECT count(*) AS n FROM event_guest WHERE event_id = ?').get(eventId)).toEqual({ n: 0 })
    const visits = db.prepare("SELECT event_id FROM visit WHERE search_name LIKE 'carla%'").all()
    expect(visits).toEqual([{ event_id: null }, { event_id: null }])
    expect((await admin.get(`/api/admin/events/${eventId}`)).status).toBe(404)
  })
})
