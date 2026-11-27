<script setup lang="ts">
defineProps<{ title?: string; description?: string }>()
</script>

<!-- A section of a form that is the page itself, as FormLayout of My Nethesis:
     title and description on the left, the fields on the right; below md,
     the title above the fields. Without a title, it aligns its content with
     the fields of the other sections, as the Save button -->
<template>
  <div class="flex flex-col md:flex-row">
    <div class="sm:mr-6 md:w-5/12">
      <h2 v-if="title" class="mb-2 text-lg font-medium">{{ title }}</h2>
      <p v-if="description" class="text-tertiary-neutral mb-8 text-sm">{{ description }}</p>
    </div>
    <div class="md:w-7/12">
      <slot />
    </div>
  </div>
</template>
