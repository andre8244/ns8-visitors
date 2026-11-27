<script setup lang="ts">
import { NeButton, NeDateRangeFilter, NeTextInput } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'
import { useDatePickerLabels, useDateRangePresets } from '~/composables/useDatePickerLabels'

export type RegisterFilterValues = { q: string; from: string; to: string }

const filters = defineModel<RegisterFilterValues>({ required: true })
const emit = defineEmits<{ reset: [] }>()

const { t, locale } = useI18n()
const { calendarLabels } = useDatePickerLabels()
const presets = useDateRangePresets()
const today = todayDate()

// The filter holds the range, the filters its first and last day
const dateRange = computed<[string, string] | null>(() => (filters.value.from && filters.value.to ? [filters.value.from, filters.value.to] : null))

function updateRange(range: [string, string] | null) {
  filters.value = { ...filters.value, from: range?.[0] ?? '', to: range?.[1] ?? '' }
}

function update(key: keyof RegisterFilterValues, value: string) {
  filters.value = { ...filters.value, [key]: value }
}
</script>

<template>
  <div class="flex flex-wrap items-end gap-4">
    <NeTextInput
      :model-value="filters.q"
      is-search
      :placeholder="t('register.filter_visits')"
      :aria-label="t('register.filter_visits')"
      :clear-search-label="t('common.clear_search')"
      class="max-w-48 sm:max-w-sm"
      @update:model-value="update('q', $event)"
    />
    <NeDateRangeFilter
      :model-value="dateRange"
      :label="t('visits.check_in')"
      :max="today"
      :presets="presets"
      :locale="locale"
      :clear-filter-label="t('register.clear_selection')"
      v-bind="calendarLabels"
      @update:model-value="updateRange"
    />
    <NeButton kind="tertiary" @click="emit('reset')">{{ t('common.reset_filters') }}</NeButton>
  </div>
</template>
