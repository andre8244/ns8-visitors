<script setup lang="ts">
import { NeEmptyState, NeInlineNotification } from '@nethesis/vue-components'
import { faUserClock } from '@fortawesome/free-solid-svg-icons'
import { useIntervalFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import type { Visit } from '~~/shared/types/admin'

const REFRESH_MS = 30_000

const { t } = useI18n()
const { visits, loading, error, reload } = useVisits(() => ({ present: 'true', page: 1, pageSize: 100 }))
const { actionError, checkOut, personDeleted } = useVisitActions(reload)

// Visitors arrive at the tablet while the page is open
useIntervalFn(reload, REFRESH_MS)

const detailsVisit = shallowRef<Visit | null>(null)
const deleteVisit = shallowRef<Visit | null>(null)

function onDeleted(name: string) {
  deleteVisit.value = null
  personDeleted(name)
}
</script>

<template>
  <div>
    <PageHeader :title="t('present.title')" :description="t('present.description')" />
    <NeInlineNotification
      v-if="error || actionError"
      kind="error"
      :title="error ? t('present.cannot_load') : t('visits.cannot_check_out')"
      :description="error || actionError"
      class="mb-6"
    />
    <NeEmptyState
      v-if="!loading && !error && !visits.length"
      :icon="faUserClock"
      :title="t('present.empty_title')"
      :description="t('present.empty_description')"
      class="bg-white dark:bg-gray-950"
    />
    <VisitsTable
      v-else-if="!error"
      :visits="visits"
      :loading="loading"
      mode="present"
      @details="detailsVisit = $event"
      @check-out="checkOut"
      @delete-person="deleteVisit = $event"
    />
    <VisitDetailsDrawer :visit="detailsVisit" @close="detailsVisit = null" />
    <DeletePersonModal :visit="deleteVisit" @close="deleteVisit = null" @deleted="onDeleted" />
  </div>
</template>
