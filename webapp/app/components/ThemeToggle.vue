<script setup lang="ts">
import { NeTooltip } from '@nethesis/vue-components'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { isDark, toggleTheme } = useAdminTheme()

const label = computed(() => (isDark.value ? t('theme.switch_to_light') : t('theme.switch_to_dark')))
</script>

<!-- Theme switch of the top bar before signing in; then it is in the account menu -->
<template>
  <NeTooltip trigger-event="mouseenter focus" placement="bottom" class="flex">
    <template #trigger>
      <button
        type="button"
        :class="[topBarButtonClasses, 'focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none']"
        @click="toggleTheme()"
      >
        <span class="sr-only">{{ label }}</span>
        <FontAwesomeIcon :icon="isDark ? faSun : faMoon" class="h-6 w-6 shrink-0" aria-hidden="true" />
      </button>
    </template>
    <template #content>{{ label }}</template>
  </NeTooltip>
</template>
