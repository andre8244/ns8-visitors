<script setup lang="ts">
import { NeModal } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'
import type { PairingCode } from '~~/shared/types/admin'

// The code is shown only here: the server keeps just its hash
defineProps<{ pairing: PairingCode | null }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const pairUrl = computed(() => (import.meta.client ? `${window.location.origin}/kiosk/pair` : '/kiosk/pair'))
</script>

<template>
  <NeModal
    :visible="!!pairing"
    kind="info"
    :title="t('devices.pairing_code')"
    :primary-label="t('common.close')"
    :close-aria-label="t('common.close')"
    @primary-click="emit('close')"
    @close="emit('close')"
  >
    <template v-if="pairing">
      <p class="mb-4">{{ t('devices.pairing_instructions', { name: pairing.name, url: pairUrl }) }}</p>
      <p class="bg-elevation-1 mb-4 rounded-md py-4 text-center font-mono text-3xl font-medium tracking-widest" aria-live="polite">
        {{ pairing.code }}
      </p>
      <p class="text-tertiary-neutral text-sm">{{ t('devices.pairing_expires', { time: formatTime(pairing.expiresAt) }) }}</p>
    </template>
  </NeModal>
</template>
