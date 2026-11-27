<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<!-- Title and description of an admin page, with the primary action on the right.
     The title has the size of the page titles of My Nethesis and NethSecurity,
     the H3 text style, but stays an h1: NeHeading ties the size to the tag -->
<template>
  <div class="mb-8">
    <h1 class="text-primary-neutral mb-7 text-2xl font-medium">{{ title }}</h1>
    <div class="grid gap-x-4 gap-y-2 sm:grid-cols-[1fr_auto] sm:items-center">
      <p v-if="description" class="text-tertiary-neutral max-w-2xl">{{ description }}</p>
      <div class="justify-self-start sm:justify-self-end"><slot name="actions" /></div>
    </div>
  </div>
</template>
