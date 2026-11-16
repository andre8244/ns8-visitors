<script setup lang="ts">
import { NeButton, NeTextInput } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'

export type RegisterFilterValues = { q: string; from: string; to: string }

const filters = defineModel<RegisterFilterValues>({ required: true })
const emit = defineEmits<{ reset: [] }>()

const { t } = useI18n()

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
    <NeTextInput
      :model-value="filters.from"
      type="date"
      :label="t('register.from')"
      class="w-44"
      @update:model-value="update('from', $event)"
    />
    <NeTextInput
      :model-value="filters.to"
      type="date"
      :label="t('register.to')"
      class="w-44"
      @update:model-value="update('to', $event)"
    />
    <NeButton kind="tertiary" @click="emit('reset')">{{ t('common.reset_filters') }}</NeButton>
  </div>
</template>
