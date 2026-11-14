<script setup lang="ts">
import {
  NeDropdown,
  NeTable,
  NeTableBody,
  NeTableCell,
  NeTableHead,
  NeTableHeadCell,
  NeTableRow,
  type NeDropdownItem
} from '@nethesis/vue-components'
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'
import type { EventSummary } from '~~/shared/types/admin'

defineProps<{ events: EventSummary[]; loading: boolean }>()
const emit = defineEmits<{ edit: [event: EventSummary]; delete: [event: EventSummary] }>()

const { t } = useI18n()

function menuItems(event: EventSummary): NeDropdownItem[] {
  return [
    { id: 'edit', label: t('common.edit'), icon: faPenToSquare, action: () => emit('edit', event) },
    { id: 'delete', label: t('common.delete'), icon: faTrash, danger: true, action: () => emit('delete', event) }
  ]
}
</script>

<template>
  <NeTable :aria-label="t('events.title')" :loading="loading" card-breakpoint="md">
    <NeTableHead>
      <NeTableHeadCell>{{ t('events.name') }}</NeTableHeadCell>
      <NeTableHeadCell>{{ t('events.dates') }}</NeTableHeadCell>
      <NeTableHeadCell>{{ t('events.guests') }}</NeTableHeadCell>
      <NeTableHeadCell>
        <!-- no header for actions -->
      </NeTableHeadCell>
    </NeTableHead>
    <NeTableBody>
      <NeTableRow v-for="event in events" :key="event.id">
        <NeTableCell :data-label="t('events.name')">
          <NuxtLink :to="`/admin/events/${event.id}`" class="justify-self-start font-medium hover:underline">
            {{ event.name }}
          </NuxtLink>
        </NeTableCell>
        <NeTableCell :data-label="t('events.dates')">{{ formatDayRange(event.startDate, event.endDate) }}</NeTableCell>
        <NeTableCell :data-label="t('events.guests')">
          {{ t('events.signed_of_total', { signed: event.signedGuests, total: event.guests }) }}
        </NeTableCell>
        <NeTableCell :data-label="t('common.actions')">
          <div class="-ml-2.5 flex gap-2 md:ml-0 md:justify-end">
            <NeDropdown :items="menuItems(event)" align-to-right :open-menu-aria-label="t('common.open_menu')" />
          </div>
        </NeTableCell>
      </NeTableRow>
    </NeTableBody>
  </NeTable>
</template>
