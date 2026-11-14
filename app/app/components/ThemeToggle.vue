<script setup lang="ts">
import { NeButton, NeTooltip } from '@nethesis/vue-components'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { isDark, toggleTheme } = useAdminTheme()

const label = computed(() => (isDark.value ? t('theme.switch_to_light') : t('theme.switch_to_dark')))
</script>

<template>
  <NeTooltip trigger-event="mouseenter focus" placement="bottom">
    <template #trigger>
      <NeButton kind="tertiary" size="sm" :aria-label="label" @click="toggleTheme()">
        <FontAwesomeIcon :icon="isDark ? faSun : faMoon" class="h-4 w-4" aria-hidden="true" />
      </NeButton>
    </template>
    <template #content>{{ label }}</template>
  </NeTooltip>
</template>
