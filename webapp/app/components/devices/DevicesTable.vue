<script setup lang="ts">
import {
  NeBadgeV2,
  NeDropdown,
  NeTable,
  NeTableBody,
  NeTableCell,
  NeTableHead,
  NeTableHeadCell,
  NeTableRow,
  type NeBadgeV2Kind,
  type NeDropdownItem
} from '@nethesis/vue-components'
import { faArrowsRotate, faBan } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'
import type { Device, DeviceStatus } from '~~/shared/types/admin'

defineProps<{ devices: Device[]; loading: boolean }>()
const emit = defineEmits<{ newCode: [device: Device]; revoke: [device: Device] }>()

const { t } = useI18n()

const badgeKinds: Record<DeviceStatus, NeBadgeV2Kind> = {
  paired: 'green',
  waiting: 'amber',
  expired: 'gray',
  revoked: 'rose'
}

function menuItems(device: Device): NeDropdownItem[] {
  const items: NeDropdownItem[] = []
  if (device.status === 'waiting' || device.status === 'expired') {
    items.push({ id: 'code', label: t('devices.new_code'), icon: faArrowsRotate, action: () => emit('newCode', device) })
  }
  if (device.status !== 'revoked') {
    items.push({ id: 'revoke', label: t('devices.revoke'), icon: faBan, danger: true, action: () => emit('revoke', device) })
  }
  return items
}
</script>

<template>
  <NeTable :aria-label="t('devices.title')" :loading="loading" card-breakpoint="md">
    <NeTableHead>
      <NeTableHeadCell>{{ t('devices.name') }}</NeTableHeadCell>
      <NeTableHeadCell>{{ t('devices.status') }}</NeTableHeadCell>
      <NeTableHeadCell>{{ t('devices.last_seen') }}</NeTableHeadCell>
      <NeTableHeadCell>
        <!-- no header for actions -->
      </NeTableHeadCell>
    </NeTableHead>
    <NeTableBody>
      <NeTableRow v-for="device in devices" :key="device.id">
        <NeTableCell :data-label="t('devices.name')">{{ device.name }}</NeTableCell>
        <NeTableCell :data-label="t('devices.status')">
          <NeBadgeV2 :kind="badgeKinds[device.status]">{{ t(`devices.status_${device.status}`) }}</NeBadgeV2>
        </NeTableCell>
        <NeTableCell :data-label="t('devices.last_seen')">{{ formatDateTime(device.lastSeenAt) || '-' }}</NeTableCell>
        <NeTableCell :data-label="t('common.actions')">
          <div class="-ml-2.5 flex md:ml-0 md:justify-end">
            <NeDropdown
              v-if="menuItems(device).length"
              :items="menuItems(device)"
              align-to-right
              :open-menu-aria-label="t('common.open_menu')"
            />
          </div>
        </NeTableCell>
      </NeTableRow>
    </NeTableBody>
    <template #paginator>
      <slot name="paginator" />
    </template>
  </NeTable>
</template>
