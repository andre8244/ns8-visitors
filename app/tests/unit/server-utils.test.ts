import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { deviceStatus } from '../../server/utils/devices'
import { rateLimit } from '../../server/utils/rate-limit'
import { containsPattern, startOfDay } from '../../server/utils/validation'

beforeAll(() => {
  // Auto-imported from h3 in the server
  vi.stubGlobal('createError', (input: { statusCode: number }) => Object.assign(new Error(), input))
})
afterAll(() => {
  vi.unstubAllGlobals()
})

describe('containsPattern', () => {
  it('escapes the LIKE wildcards', () => {
    expect(containsPattern('50%_a\\b')).toBe('%50\\%\\_a\\\\b%')
  })
})

describe('startOfDay', () => {
  it('gives the local midnight', () => {
    expect(startOfDay('2026-03-29')).toEqual(new Date(2026, 2, 29))
  })
})

describe('deviceStatus', () => {
  const now = new Date(2026, 10, 14, 12, 0)
  const later = new Date(2026, 10, 14, 12, 5)
  const base = { revokedAt: null, pairedAt: null, pairingExpiresAt: null }

  it('puts revoked before paired', () => {
    expect(deviceStatus({ ...base, pairedAt: now, revokedAt: now }, now)).toBe('revoked')
  })
  it('tells a code still valid from an expired one', () => {
    expect(deviceStatus({ ...base, pairingExpiresAt: later }, now)).toBe('waiting')
    expect(deviceStatus({ ...base, pairingExpiresAt: now }, now)).toBe('expired')
    expect(deviceStatus(base, now)).toBe('expired')
  })
  it('is paired after the pairing', () => {
    expect(deviceStatus({ ...base, pairedAt: now }, later)).toBe('paired')
  })
})

describe('rateLimit', () => {
  it('lets the requests through again when the window has passed', () => {
    vi.useFakeTimers()
    try {
      for (let i = 0; i < 3; i++) rateLimit('unit', 3, 60_000)
      expect(() => rateLimit('unit', 3, 60_000)).toThrow(expect.objectContaining({ statusCode: 429 }))
      // Rejected requests do not extend the wait
      vi.advanceTimersByTime(60_001)
      expect(() => rateLimit('unit', 3, 60_000)).not.toThrow()
      expect(() => rateLimit('other', 3, 60_000)).not.toThrow()
    } finally {
      vi.useRealTimers()
    }
  })
})
