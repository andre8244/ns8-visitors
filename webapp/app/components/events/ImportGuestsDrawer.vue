<script setup lang="ts">
import { NeButton, NeFileInput, NeInlineNotification, NeLink, NeSideDrawer } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'
import type { EventGuest } from '~~/shared/types/admin'
import type { CsvGuest, CsvGuestError } from '~~/shared/utils/csv'

const MAX_FILE_BYTES = 1024 * 1024

// Choose a CSV file, check the preview, then import the valid rows
const props = defineProps<{ isShown: boolean; eventId: number; existingGuests: EventGuest[] }>()
const emit = defineEmits<{ close: []; imported: [count: number] }>()

const { t } = useI18n()
const { api, errorText } = useApi()

const file = shallowRef<File | null>(null)
const fileError = shallowRef('')
const guests = shallowRef<CsvGuest[]>([])
const rowErrors = shallowRef<CsvGuestError[]>([])
const duplicates = shallowRef(0)
const importing = shallowRef(false)
const importError = shallowRef('')

const templateUrl = computed(() => {
  const csv = toCsv([
    [t('visits.first_name'), t('visits.last_name'), t('visits.company')],
    ['Mario', 'Rossi', 'Acme']
  ])
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
})

function reset() {
  file.value = null
  fileError.value = ''
  guests.value = []
  rowErrors.value = []
  duplicates.value = 0
  importError.value = ''
}

const keyOf = (guest: CsvGuest) => `${normalizeName(`${guest.firstName} ${guest.lastName}`)}|${normalizeName(guest.company)}`

async function onSelect(selected: File | null) {
  reset()
  file.value = selected
  if (!selected) return
  if (selected.size > MAX_FILE_BYTES) {
    fileError.value = t('import.file_too_big')
    return
  }
  const parsed = parseGuestsCsv(decodeCsvBytes(await selected.arrayBuffer()))
  if (!parsed) {
    fileError.value = t('import.missing_columns')
    return
  }
  // Skip the guests already in the list, and the repeated rows of the file
  const seen = new Set(props.existingGuests.map(keyOf))
  const unique: CsvGuest[] = []
  for (const guest of parsed.guests) {
    const key = keyOf(guest)
    if (seen.has(key)) {
      duplicates.value++
    } else {
      seen.add(key)
      unique.push(guest)
    }
  }
  guests.value = unique
  rowErrors.value = parsed.errors
  if (!unique.length && !parsed.errors.length && !duplicates.value) {
    fileError.value = t('import.no_rows')
  }
}

const errorLines = computed(() =>
  rowErrors.value.map((error) => t(`import.error_${error.reason}`, { line: error.line })).slice(0, 10)
)

async function importGuests() {
  importing.value = true
  importError.value = ''
  try {
    await api(`/api/admin/events/${props.eventId}/guests`, { method: 'POST', body: { guests: guests.value } })
    emit('imported', guests.value.length)
  } catch (err) {
    importError.value = errorText(err)
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <NeSideDrawer
    :is-shown="isShown"
    :title="t('import.title')"
    :close-aria-label="t('common.close_drawer')"
    @show="reset"
    @close="emit('close')"
  >
    <div class="space-y-6">
      <p>{{ t('import.description') }}</p>
      <p>
        <NeLink :href="templateUrl" :download="`${t('import.template_file_name')}.csv`">{{ t('import.download_template') }}</NeLink>
      </p>
      <NeFileInput
        :model-value="file"
        :label="t('import.file')"
        :helper-text="t('import.file_helper')"
        :dropzone-label="t('import.dropzone')"
        :invalid-message="fileError"
        accept=".csv,text/csv"
        @select="onSelect"
      />
      <div v-if="file && !fileError" class="space-y-4">
        <p class="font-medium">{{ t('import.ready', { count: guests.length }, guests.length) }}</p>
        <p v-if="duplicates">{{ t('import.duplicates', { count: duplicates }, duplicates) }}</p>
        <NeInlineNotification
          v-if="rowErrors.length"
          kind="warning"
          :title="t('import.rows_skipped', { count: rowErrors.length }, rowErrors.length)"
          :description="errorLines.join(' ')"
        />
      </div>
      <NeInlineNotification v-if="importError" kind="error" :title="t('import.cannot_import')" :description="importError" />
    </div>
    <hr class="border-layout-divider my-8" />
    <div class="flex justify-end gap-3">
      <NeButton kind="tertiary" size="lg" :disabled="importing" @click="emit('close')">{{ t('common.cancel') }}</NeButton>
      <NeButton
        kind="primary"
        size="lg"
        :disabled="importing || !guests.length"
        :loading="importing"
        @click="importGuests"
      >
        {{ t('import.import_guests') }}
      </NeButton>
    </div>
  </NeSideDrawer>
</template>
