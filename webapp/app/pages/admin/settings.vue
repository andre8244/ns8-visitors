<script setup lang="ts">
import { NeButton, NeDatePicker, NeInlineNotification, NeRadioSelection, NeSkeleton, NeTextInput, NeToggle } from '@nethesis/vue-components'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'
import { useDatePickerLabels } from '~/composables/useDatePickerLabels'
import type { Settings } from '~~/shared/types/admin'

const { t, locale } = useI18n()
const { datePickerLabels } = useDatePickerLabels()
const { api, errorText } = useApi()
const { showSuccess } = useToasts()

const form = ref({ retentionMonths: '', autoCheckoutTime: '', kioskTheme: 'light', kioskMascot: true })
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
    kioskTheme: settings.kioskTheme,
    kioskMascot: settings.kioskMascot
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
      kioskTheme: form.value.kioskTheme,
      kioskMascot: form.value.kioskMascot
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
    <NeSkeleton v-else-if="loading" :lines="6" class="max-w-3xl" />
    <form v-else novalidate class="max-w-3xl space-y-8" @submit.prevent="save">
      <FormLayout :title="t('settings.data_retention')">
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
      </FormLayout>
      <hr class="border-layout-divider" />
      <FormLayout :title="t('settings.automatic_check_out')">
        <NeDatePicker
          :model-value="form.autoCheckoutTime"
          type="time"
          :clearable="false"
          :label="t('settings.auto_check_out')"
          :helper-text="t('settings.auto_check_out_helper')"
          :locale="locale"
          v-bind="datePickerLabels"
          :invalid-message="errors.autoCheckoutTime"
          :disabled="saving"
          @update:model-value="form.autoCheckoutTime = ($event as string | null) ?? ''"
        />
      </FormLayout>
      <hr class="border-layout-divider" />
      <FormLayout :title="t('settings.tablet')">
        <div class="space-y-6">
          <NeRadioSelection
            v-if="KIOSK_THEME_SELECTABLE"
            v-model="form.kioskTheme"
            :label="t('settings.kiosk_theme')"
            :options="themeOptions"
            card
            grid-style="grid-cols-2 gap-3"
            :disabled="saving"
          />
          <!-- NeToggle has no helper text -->
          <div>
            <NeToggle v-model="form.kioskMascot" :label="t('settings.kiosk_mascot')" :disabled="saving" />
            <p class="text-tertiary-neutral mt-2 text-sm">{{ t('settings.kiosk_mascot_helper') }}</p>
          </div>
        </div>
      </FormLayout>
      <hr class="border-layout-divider" />
      <!-- the Save button saves the whole page, aligned with the fields -->
      <FormLayout>
        <NeInlineNotification v-if="saveError" kind="error" :title="t('settings.cannot_save')" :description="saveError" class="mb-6" />
        <NeButton type="submit" kind="primary" size="lg" :disabled="saving" :loading="saving">{{ t('common.save') }}</NeButton>
      </FormLayout>
    </form>
  </div>
</template>
