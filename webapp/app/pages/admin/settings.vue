<script setup lang="ts">
import { NeButton, NeCard, NeInlineNotification, NeRadioSelection, NeSkeleton, NeTextInput } from '@nethesis/vue-components'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'
import type { Settings } from '~~/shared/types/admin'

const { t } = useI18n()
const { api, errorText } = useApi()
const { showSuccess } = useToasts()

const form = ref({ retentionMonths: '', autoCheckoutTime: '', kioskTheme: 'light' })
const errors = ref({ retentionMonths: '', autoCheckoutTime: '' })
const loading = shallowRef(true)
const loadError = shallowRef('')
const saving = shallowRef(false)
const saveError = shallowRef('')

const themeOptions = computed(() => [
  { id: 'light', label: t('settings.theme_light'), icon: faSun },
  { id: 'dark', label: t('settings.theme_dark'), icon: faMoon }
])

function fill(settings: Settings) {
  form.value = {
    retentionMonths: String(settings.retentionMonths),
    autoCheckoutTime: settings.autoCheckoutTime,
    kioskTheme: settings.kioskTheme
  }
}

async function load() {
  try {
    fill(await api<Settings>('/api/admin/settings'))
  } catch (err) {
    loadError.value = errorText(err)
  } finally {
    loading.value = false
  }
}
load()

function validate() {
  const months = Number(form.value.retentionMonths)
  errors.value = {
    retentionMonths: Number.isInteger(months) && months >= 1 && months <= 120 ? '' : t('settings.enter_retention'),
    autoCheckoutTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(form.value.autoCheckoutTime) ? '' : t('settings.enter_time')
  }
  return !Object.values(errors.value).some(Boolean)
}

async function save() {
  if (!validate()) return
  saving.value = true
  saveError.value = ''
  try {
    const body = {
      retentionMonths: Number(form.value.retentionMonths),
      autoCheckoutTime: form.value.autoCheckoutTime,
      kioskTheme: form.value.kioskTheme
    }
    fill(await api<Settings>('/api/admin/settings', { method: 'PATCH', body }))
    showSuccess(t('settings.saved'), t('settings.saved_description'))
  } catch (err) {
    saveError.value = errorText(err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader :title="t('settings.title')" :description="t('settings.description')" />
    <NeInlineNotification v-if="loadError" kind="error" :title="t('settings.cannot_load')" :description="loadError" />
    <NeSkeleton v-else-if="loading" :lines="6" class="max-w-xl" />
    <NeCard v-else class="max-w-xl">
      <form novalidate @submit.prevent="save">
        <div class="space-y-6">
          <NeTextInput
            v-model="form.retentionMonths"
            type="number"
            min="1"
            max="120"
            :label="t('settings.retention')"
            :helper-text="t('settings.retention_helper')"
            :invalid-message="errors.retentionMonths"
            :disabled="saving"
          />
          <NeTextInput
            v-model="form.autoCheckoutTime"
            type="time"
            :label="t('settings.auto_check_out')"
            :helper-text="t('settings.auto_check_out_helper')"
            :invalid-message="errors.autoCheckoutTime"
            :disabled="saving"
          />
          <NeRadioSelection
            v-model="form.kioskTheme"
            :label="t('settings.kiosk_theme')"
            :options="themeOptions"
            card
            grid-style="grid-cols-2 gap-3"
            :disabled="saving"
          />
          <NeInlineNotification v-if="saveError" kind="error" :title="t('settings.cannot_save')" :description="saveError" />
        </div>
        <div class="mt-8 flex justify-end">
          <NeButton type="submit" kind="primary" size="lg" :disabled="saving" :loading="saving">{{ t('common.save') }}</NeButton>
        </div>
      </form>
    </NeCard>
  </div>
</template>
