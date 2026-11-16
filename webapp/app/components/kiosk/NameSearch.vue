<script setup lang="ts">
import { NeButton, NeTextInput } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'

export type NameSearchResult = { id: number; firstName: string; lastName: string; company: string }

// The results appear only after the first letters, and only a few: the
// tablet never shows a whole list of names
defineProps<{
  label: string
  results: NameSearchResult[]
  // A search for the current text has completed
  searched: boolean
  minLength: number
  actionLabel: string
}>()
const query = defineModel<string>({ required: true })
const emit = defineEmits<{ select: [result: NameSearchResult] }>()

const { t } = useI18n()
</script>

<template>
  <div class="space-y-6">
    <NeTextInput
      v-model="query"
      is-search
      :label="label"
      :helper-text="t('kiosk.search_helper', { count: minLength })"
      :clear-search-label="t('common.clear_search')"
      autocomplete="off"
    />
    <ul v-if="results.length" class="space-y-3" aria-live="polite">
      <li
        v-for="result in results"
        :key="result.id"
        class="bg-elevation-0 flex flex-wrap items-center justify-between gap-4 rounded-md p-4 shadow-sm"
      >
        <div>
          <p class="font-medium">{{ fullName(result) }}</p>
          <p class="text-tertiary-neutral text-sm">{{ result.company }}</p>
        </div>
        <NeButton kind="secondary" size="lg" :aria-label="`${actionLabel} ${fullName(result)}`" @click="emit('select', result)">
          {{ actionLabel }}
        </NeButton>
      </li>
    </ul>
    <p v-else-if="searched" class="text-tertiary-neutral" aria-live="polite">
      {{ t('kiosk.no_names_found') }}
    </p>
    <slot />
  </div>
</template>
