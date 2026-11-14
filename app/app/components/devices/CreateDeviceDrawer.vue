<script setup lang="ts">
import { NeButton, NeInlineNotification, NeSideDrawer, NeTextInput, focusElement } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'
import type { PairingCode } from '~~/shared/types/admin'

defineProps<{ isShown: boolean }>()
const emit = defineEmits<{ close: []; created: [code: PairingCode] }>()

const { t } = useI18n()
const { api, errorText } = useApi()

const name = shallowRef('')
const nameError = shallowRef('')
const saving = shallowRef(false)
const saveError = shallowRef('')
const nameRef = ref()

function onShow() {
  name.value = ''
  nameError.value = ''
  saveError.value = ''
  focusElement(nameRef)
}

async function create() {
  nameError.value = name.value.trim() ? '' : t('devices.enter_name')
  if (nameError.value) return
  saving.value = true
  saveError.value = ''
  try {
    emit('created', await api<PairingCode>('/api/admin/devices', { method: 'POST', body: { name: name.value.trim() } }))
  } catch (err) {
    saveError.value = errorText(err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <NeSideDrawer
    :is-shown="isShown"
    :title="t('devices.add_tablet')"
    :close-aria-label="t('common.close_drawer')"
    @show="onShow"
    @close="emit('close')"
  >
    <form novalidate @submit.prevent="create">
      <div class="space-y-6">
        <NeTextInput
          ref="nameRef"
          v-model="name"
          :label="t('devices.name')"
          :placeholder="t('devices.name_placeholder')"
          :helper-text="t('devices.name_helper')"
          :invalid-message="nameError"
          :disabled="saving"
        />
        <NeInlineNotification v-if="saveError" kind="error" :title="t('devices.cannot_add_tablet')" :description="saveError" />
      </div>
      <hr class="border-layout-divider my-8" />
      <div class="flex justify-end gap-3">
        <NeButton kind="tertiary" size="lg" :disabled="saving" @click="emit('close')">{{ t('common.cancel') }}</NeButton>
        <NeButton type="submit" kind="primary" size="lg" :disabled="saving" :loading="saving">{{ t('devices.add_tablet') }}</NeButton>
      </div>
    </form>
  </NeSideDrawer>
</template>
