<script setup lang="ts">
import { NeHeading } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'

defineProps<{ markdown: string }>()
const { t } = useI18n()
</script>

<template>
  <section class="bg-elevation-0 rounded-md p-6 shadow-sm">
    <NeHeading tag="h2" class="mb-4">{{ t('kiosk.privacy_notice') }}</NeHeading>
    <!-- Scrollable, so the form stays close; tabindex lets the keyboard scroll it -->
    <div class="max-h-80 overflow-y-auto pr-2" tabindex="0" :aria-label="t('kiosk.privacy_notice')">
      <NoticeText :markdown="markdown" />
    </div>
  </section>
</template>
