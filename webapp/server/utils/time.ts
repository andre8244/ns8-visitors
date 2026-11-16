// Dates and times are local to the office: the container runs with
// TZ=Europe/Rome (see Containerfile)

// YYYY-MM-DD of the local day of the given instant
export function localDate(at: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`
}

// When an open visit is closed automatically: at the closing time of its
// day, or at the end of the day if the visitor arrived after it
export function autoCheckOutAt(checkInAt: Date, closingTime: string) {
  const [hours, minutes] = closingTime.split(':').map(Number)
  const y = checkInAt.getFullYear()
  const m = checkInAt.getMonth()
  const d = checkInAt.getDate()
  const closing = new Date(y, m, d, hours, minutes)
  return checkInAt < closing ? closing : new Date(y, m, d + 1)
}

// The same day and time, the given number of months earlier. The day is
// clamped to the end of the month: 31 March minus 1 month is 28/29 February
export function monthsBefore(at: Date, months: number) {
  const y = at.getFullYear()
  const m = at.getMonth() - months
  const lastDay = new Date(y, m + 1, 0).getDate()
  return new Date(y, m, Math.min(at.getDate(), lastDay), at.getHours(), at.getMinutes(), at.getSeconds())
}
