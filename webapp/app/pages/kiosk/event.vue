<script setup lang="ts">
import { NeButton, NeInlineNotification } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'
import type { CheckInSubmit } from '~/components/kiosk/CheckInForm.vue'
import type { NameSearchResult } from '~/components/kiosk/NameSearch.vue'

definePageMeta({ layout: 'kiosk', middleware: 'kiosk' })

type Guest = NameSearchResult & { signed: boolean }

const { t } = useI18n()
const { config, api, loadConfig } = useKiosk()
const { saving, error, run } = useCheckIn()

if (!config.value) {
  loadConfig().catch(() => {
    navigateTo('/kiosk')
  })
}

const events = computed(() => config.value?.events ?? [])
const chosenEventId = shallowRef<number | null>(null)
// With one event today, no need to choose
const eventId = computed(() => chosenEventId.value ?? (events.value.length === 1 ? events.value[0]!.id : null))
const eventName = computed(() => events.value.find((event) => event.id === eventId.value)?.name ?? '')

const { query, results, searched, error: searchError } = useNameSearch<Guest>(() =>
  eventId.value ? `/api/kiosk/events/${eventId.value}/guests` : null
)

const guest = shallowRef<Guest | null>(null)
const walkIn = shallowRef(false)
const doneName = shallowRef('')

async function checkInGuest(submitted?: CheckInSubmit) {
  const selected = guest.value!
  const signed = submitted ? { noticeVersionId: config.value!.notice!.id, signature: submitted.signature } : undefined
  const url: string = `/api/kiosk/events/${eventId.value}/check-in`
  const ok = await run(() => api<{ ok: boolean }>(url, { method: 'POST', body: { guestId: selected.id, signed } }))
  if (ok) doneName.value = fullName(selected)
}

async function checkInWalkIn({ person, signature }: CheckInSubmit) {
  const body = {
    firstName: person.firstName,
    lastName: person.lastName,
    company: person.company,
    noticeVersionId: config.value!.notice!.id,
    signature
  }
  const url: string = `/api/kiosk/events/${eventId.value}/walk-in`
  const ok = await run(() => api<{ ok: boolean }>(url, { method: 'POST', body }))
  if (ok) doneName.value = fullName(person)
}

function mascotHelp() {
  if (!eventId.value) return t('kiosk.mascot.help.choose_event')
  if (guest.value) return guest.value.signed ? t('kiosk.mascot.help.event_signed') : t('kiosk.mascot.help.event_sign')
  if (walkIn.value) return t('kiosk.mascot.help.walk_in')
  return t('kiosk.mascot.help.event_search', { count: SEARCH_MIN_LENGTH })
}

useMascot(() => {
  // An error of the step on screen: the check-in of a guest or a walk-in, else the search
  const sad = !!(guest.value || walkIn.value ? error.value : eventId.value && searchError.value)
  return { mood: sad ? 'sad' : 'normal', message: sad ? t('kiosk.mascot.sorry') : '', help: mascotHelp(), compact: true }
})
</script>

<template>
  <KioskDone
    v-if="doneName"
    :title="t('kiosk.checked_in')"
    :description="t('kiosk.checked_in_description')"
  />
  <template v-else-if="config?.notice">
    <!-- 1. the event, when there are more today -->
    <KioskPage v-if="!eventId" :title="t('kiosk.choose_event')">
      <div class="space-y-4">
        <NeButton
          v-for="event in events"
          :key="event.id"
          kind="secondary"
          size="lg"
          class="w-full justify-start"
          @click="chosenEventId = event.id"
        >
          {{ event.name }}
        </NeButton>
      </div>
    </KioskPage>
    <!-- 3a. a guest of the list: signature on the first day, else only the check-in -->
    <KioskPage v-else-if="guest" :title="fullName(guest)" :subtitle="eventName">
      <CheckInForm
        v-if="!guest.signed"
        mode="guest"
        :notice="config.notice.bodyMd"
        :saving="saving"
        :error="error"
        @submit="checkInGuest"
      />
      <div v-else class="space-y-6">
        <p class="text-lg">{{ t('kiosk.already_signed') }}</p>
        <NeInlineNotification v-if="error" kind="error" :title="t('kiosk.cannot_check_in')" :description="error" />
        <div class="flex flex-wrap justify-end gap-3">
          <NeButton kind="tertiary" size="lg" :disabled="saving" @click="guest = null">{{ t('common.cancel') }}</NeButton>
          <NeButton kind="primary" size="lg" :loading="saving" :disabled="saving" @click="checkInGuest()">
            {{ t('kiosk.check_in') }}
          </NeButton>
        </div>
      </div>
      </KioskPage>
    <!-- 3b. not in the list: registers and is added to the event -->
    <KioskPage v-else-if="walkIn" :title="t('kiosk.walk_in_title')" :subtitle="eventName">
      <CheckInForm mode="walk-in" :notice="config.notice.bodyMd" :saving="saving" :error="error" @submit="checkInWalkIn" />
      </KioskPage>
    <!-- 2. search the name in the guest list -->
    <KioskPage v-else :title="t('kiosk.event_title')" :subtitle="eventName">
      <NeInlineNotification v-if="searchError" kind="error" :title="t('kiosk.cannot_search')" :description="searchError" class="mb-6" />
      <NameSearch
        v-model="query"
        :label="t('kiosk.search_your_name')"
        :results="results"
        :searched="searched"
        :min-length="SEARCH_MIN_LENGTH"
        :action-label="t('kiosk.select')"
        @select="guest = $event as Guest"
      >
        <div class="border-layout-divider flex flex-wrap items-center gap-4 border-t pt-6">
          <p>{{ t('kiosk.not_in_list') }}</p>
          <NeButton kind="tertiary" size="lg" @click="walkIn = true">{{ t('kiosk.register_walk_in') }}</NeButton>
        </div>
      </NameSearch>
    </KioskPage>
  </template>
</template>
