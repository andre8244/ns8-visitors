<script setup lang="ts">
import { NeButton, NeEmptyState, NeInlineNotification, NePaginator } from '@nethesis/vue-components'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCirclePlus, faTabletScreenButton } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'
import type { Device, PairingCode } from '~~/shared/types/admin'

const { t } = useI18n()
const { api, errorText } = useApi()
const { showSuccess } = useToasts()

const devices = shallowRef<Device[]>([])
const loading = shallowRef(true)
const error = shallowRef('')
const actionError = shallowRef('')

async function reload() {
  try {
    devices.value = await api<Device[]>('/api/admin/devices')
    error.value = ''
  } catch (err) {
    error.value = errorText(err)
  } finally {
    loading.value = false
  }
}
reload()

const page = shallowRef(1)
const { pageSize, setPageSize } = useTablePageSize('devices')
const pageDevices = computed(() => devices.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

const createShown = shallowRef(false)
const pairing = shallowRef<PairingCode | null>(null)
const revokeDevice = shallowRef<Device | null>(null)

function onCreated(code: PairingCode) {
  createShown.value = false
  // Wait for the drawer to close before opening the modal
  setTimeout(() => (pairing.value = code), 500)
  reload()
}

async function newCode(device: Device) {
  actionError.value = ''
  try {
    pairing.value = await api<PairingCode>(`/api/admin/devices/${device.id}/pairing-code`, { method: 'POST' })
  } catch (err) {
    actionError.value = errorText(err)
  }
  reload()
}

async function revoke() {
  await api(`/api/admin/devices/${revokeDevice.value!.id}/revoke`, { method: 'POST' })
}

function onRevoked() {
  const name = revokeDevice.value?.name ?? ''
  revokeDevice.value = null
  showSuccess(t('devices.revoked'), t('devices.revoked_description', { name }), { afterDialog: true })
  reload()
}
</script>

<template>
  <div>
    <PageHeader :title="t('devices.title')" :description="t('devices.description')">
      <template v-if="devices.length" #actions>
        <NeButton kind="primary" size="lg" @click="createShown = true">
          <template #prefix>
            <FontAwesomeIcon :icon="faCirclePlus" aria-hidden="true" />
          </template>
          {{ t('devices.add_tablet') }}
        </NeButton>
      </template>
    </PageHeader>
    <NeInlineNotification
      v-if="error || actionError"
      kind="error"
      :title="error ? t('devices.cannot_load') : t('devices.cannot_create_code')"
      :description="error || actionError"
      class="mb-6"
    />
    <NeEmptyState
      v-if="!loading && !error && !devices.length"
      :icon="faTabletScreenButton"
      :title="t('devices.no_tablets')"
      :description="t('devices.no_tablets_description')"
      class="bg-white dark:bg-gray-950"
    >
      <NeButton kind="primary" size="lg" @click="createShown = true">
        <template #prefix>
          <FontAwesomeIcon :icon="faCirclePlus" aria-hidden="true" />
        </template>
        {{ t('devices.add_tablet') }}
      </NeButton>
    </NeEmptyState>
    <DevicesTable v-else-if="!error" :devices="pageDevices" :loading="loading" @new-code="newCode" @revoke="revokeDevice = $event">
      <template #paginator>
        <NePaginator
          :current-page="page"
          :total-rows="devices.length"
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
    </DevicesTable>
    <CreateDeviceDrawer :is-shown="createShown" @close="createShown = false" @created="onCreated" />
    <PairingCodeModal :pairing="pairing" @close="pairing = null" />
    <ConfirmDeleteModal
      :visible="!!revokeDevice"
      :title="t('devices.revoke_tablet')"
      :description="t('devices.revoke_description', { name: revokeDevice?.name ?? '' })"
      :error-title="t('devices.cannot_revoke')"
      :confirm-label="t('devices.revoke')"
      :action="revoke"
      @close="revokeDevice = null"
      @done="onRevoked"
    />
  </div>
</template>
