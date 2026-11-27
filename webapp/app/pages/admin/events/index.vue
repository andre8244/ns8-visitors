<script setup lang="ts">
import { NeButton, NeEmptyState, NeInlineNotification, NeTabs } from '@nethesis/vue-components'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCalendarDays, faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'
import type { EventSummary } from '~~/shared/types/admin'

const { t } = useI18n()
const { api, errorText } = useApi()
const { showSuccess } = useToasts()

const period = shallowRef<'upcoming' | 'past'>('upcoming')
const events = shallowRef<EventSummary[]>([])
const loading = shallowRef(true)
const error = shallowRef('')

const tabs = computed(() => [
  { name: 'upcoming', label: t('events.upcoming') },
  { name: 'past', label: t('events.past') }
])

async function reload() {
  try {
    events.value = await api<EventSummary[]>('/api/admin/events', { query: { period: period.value } })
    error.value = ''
  } catch (err) {
    error.value = errorText(err)
  } finally {
    loading.value = false
  }
}

watch(
  period,
  () => {
    loading.value = true
    reload()
  },
  { immediate: true }
)

const drawerShown = shallowRef(false)
const editEvent = shallowRef<EventSummary | null>(null)
const deleteEvent = shallowRef<EventSummary | null>(null)

function openCreate() {
  editEvent.value = null
  drawerShown.value = true
}

function openEdit(event: EventSummary) {
  editEvent.value = event
  drawerShown.value = true
}

function onSaved(name: string, created: boolean) {
  drawerShown.value = false
  showSuccess(
    created ? t('events.event_created') : t('events.event_updated'),
    t(created ? 'events.event_created_description' : 'events.event_updated_description', { name }),
    { afterDialog: true }
  )
  reload()
}

async function removeEvent() {
  await api(`/api/admin/events/${deleteEvent.value!.id}`, { method: 'DELETE' })
}

function onDeleted() {
  const name = deleteEvent.value?.name ?? ''
  deleteEvent.value = null
  showSuccess(t('events.event_deleted'), t('events.event_deleted_description', { name }), { afterDialog: true })
  reload()
}
</script>

<template>
  <div>
    <PageHeader :title="t('events.title')" :description="t('events.description')">
      <template #actions>
        <NeButton kind="primary" size="lg" @click="openCreate">
          <template #prefix>
            <FontAwesomeIcon :icon="faCirclePlus" aria-hidden="true" />
          </template>
          {{ t('events.create_event') }}
        </NeButton>
      </template>
    </PageHeader>
    <NeTabs
      :tabs="tabs"
      :selected="period"
      :sr-tabs-label="t('events.periods')"
      :sr-select-tab-label="t('common.select_tab')"
      class="mb-6"
      @select-tab="period = $event"
    />
    <NeInlineNotification v-if="error" kind="error" :title="t('events.cannot_load')" :description="error" class="mb-6" />
    <NeEmptyState
      v-if="!loading && !error && !events.length"
      :icon="faCalendarDays"
      :title="period === 'upcoming' ? t('events.no_upcoming_events') : t('events.no_past_events')"
      :description="period === 'upcoming' ? t('events.no_upcoming_events_description') : undefined"
      class="bg-white dark:bg-gray-950"
    />
    <EventsTable v-else-if="!error" :events="events" :loading="loading" @edit="openEdit" @delete="deleteEvent = $event" />
    <EventDrawer :is-shown="drawerShown" :event="editEvent" @close="drawerShown = false" @saved="onSaved" />
    <ConfirmDeleteModal
      :visible="!!deleteEvent"
      :title="t('events.delete_event')"
      :description="t('events.delete_event_description', { name: deleteEvent?.name ?? '' })"
      :error-title="t('events.cannot_delete_event')"
      :action="removeEvent"
      @close="deleteEvent = null"
      @done="onDeleted"
    />
  </div>
</template>
