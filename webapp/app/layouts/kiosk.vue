<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { useIdle } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

// Back to the home page after a minute without touches: the next visitor
// must not find the data of the previous one
const IDLE_MS = 60_000

const { t } = useI18n()
const route = useRoute()

useHead({ title: () => t('app.title'), htmlAttrs: { lang: 'it' } })

const atHome = computed(() => route.path === '/kiosk' || route.path === '/kiosk/pair')
// The home page greets the visitor in the middle of the screen
const atStart = computed(() => route.path === '/kiosk')

const { idle, reset } = useIdle(IDLE_MS)
watch(idle, (isIdle) => {
  if (isIdle && !atHome.value) {
    navigateTo('/kiosk')
  }
  reset()
})
</script>

<template>
  <!-- The tablet has the color of the brand, in both themes, and no top bar:
  the home page greets the visitor, the other pages start with the way back -->
  <div class="bg-primary-600 text-primary-neutral min-h-screen">
    <main :class="['mx-auto max-w-3xl px-6 py-8', { 'flex min-h-screen flex-col justify-center': atStart }]">
      <!-- Custom markup: NeButton has no kind for a colored background -->
      <button
        v-if="!atHome"
        type="button"
        class="bg-elevation-0 text-primary-700 dark:text-primary-500 focus-visible:ring-offset-primary-600 mb-6 inline-flex items-center gap-2 rounded-md px-4 py-3 font-medium shadow-sm focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
        @click="navigateTo('/kiosk')"
      >
        <FontAwesomeIcon :icon="faArrowLeft" aria-hidden="true" />
        {{ t('kiosk.back_to_start') }}
      </button>
      <slot />
    </main>
  </div>
</template>
