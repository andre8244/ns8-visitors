<script setup lang="ts">
import { NeCard } from '@nethesis/vue-components'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { useI18n } from 'vue-i18n'

// A counter of the dashboard, as CounterCard of My Nethesis: the number
// links to the page that lists what it counts
const props = defineProps<{ title: string; counter: number | null; icon: IconDefinition; to: string; loading: boolean }>()

const { locale } = useI18n()
const formatted = computed(() => (props.counter === null ? '' : new Intl.NumberFormat(locale.value).format(props.counter)))
</script>

<template>
  <!-- the icon in the title slot: the icon prop of NeCard takes a registered icon name -->
  <NeCard :loading="loading" :skeleton-lines="1">
    <template #title>
      <!-- as CounterCard of My Nethesis, in sentence case: no capitals -->
      <span class="text-secondary-neutral flex items-start gap-3 text-base">
        <FontAwesomeIcon :icon="icon" class="text-secondary-neutral size-5 shrink-0" aria-hidden="true" />
        {{ title }}
      </span>
    </template>
    <template #topRight>
      <NuxtLink
        v-if="!loading && counter !== null"
        :to="to"
        :aria-label="`${title}: ${formatted}`"
        class="text-secondary focus-visible:ring-primary-500 rounded-md px-1 text-4xl font-medium focus-visible:ring-2 focus-visible:outline-none"
      >
        {{ formatted }}
      </NuxtLink>
    </template>
  </NeCard>
</template>
