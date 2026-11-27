<script setup lang="ts">
import { NeButton, NeEmptyState, NeInlineNotification, NeLink, NePaginator, NeTextInput } from '@nethesis/vue-components'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faArrowLeft, faCircleArrowUp, faCirclePlus, faMagnifyingGlass, faUsers } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'
import type { EventGuest } from '~~/shared/types/admin'

type EventDetails = { event: { id: number; name: string; startDate: string; endDate: string }; guests: EventGuest[] }

const { t } = useI18n()
const route = useRoute()
const { api, errorText } = useApi()
const { showSuccess } = useToasts()

const eventId = Number(route.params.id)
const details = shallowRef<EventDetails | null>(null)
const loading = shallowRef(true)
const error = shallowRef('')
const notFound = shallowRef(false)

async function reload() {
  try {
    details.value = await api<EventDetails>(`/api/admin/events/${eventId}`)
    error.value = ''
  } catch (err) {
    if (errorStatus(err) === 404 || errorStatus(err) === 400) {
      notFound.value = true
    } else {
      error.value = errorText(err)
    }
  } finally {
    loading.value = false
  }
}
reload()

const guests = computed(() => details.value?.guests ?? [])

// Search and pages in the browser: an event has at most a few thousand guests
const filter = shallowRef('')
const page = shallowRef(1)
const { pageSize, setPageSize } = useTablePageSize('eventGuests')
const filteredGuests = computed(() => {
  const text = normalizeName(filter.value)
  if (!text) return guests.value
  return guests.value.filter((guest) => guest.searchName.includes(text) || normalizeName(guest.company).includes(text))
})
const pageGuests = computed(() => filteredGuests.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
watch(filter, () => (page.value = 1))

const addShown = shallowRef(false)
const importShown = shallowRef(false)
const removeGuest = shallowRef<EventGuest | null>(null)

function onAdded(name: string) {
  addShown.value = false
  showSuccess(t('guests.guest_added'), t('guests.guest_added_description', { name }), { afterDialog: true })
  reload()
}

function onImported(count: number) {
  importShown.value = false
  showSuccess(t('import.guests_imported'), t('import.guests_imported_description', { count }, count), { afterDialog: true })
  reload()
}

async function remove() {
  await api(`/api/admin/events/${eventId}/guests/${removeGuest.value!.id}`, { method: 'DELETE' })
}

function onRemoved() {
  const name = removeGuest.value ? fullName(removeGuest.value) : ''
  removeGuest.value = null
  showSuccess(t('guests.guest_removed'), t('guests.guest_removed_description', { name }), { afterDialog: true })
  reload()
}
</script>

<template>
  <div>
    <NeLink href="/admin/events" class="mb-6 inline-flex items-center gap-2" @click.prevent="navigateTo('/admin/events')">
      <FontAwesomeIcon :icon="faArrowLeft" class="h-4 w-4" aria-hidden="true" />
      {{ t('events.back_to_events') }}
    </NeLink>
    <NeEmptyState
      v-if="notFound"
      :icon="faMagnifyingGlass"
      :title="t('events.event_not_found')"
      :description="t('events.event_not_found_description')"
      class="bg-white dark:bg-gray-950"
    />
    <NeInlineNotification v-else-if="error" kind="error" :title="t('events.cannot_load_event')" :description="error" />
    <template v-else-if="details">
      <PageHeader
        :title="details.event.name"
        :description="formatDayRange(details.event.startDate, details.event.endDate)"
      >
        <template #actions>
          <div class="flex flex-wrap gap-3">
            <NeButton kind="secondary" size="lg" @click="importShown = true">
              <template #prefix>
                <FontAwesomeIcon :icon="faCircleArrowUp" aria-hidden="true" />
              </template>
              {{ t('import.title') }}
            </NeButton>
            <NeButton v-if="guests.length" kind="primary" size="lg" @click="addShown = true">
              <template #prefix>
                <FontAwesomeIcon :icon="faCirclePlus" aria-hidden="true" />
              </template>
              {{ t('guests.add_guest') }}
            </NeButton>
          </div>
        </template>
      </PageHeader>
      <NeEmptyState v-if="!guests.length" :icon="faUsers" :title="t('guests.no_guests')" :description="t('guests.no_guests_description')" class="bg-white dark:bg-gray-950">
        <NeButton kind="primary" size="lg" @click="addShown = true">
          <template #prefix>
            <FontAwesomeIcon :icon="faCirclePlus" aria-hidden="true" />
          </template>
          {{ t('guests.add_guest') }}
        </NeButton>
      </NeEmptyState>
      <template v-else>
        <NeTextInput
          v-model="filter"
          is-search
          :placeholder="t('guests.filter_guests')"
          :aria-label="t('guests.filter_guests')"
          :clear-search-label="t('common.clear_search')"
          class="mb-6 max-w-48 sm:max-w-sm"
        />
        <NeEmptyState
          v-if="!filteredGuests.length"
          :icon="faMagnifyingGlass"
          :title="t('guests.no_guests_found')"
          :description="t('common.try_different_words')"
          class="bg-white dark:bg-gray-950"
        >
          <NeButton kind="tertiary" size="lg" @click="filter = ''">{{ t('common.clear_filter') }}</NeButton>
        </NeEmptyState>
        <GuestsTable v-else :guests="pageGuests" :loading="loading" @remove="removeGuest = $event">
          <template #paginator>
            <NePaginator
              :current-page="page"
              :total-rows="filteredGuests.length"
              :page-size="pageSize"
              :page-sizes="PAGE_SIZE_OPTIONS"
              :previous-label="t('paginator.previous')"
              :next-label="t('paginator.next')"
              :nav-pagination-label="t('paginator.label')"
              :range-of-total-label="t('paginator.of')"
              :page-size-label="t('paginator.show')"
              @select-page="page = $event"
              @select-page-size="(size: number) => { setPageSize(size); page = 1 }"
            />
          </template>
        </GuestsTable>
      </template>
      <AddGuestDrawer :is-shown="addShown" :event-id="eventId" @close="addShown = false" @added="onAdded" />
      <ImportGuestsDrawer
        :is-shown="importShown"
        :event-id="eventId"
        :existing-guests="guests"
        @close="importShown = false"
        @imported="onImported"
      />
      <ConfirmDeleteModal
        :visible="!!removeGuest"
        :title="t('guests.remove_guest')"
        :description="t('guests.remove_guest_description', { name: removeGuest ? fullName(removeGuest) : '' })"
        :error-title="t('guests.cannot_remove_guest')"
        :confirm-label="t('common.remove')"
        :action="remove"
        @close="removeGuest = null"
        @done="onRemoved"
      />
    </template>
  </div>
</template>
