<script setup lang="ts">
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineProps<{ to: string; icon: IconDefinition; title: string; description: string }>()
</script>

<!-- Custom markup: a large touch target for each choice of the home page -->
<template>
  <NuxtLink
    :to="to"
    class="bg-elevation-0 hover:ring-primary-500 focus-visible:ring-primary-500 flex items-center gap-6 rounded-md p-6 shadow-sm ring-1 ring-transparent focus-visible:ring-2 focus-visible:outline-none"
  >
    <FontAwesomeIcon :icon="icon" class="text-primary-700 dark:text-primary-500 h-10 w-10 shrink-0" aria-hidden="true" />
    <span>
      <span class="block text-xl font-medium">{{ title }}</span>
      <span class="text-tertiary-neutral mt-1 block">{{ description }}</span>
    </span>
  </NuxtLink>
</template>
