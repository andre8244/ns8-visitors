import { describe, expect, it } from 'vitest'
import { formatDateTime, formatDateTimeIso, formatDay } from '../../app/utils/format'

// Local times: the result does not depend on the time zone of the test
const date = new Date(2026, 10, 7, 9, 5)

describe('date formats', () => {
  it('writes the month as a word on the pages', () => {
    expect(formatDateTime(date)).toBe('7 nov 2026, 09:05')
    expect(formatDay('2026-11-07')).toBe('7 nov 2026')
  })

  it('writes ISO 8601 dates in the CSV export', () => {
    expect(formatDateTimeIso(date)).toBe('2026-11-07 09:05')
    expect(formatDateTimeIso(null)).toBe('')
  })
})
