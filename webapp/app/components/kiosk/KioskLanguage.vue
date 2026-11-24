<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// Only in development, to try both languages on the tablet pages: in
// production the interface follows the language of the browser
const { t, locale } = useI18n()

function choose(item: Locale) {
  localeOverride.value = item
}
</script>

<!-- Custom markup: a pair of buttons, the language on screen pressed. White
on the brand color, as the way back of the other pages -->
<template>
  <div role="group" :aria-label="t('kiosk.language')" class="bg-elevation-0 inline-flex gap-1 rounded-md p-1 shadow-sm">
    <button
      v-for="item in LOCALES"
      :key="item"
      type="button"
      :lang="item"
      :aria-pressed="locale === item"
      :class="[
        'focus-visible:ring-primary-600 focus-visible:ring-offset-elevation-0 rounded px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        locale === item ? 'bg-primary-600 text-white' : 'text-primary-700 dark:text-primary-500'
      ]"
      @click="choose(item)"
    >
      {{ LOCALE_NAMES[item] }}
    </button>
  </div>
</template>
