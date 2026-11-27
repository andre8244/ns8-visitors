<script setup lang="ts">
import { NeButton, NeDateRangeFilter, NeDropdownFilterV2, type NeDropdownFilterV2Option } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'
import { useDatePickerLabels, useDateRangePresets } from '~/composables/useDatePickerLabels'

export type AuditFilterValues = { actor: string[]; action: string[]; via: string[]; from: string; to: string }

const props = defineProps<{ actors: string[] }>()
const filters = defineModel<AuditFilterValues>({ required: true })
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

const actorOptions = computed<NeDropdownFilterV2Option[]>(() =>
  props.actors.map((actor) => ({ id: actor, label: auditActorLabel(actor, t) }))
)
const actionOptions = computed<NeDropdownFilterV2Option[]>(() =>
  AUDIT_ACTIONS.map((action) => ({ id: action, label: auditActionLabel(action, t) })).sort((a, b) =>
    a.label.localeCompare(b.label)
  )
)
const sourceOptions = computed<NeDropdownFilterV2Option[]>(() => AUDIT_SOURCES.map((via) => ({ id: via, label: t(`audit.sources.${via}`) })))

// The dropdown filters hold the selected options, the filters only their ids
function selected(options: NeDropdownFilterV2Option[], ids: string[]) {
  return options.filter((option) => ids.includes(option.id))
}

function update(key: keyof AuditFilterValues, value: string | NeDropdownFilterV2Option[]) {
  filters.value = { ...filters.value, [key]: Array.isArray(value) ? value.map((option) => option.id) : value }
}

// The texts shared by the dropdown filters
const dropdownTexts = computed(() => ({
  kind: 'checkbox' as const,
  clearFilterLabel: t('audit.clear_selection'),
  openMenuAriaLabel: t('audit.open_filter'),
  noOptionsLabel: t('audit.no_options'),
  moreOptionsHiddenLabel: t('audit.more_options_hidden'),
  clearSearchLabel: t('common.clear_search'),
  optionsFilterPlaceholder: t('audit.filter_options')
}))
</script>

<template>
  <div class="flex flex-wrap items-end gap-4">
    <!-- in the order of the columns of the table -->
    <NeDateRangeFilter
      :model-value="dateRange"
      :label="t('audit.date')"
      :max="today"
      :presets="presets"
      :locale="locale"
      :clear-filter-label="t('audit.clear_selection')"
      v-bind="calendarLabels"
      @update:model-value="updateRange"
    />
    <NeDropdownFilterV2
      v-bind="dropdownTexts"
      :label="t('audit.user')"
      :options="actorOptions"
      :model-value="selected(actorOptions, filters.actor)"
      show-options-filter
      @update:model-value="update('actor', $event)"
    />
    <NeDropdownFilterV2
      v-bind="dropdownTexts"
      :label="t('audit.source')"
      :options="sourceOptions"
      :model-value="selected(sourceOptions, filters.via)"
      @update:model-value="update('via', $event)"
    />
    <NeDropdownFilterV2
      v-bind="dropdownTexts"
      :label="t('audit.action')"
      :options="actionOptions"
      :model-value="selected(actionOptions, filters.action)"
      show-options-filter
      @update:model-value="update('action', $event)"
    />
    <NeButton kind="tertiary" @click="emit('reset')">{{ t('common.reset_filters') }}</NeButton>
  </div>
</template>
