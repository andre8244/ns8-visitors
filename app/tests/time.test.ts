import { describe, expect, it } from 'vitest'
import { autoCheckOutAt, localDate, monthsBefore } from '../server/utils/time'
import { normalizeName, searchNameOf } from '../shared/utils/names'

describe('autoCheckOutAt', () => {
  it('closes at the closing time of the check-in day', () => {
    expect(autoCheckOutAt(new Date(2026, 10, 13, 9, 30), '20:00')).toEqual(new Date(2026, 10, 13, 20, 0))
  })
  it('closes at the end of the day after the closing time', () => {
    expect(autoCheckOutAt(new Date(2026, 10, 13, 21, 5), '20:00')).toEqual(new Date(2026, 10, 14, 0, 0))
  })
  it('works across the end of the month', () => {
    expect(autoCheckOutAt(new Date(2026, 11, 31, 22, 0), '20:00')).toEqual(new Date(2027, 0, 1, 0, 0))
  })
})

describe('monthsBefore', () => {
  it('goes back whole months', () => {
    expect(monthsBefore(new Date(2026, 10, 13, 10, 0), 12)).toEqual(new Date(2025, 10, 13, 10, 0))
  })
  it('clamps the day to the end of a shorter month', () => {
    expect(monthsBefore(new Date(2026, 2, 31), 1)).toEqual(new Date(2026, 1, 28))
    expect(monthsBefore(new Date(2028, 2, 31), 1)).toEqual(new Date(2028, 1, 29))
  })
})

describe('localDate', () => {
  it('formats the local day', () => {
    expect(localDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('normalizeName', () => {
  it('removes accents, case and extra spaces', () => {
    expect(normalizeName("  Nicolò   D'Amico ")).toBe("nicolo d'amico")
    expect(searchNameOf({ firstName: 'José', lastName: 'Ñúñez' })).toBe('jose nunez')
  })
})
