<script setup lang="ts">
import { NeHeading } from '@nethesis/vue-components'

defineProps<{ title: string; description?: string }>()
</script>

<!-- Title and description of an admin page, with the primary action on the right -->
<template>
  <div class="mb-8">
    <NeHeading tag="h1" class="mb-4">{{ title }}</NeHeading>
    <div class="grid gap-x-4 gap-y-2 sm:grid-cols-[1fr_auto] sm:items-center">
      <p v-if="description" class="text-tertiary-neutral max-w-2xl">{{ description }}</p>
      <div class="justify-self-start sm:justify-self-end"><slot name="actions" /></div>
    </div>
  </div>
</template>
