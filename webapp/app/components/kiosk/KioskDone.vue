<script setup lang="ts">
import { NeButton, NeHeading, NeRoundedIcon } from '@nethesis/vue-components'
import { useTimeoutFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

// Confirmation after a check-in or a check-out, then back to the home page
const RETURN_MS = 6000

const props = defineProps<{ title: string; description: string; checkOut?: boolean }>()
const { t } = useI18n()

useMascot(() => ({
  mood: props.checkOut ? 'bye' : 'happy',
  message: props.checkOut ? t('kiosk.mascot.checked_out') : t('kiosk.mascot.checked_in'),
  help: t('kiosk.mascot.help.done')
}))

function goHome() {
  navigateTo('/kiosk')
}
useTimeoutFn(goHome, RETURN_MS)
</script>

<template>
  <div class="motion-safe:animate-rise bg-elevation-0 flex flex-col items-center rounded-md px-6 py-12 text-center shadow-sm" role="status">
    <NeRoundedIcon kind="success" class="mb-6" />
    <NeHeading tag="h1" class="mb-4">{{ title }}</NeHeading>
    <p class="mb-8 max-w-lg text-lg">{{ description }}</p>
    <NeButton kind="primary" size="lg" @click="goHome">{{ t('kiosk.back_to_start') }}</NeButton>
  </div>
</template>
