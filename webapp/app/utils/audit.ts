import type { AuditEntry } from '~~/shared/types/admin'

type Translate = (key: string, values?: Record<string, unknown>) => string

// "system" is the application itself, as for its automatic jobs
export function auditActorLabel(actor: string, t: Translate) {
  return actor === 'system' ? t('audit.sources.system') : actor
}

// An action that this version does not know, written by a newer one, shows
// its code
export function auditActionLabel(action: string, t: Translate, te?: (key: string) => boolean) {
  const key = `audit.actions.${action.replace('.', '_')}`
  return !te || te(key) ? t(key) : action
}

// The objects of an entry: its event, tablet and visit. The tablet that
// made the action is already the user
export function auditObjects(entry: AuditEntry, t: Translate) {
  const objects: string[] = []
  if (entry.eventName) objects.push(t('audit.event', { name: entry.eventName }))
  if (entry.deviceName && !(entry.via === 'kiosk' && entry.actor === entry.deviceName)) {
    objects.push(t('audit.tablet', { name: entry.deviceName }))
  }
  if (entry.visitId) objects.push(t('audit.visit', { id: entry.visitId }))
  return objects
}
