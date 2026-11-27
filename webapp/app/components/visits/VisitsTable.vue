<script setup lang="ts">
import {
  NeBadgeV2,
  NeButton,
  NeDropdown,
  NeTable,
  NeTableBody,
  NeTableCell,
  NeTableHead,
  NeTableHeadCell,
  NeTableRow,
  type NeDropdownItem
} from '@nethesis/vue-components'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faDoorOpen, faEye, faTrash } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'
import type { Visit } from '~~/shared/types/admin'

// present: visitors still in the office, with the check-out at hand.
// register: every visit, with check-in and check-out
const props = defineProps<{
  visits: Visit[]
  loading: boolean
  mode: 'present' | 'register'
}>()

const emit = defineEmits<{
  details: [visit: Visit]
  checkOut: [visit: Visit]
  deletePerson: [visit: Visit]
}>()

const { t } = useI18n()

function menuItems(visit: Visit): NeDropdownItem[] {
  const items: NeDropdownItem[] = []
  if (props.mode === 'present') {
    items.push({ id: 'details', label: t('visits.details'), icon: faEye, action: () => emit('details', visit) })
  } else if (!visit.checkOutAt) {
    items.push({ id: 'check-out', label: t('visits.check_out'), icon: faDoorOpen, action: () => emit('checkOut', visit) })
  }
  items.push({
    id: 'delete-person',
    label: t('visits.delete_person'),
    icon: faTrash,
    danger: true,
    action: () => emit('deletePerson', visit)
  })
  return items
}
</script>

<template>
  <NeTable :aria-label="t(mode === 'present' ? 'present.title' : 'register.title')" :loading="loading" card-breakpoint="lg">
    <NeTableHead>
      <NeTableHeadCell>{{ t('visits.visitor') }}</NeTableHeadCell>
      <NeTableHeadCell>{{ t('visits.company') }}</NeTableHeadCell>
      <NeTableHeadCell>{{ t('visits.host') }}</NeTableHeadCell>
      <NeTableHeadCell>{{ t('visits.event') }}</NeTableHeadCell>
      <NeTableHeadCell>{{ t('visits.check_in') }}</NeTableHeadCell>
      <NeTableHeadCell v-if="mode === 'register'">{{ t('visits.check_out_column') }}</NeTableHeadCell>
      <NeTableHeadCell>
        <!-- no header for actions -->
      </NeTableHeadCell>
    </NeTableHead>
    <NeTableBody>
      <NeTableRow v-for="visit in visits" :key="visit.id">
        <NeTableCell :data-label="t('visits.visitor')">
          <button
            type="button"
            class="cursor-pointer justify-self-start text-left font-medium hover:underline"
            @click="emit('details', visit)"
          >
            {{ fullName(visit) }}
          </button>
        </NeTableCell>
        <NeTableCell :data-label="t('visits.company')">{{ visit.company }}</NeTableCell>
        <NeTableCell :data-label="t('visits.host')">{{ visit.host ?? '-' }}</NeTableCell>
        <NeTableCell :data-label="t('visits.event')">{{ visit.eventName ?? '-' }}</NeTableCell>
        <NeTableCell :data-label="t('visits.check_in')">
          {{ mode === 'present' ? formatTime(visit.checkInAt) : formatDateTime(visit.checkInAt) }}
        </NeTableCell>
        <NeTableCell v-if="mode === 'register'" :data-label="t('visits.check_out_column')">
          <NeBadgeV2 v-if="!visit.checkOutAt" kind="green">{{ t('visits.in_office') }}</NeBadgeV2>
          <span v-else class="flex flex-wrap items-center gap-2">
            {{ formatDateTime(visit.checkOutAt) }}
            <NeBadgeV2 v-if="visit.checkOutBy === 'auto'" kind="gray" size="xs">{{ t('visits.auto_check_out') }}</NeBadgeV2>
          </span>
        </NeTableCell>
        <NeTableCell :data-label="t('common.actions')">
          <div class="-ml-2.5 flex gap-2 lg:ml-0 lg:justify-end">
            <NeButton v-if="mode === 'present'" kind="tertiary" @click="emit('checkOut', visit)">
              <template #prefix>
                <FontAwesomeIcon :icon="faDoorOpen" class="h-4 w-4" aria-hidden="true" />
              </template>
              {{ t('visits.check_out') }}
            </NeButton>
            <NeButton v-else kind="tertiary" :aria-label="`${t('visits.details')} ${fullName(visit)}`" @click="emit('details', visit)">
              <template #prefix>
                <FontAwesomeIcon :icon="faEye" class="h-4 w-4" aria-hidden="true" />
              </template>
              {{ t('visits.details') }}
            </NeButton>
            <NeDropdown :items="menuItems(visit)" align-to-right :open-menu-aria-label="t('common.open_menu')" />
          </div>
        </NeTableCell>
      </NeTableRow>
    </NeTableBody>
    <template #paginator>
      <slot name="paginator" />
    </template>
  </NeTable>
</template>
