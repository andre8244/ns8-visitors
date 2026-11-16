<script setup lang="ts">
import { NeToastNotificationV2 } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { toasts, remove } = useToasts()
</script>

<template>
  <div class="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-3" aria-live="polite">
    <NeToastNotificationV2
      v-for="toast in toasts"
      :key="toast.id"
      :notification="toast"
      :sr-close-label="t('common.close')"
      show-close-button
      class="pointer-events-auto"
      @close="remove(toast.id)"
    />
  </div>
</template>
