<script setup lang="ts">
// A tablet page: the title on the primary background, the content in a card.
// They fade in rising slightly, as the home page
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div>
    <!-- White on primary-600 is 4.1:1: enough for large text only -->
    <h1 class="motion-safe:animate-rise text-4xl font-medium text-white">{{ title }}</h1>
    <p v-if="subtitle" class="motion-safe:animate-rise rise-delay-1 mt-2 text-2xl text-white">{{ subtitle }}</p>
    <div class="motion-safe:animate-rise rise-delay-2 bg-elevation-0 mt-8 rounded-md p-6 shadow-sm sm:p-8">
      <slot />
    </div>
  </div>
</template>
