<script setup lang="ts">
import { NeButton, NeHeading, NeInlineNotification } from '@nethesis/vue-components'
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
</script>

<template>
  <KioskDone
    v-if="doneName"
    :title="t('kiosk.checked_in')"
    :description="t('kiosk.checked_in_description', { name: doneName })"
  />
  <div v-else-if="config?.notice">
    <!-- 1. the event, when there are more today -->
    <template v-if="!eventId">
      <NeHeading tag="h1" class="mb-8">{{ t('kiosk.choose_event') }}</NeHeading>
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
    </template>
    <!-- 3a. a guest of the list: signature on the first day, else only the check-in -->
    <template v-else-if="guest">
      <NeHeading tag="h1" class="mb-2">{{ fullName(guest) }}</NeHeading>
      <p class="text-tertiary-neutral mb-8">{{ eventName }}</p>
      <CheckInForm
        v-if="!guest.signed"
        mode="guest"
        :notice="config.notice.bodyMd"
        :saving="saving"
        :error="error"
        @submit="checkInGuest"
      />
      <div v-else class="bg-elevation-0 space-y-6 rounded-md p-6 shadow-sm">
        <p class="text-lg">{{ t('kiosk.already_signed') }}</p>
        <NeInlineNotification v-if="error" kind="error" :title="t('kiosk.cannot_check_in')" :description="error" />
        <div class="flex flex-wrap justify-end gap-3">
          <NeButton kind="tertiary" size="lg" :disabled="saving" @click="guest = null">{{ t('common.cancel') }}</NeButton>
          <NeButton kind="primary" size="lg" :loading="saving" :disabled="saving" @click="checkInGuest()">
            {{ t('kiosk.check_in') }}
          </NeButton>
        </div>
      </div>
    </template>
    <!-- 3b. not in the list: registers and is added to the event -->
    <template v-else-if="walkIn">
      <NeHeading tag="h1" class="mb-2">{{ t('kiosk.walk_in_title') }}</NeHeading>
      <p class="text-tertiary-neutral mb-8">{{ eventName }}</p>
      <CheckInForm mode="walk-in" :notice="config.notice.bodyMd" :saving="saving" :error="error" @submit="checkInWalkIn" />
    </template>
    <!-- 2. search the name in the guest list -->
    <template v-else>
      <NeHeading tag="h1" class="mb-2">{{ t('kiosk.event_title') }}</NeHeading>
      <p class="text-tertiary-neutral mb-8">{{ eventName }}</p>
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
    </template>
  </div>
</template>
