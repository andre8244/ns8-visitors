<script setup lang="ts">
import {
  NeBadgeV2,
  NeButton,
  NeTable,
  NeTableBody,
  NeTableCell,
  NeTableHead,
  NeTableHeadCell,
  NeTableRow
} from '@nethesis/vue-components'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCircleMinus } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'
import type { EventGuest } from '~~/shared/types/admin'

defineProps<{ guests: EventGuest[]; loading: boolean }>()
const emit = defineEmits<{ remove: [guest: EventGuest] }>()

const { t } = useI18n()
</script>

<template>
  <NeTable :aria-label="t('guests.title')" :loading="loading" card-breakpoint="md">
    <NeTableHead>
      <NeTableHeadCell>{{ t('guests.name') }}</NeTableHeadCell>
      <NeTableHeadCell>{{ t('visits.company') }}</NeTableHeadCell>
      <NeTableHeadCell>{{ t('guests.status') }}</NeTableHeadCell>
      <NeTableHeadCell>
        <!-- no header for actions -->
      </NeTableHeadCell>
    </NeTableHead>
    <NeTableBody>
      <NeTableRow v-for="guest in guests" :key="guest.id">
        <NeTableCell :data-label="t('guests.name')">{{ fullName(guest) }}</NeTableCell>
        <NeTableCell :data-label="t('visits.company')">{{ guest.company }}</NeTableCell>
        <NeTableCell :data-label="t('guests.status')">
          <span class="flex flex-wrap items-center gap-2">
            <NeBadgeV2 v-if="guest.signedAt" kind="green">
              {{ t('guests.signed_on', { date: formatDateTime(guest.signedAt) }) }}
            </NeBadgeV2>
            <NeBadgeV2 v-else kind="gray">{{ t('guests.expected') }}</NeBadgeV2>
            <NeBadgeV2 v-if="guest.addedOnSite" kind="indigo">{{ t('guests.added_on_site') }}</NeBadgeV2>
          </span>
        </NeTableCell>
        <NeTableCell :data-label="t('common.actions')">
          <div class="-ml-2.5 flex gap-2 md:ml-0 md:justify-end">
            <NeButton kind="tertiary" :aria-label="`${t('common.remove')} ${fullName(guest)}`" @click="emit('remove', guest)">
              <template #prefix>
                <FontAwesomeIcon :icon="faCircleMinus" class="h-4 w-4" aria-hidden="true" />
              </template>
              {{ t('common.remove') }}
            </NeButton>
          </div>
        </NeTableCell>
      </NeTableRow>
    </NeTableBody>
    <template #paginator>
      <slot name="paginator" />
    </template>
  </NeTable>
</template>
