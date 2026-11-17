<script setup lang="ts">
import { NeButton, NeInlineNotification } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'
import type { NameSearchResult } from '~/components/kiosk/NameSearch.vue'

definePageMeta({ layout: 'kiosk', middleware: 'kiosk' })

const { t } = useI18n()
const { api, errorText } = useKiosk()
const { query, results, searched, error: searchError } = useNameSearch(() => '/api/kiosk/present')

const selected = shallowRef<NameSearchResult | null>(null)
const saving = shallowRef(false)
const error = shallowRef('')
const done = shallowRef(false)

async function checkOut() {
  saving.value = true
  error.value = ''
  try {
    await api(`/api/kiosk/visits/${selected.value!.id}/check-out`, { method: 'POST' })
    done.value = true
  } catch (err) {
    error.value = errorStatus(err) === 409 ? t('kiosk.already_checked_out') : errorText(err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <KioskDone
    v-if="done && selected"
    :title="t('kiosk.checked_out')"
    :description="t('kiosk.checked_out_description')"
  />
  <KioskPage v-else-if="selected" :title="t('kiosk.exit_title')">
    <div class="space-y-6">
      <p class="text-lg">{{ t('kiosk.confirm_check_out', { name: fullName(selected), company: selected.company }) }}</p>
      <NeInlineNotification v-if="error" kind="error" :title="t('kiosk.cannot_check_out')" :description="error" />
      <div class="flex flex-wrap justify-end gap-3">
        <NeButton kind="tertiary" size="lg" :disabled="saving" @click="selected = null">{{ t('common.cancel') }}</NeButton>
        <NeButton kind="primary" size="lg" :loading="saving" :disabled="saving" @click="checkOut">{{ t('kiosk.check_out') }}</NeButton>
      </div>
    </div>
  </KioskPage>
  <KioskPage v-else :title="t('kiosk.exit_title')">
    <NeInlineNotification v-if="searchError" kind="error" :title="t('kiosk.cannot_search')" :description="searchError" class="mb-6" />
    <NameSearch
      v-model="query"
      :label="t('kiosk.search_your_name')"
      :results="results"
      :searched="searched"
      :min-length="SEARCH_MIN_LENGTH"
      :action-label="t('kiosk.select')"
      @select="selected = $event"
    />
  </KioskPage>
</template>
