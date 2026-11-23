import { afterEach, describe, expect, it } from 'vitest'
import { formatDateTime, formatDateTimeIso, formatDay } from '../../app/utils/format'
import { intlLocale, pickLocale } from '../../app/utils/locale'

// Local times: the result does not depend on the time zone of the test
const date = new Date(2026, 10, 7, 9, 5)

describe('date formats', () => {
  afterEach(() => {
    intlLocale.value = 'en'
  })

  it('writes the month as a word on the pages', () => {
    intlLocale.value = 'it-IT'
    expect(formatDateTime(date)).toBe('7 nov 2026, 09:05')
    expect(formatDay('2026-11-07')).toBe('7 nov 2026')
  })

  it('follows the regional format of the browser', () => {
    intlLocale.value = 'en-US'
    expect(formatDay('2026-11-07')).toBe('Nov 7, 2026')
    intlLocale.value = 'en-GB'
    expect(formatDay('2026-11-07')).toBe('7 Nov 2026')
  })

  it('writes ISO 8601 dates in the CSV export', () => {
    expect(formatDateTimeIso(date)).toBe('2026-11-07 09:05')
    expect(formatDateTimeIso(null)).toBe('')
  })
})

describe('language', () => {
  it('takes the first language of the browser that the interface has', () => {
    expect(pickLocale(['de-DE', 'it-IT', 'en-US'])).toEqual({ locale: 'it', tag: 'it-IT' })
    expect(pickLocale(['en-GB', 'it'])).toEqual({ locale: 'en', tag: 'en-GB' })
    expect(pickLocale(['IT'])).toEqual({ locale: 'it', tag: 'IT' })
  })

  it('falls back to English', () => {
    expect(pickLocale(['de-DE', 'fr'])).toEqual({ locale: 'en', tag: 'en' })
    expect(pickLocale([])).toEqual({ locale: 'en', tag: 'en' })
  })
})
