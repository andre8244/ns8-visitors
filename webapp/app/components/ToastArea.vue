<script setup lang="ts">
import { NeToastNotificationV2 } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { toasts, remove } = useToasts()
</script>

<!-- Toast notifications at the top right, under the top bar, as in My Nethesis -->
<template>
  <Teleport to="body">
    <div aria-live="assertive" class="pointer-events-none fixed inset-0 z-120 flex items-start px-8 pt-24 pb-6 text-sm">
      <div class="flex w-full flex-col items-end space-y-4">
        <TransitionGroup name="fade">
          <NeToastNotificationV2
            v-for="toast in toasts"
            :key="toast.id"
            :notification="toast"
            :sr-close-label="t('common.close')"
            show-close-button
            class="pointer-events-auto"
            @close="remove(toast.id)"
          />
        </TransitionGroup>
      </div>
    </div>
  </Teleport>
</template>
