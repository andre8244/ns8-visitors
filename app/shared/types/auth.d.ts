declare module '#auth-utils' {
  interface User {
    kind: 'admin' | 'kiosk'
    name: string
    username?: string
    deviceId?: number
  }

  interface UserSession {
    via: 'ldap' | 'kiosk'
  }
}

export {}
