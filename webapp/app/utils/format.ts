import { intlLocale } from './locale'

// Month as a word, as "17 nov 2026, 18:26" in Italian: no doubt between day and month
export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return ''
  return new Intl.DateTimeFormat(intlLocale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

// ISO 8601, as "2026-11-17 18:26": the format of the CSV export. Spreadsheets
// read it as a date and time whatever the language of the computer, and it
// sorts by date even as text
export function formatDateTimeIso(value: Date | string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatTime(value: Date | string | null | undefined) {
  if (!value) return ''
  return new Intl.DateTimeFormat(intlLocale.value, { timeStyle: 'short' }).format(new Date(value))
}

// A YYYY-MM-DD day, without converting it through UTC
export function formatDay(value: string) {
  const [y = 0, m = 1, d = 1] = value.split('-').map(Number)
  return new Intl.DateTimeFormat(intlLocale.value, { dateStyle: 'medium' }).format(new Date(y, m - 1, d))
}

export function formatDayRange(start: string, end: string) {
  return start === end ? formatDay(start) : `${formatDay(start)} – ${formatDay(end)}`
}

export function todayDate() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function fullName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`
}
