<script setup lang="ts">
import { NeInlineNotification } from '@nethesis/vue-components'
import { faCalendarDay, faClipboardList, faTabletScreenButton, faUserClock } from '@fortawesome/free-solid-svg-icons'
import { useIntervalFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

const REFRESH_MS = 30_000

const { t } = useI18n()
const { stats, loading, error, reload } = useDashboardStats()

// Visitors arrive at the tablet while the page is open
useIntervalFn(reload, REFRESH_MS)

const cards = computed(() => [
  { title: t('dashboard.present'), counter: stats.value?.present, icon: faUserClock, to: '/admin/present' },
  { title: t('dashboard.visits_today'), counter: stats.value?.visitsToday, icon: faClipboardList, to: '/admin/register' },
  { title: t('dashboard.visits_last_30_days'), counter: stats.value?.visitsLast30Days, icon: faClipboardList, to: '/admin/register' },
  { title: t('dashboard.events_today'), counter: stats.value?.eventsToday, icon: faCalendarDay, to: '/admin/events' },
  { title: t('dashboard.upcoming_events'), counter: stats.value?.upcomingEvents, icon: faCalendarDay, to: '/admin/events' },
  { title: t('dashboard.paired_tablets'), counter: stats.value?.pairedTablets, icon: faTabletScreenButton, to: '/admin/devices' }
])
</script>

<template>
  <div>
    <PageHeader :title="t('dashboard.title')" />
    <NeInlineNotification v-if="error" kind="error" :title="t('dashboard.cannot_load')" :description="error" class="mb-6" />
    <div v-if="!error || stats" class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <CounterCard
        v-for="card in cards"
        :key="card.title"
        :title="card.title"
        :counter="card.counter ?? null"
        :icon="card.icon"
        :to="card.to"
        :loading="loading"
      />
    </div>
  </div>
</template>
