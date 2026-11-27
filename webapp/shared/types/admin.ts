// Responses of the admin API, as the browser receives them (dates as strings)

export type Visit = {
  id: number
  firstName: string
  lastName: string
  company: string
  host: string | null
  searchName: string
  eventId: number | null
  eventName: string | null
  signed: boolean
  checkInAt: string
  checkOutAt: string | null
  checkOutBy: 'visitor' | 'reception' | 'auto' | null
}

export type EventSummary = {
  id: number
  name: string
  startDate: string
  endDate: string
  guests: number
  signedGuests: number
}

export type EventGuest = {
  id: number
  firstName: string
  lastName: string
  company: string
  searchName: string
  addedOnSite: boolean
  signedAt: string | null
}

export type NoticeVersion = {
  id: number
  bodyMd: string
  publishedBy: string
  publishedAt: string
}

export type DeviceStatus = 'waiting' | 'expired' | 'paired' | 'revoked'

export type Device = {
  id: number
  name: string
  status: DeviceStatus
  pairingExpiresAt: string | null
  pairedAt: string | null
  lastSeenAt: string | null
  revokedAt: string | null
}

export type PairingCode = {
  id: number
  name: string
  code: string
  expiresAt: string
}

export type Settings = {
  retentionMonths: number
  autoCheckoutTime: string
  kioskTheme: 'light' | 'dark'
  kioskMascot: boolean
}

export type AuditEntry = {
  id: number
  at: string
  // The user name of an admin, the name of a tablet, "system" for the
  // application itself
  actor: string
  via: 'ldap' | 'kiosk' | 'system'
  action: string
  visitId: number | null
  eventId: number | null
  eventName: string | null
  deviceId: number | null
  deviceName: string | null
  details: Record<string, unknown> | null
}

// The counters of the dashboard
export type DashboardStats = {
  // Visitors in the office now
  present: number
  // Visits checked in today, and in the last 30 days, today included
  visitsToday: number
  visitsLast30Days: number
  // Events in progress today, and starting after today
  eventsToday: number
  upcomingEvents: number
  // Tablets paired and not revoked
  pairedTablets: number
}
