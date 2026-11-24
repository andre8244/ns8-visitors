declare module '#auth-utils' {
  interface User {
    kind: 'admin' | 'kiosk'
    name: string
    username?: string
    deviceId?: number
  }

  interface UserSession {
    via: 'ldap' | 'kiosk'
    // Unix time in ms of the sign-in
    signedInAt: number
    // Unix time in ms of the last check of an admin in LDAP, see requireAdmin
    checkedAt?: number
  }
}

export {}
