<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'

defineProps<{
  // With the sidebar: the button that opens it on small screens, and the
  // account menu
  withSidebar: boolean
}>()
const emit = defineEmits<{ openSidebar: [] }>()

const { t } = useI18n()
</script>

<!-- Top bar of My Nethesis -->
<template>
  <div
    class="border-layout-divider bg-elevation-0 sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b px-4 sm:gap-x-6 sm:px-6 lg:px-8"
  >
    <template v-if="withSidebar">
      <button
        type="button"
        class="text-tertiary-neutral focus-visible:ring-primary-500 -mx-2.5 rounded-full p-2.5 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:outline-none lg:hidden dark:hover:bg-gray-800 dark:hover:text-gray-50"
        @click="emit('openSidebar')"
      >
        <span class="sr-only">{{ t('shell.open_sidebar') }}</span>
        <FontAwesomeIcon :icon="faBars" class="h-6 w-6 shrink-0" aria-hidden="true" />
      </button>
      <div class="bg-layout-divider h-6 w-px lg:hidden" aria-hidden="true" />
    </template>

    <!-- The sidebar shows the name of the application on wide screens -->
    <div class="flex flex-1 items-center">
      <span :class="['font-medium', { 'lg:hidden': withSidebar }]">{{ t('app.title') }}</span>
    </div>

    <div class="-mr-2.5 flex items-center gap-x-1">
      <AccountMenu v-if="withSidebar" />
      <ThemeToggle v-else />
    </div>
  </div>
</template>
