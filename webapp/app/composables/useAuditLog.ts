import type { AuditEntry } from '~~/shared/types/admin'

export type AuditQuery = {
  actor: string[]
  action: string[]
  via: string[]
  from: string
  to: string
  page: number
  pageSize: number
}

// The actions written by the server, in the order of the action filter
export const AUDIT_ACTIONS = [
  'auth.sign_in',
  'auth.sign_out',
  'auth.session_revoked',
  'visit.check_in',
  'visit.check_in_walk_in',
  'visit.check_out',
  'visit.auto_check_out',
  'visit.view_signature',
  'visits.export',
  'person.delete',
  'retention.delete',
  'event.create',
  'event.update',
  'event.delete',
  'event.add_guests',
  'event.remove_guest',
  'notice.publish',
  'device.create',
  'device.new_pairing_code',
  'device.pair',
  'device.revoke',
  'settings.update'
] as const

export const AUDIT_SOURCES = ['ldap', 'kiosk', 'system'] as const

// One page of the audit log, loaded again when the query changes
export function useAuditLog(query: () => AuditQuery) {
  const { api, errorText } = useApi()
  const entries = shallowRef<AuditEntry[]>([])
  const actors = shallowRef<string[]>([])
  const total = shallowRef(0)
  const loading = shallowRef(true)
  const error = shallowRef('')

  async function reload() {
    try {
      const params = Object.fromEntries(
        Object.entries(query()).filter(([, value]) => value !== '' && !(Array.isArray(value) && !value.length))
      )
      const result = await api<{ entries: AuditEntry[]; total: number; actors: string[] }>('/api/admin/audit', {
        query: params
      })
      entries.value = result.entries
      total.value = result.total
      actors.value = result.actors
      error.value = ''
    } catch (err) {
      error.value = errorText(err)
    } finally {
      loading.value = false
    }
  }

  watch(query, reload, { immediate: true, deep: true })

  return { entries, actors, total, loading, error }
}
