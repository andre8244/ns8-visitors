const LOCALE = 'it-IT'

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return ''
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export function formatTime(value: Date | string | null | undefined) {
  if (!value) return ''
  return new Intl.DateTimeFormat(LOCALE, { timeStyle: 'short' }).format(new Date(value))
}

// A YYYY-MM-DD day, without converting it through UTC
export function formatDay(value: string) {
  const [y = 0, m = 1, d = 1] = value.split('-').map(Number)
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' }).format(new Date(y, m - 1, d))
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
