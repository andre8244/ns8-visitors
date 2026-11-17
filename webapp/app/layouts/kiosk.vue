<script setup lang="ts">
import { NeButton } from '@nethesis/vue-components'
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
const atStart = computed(() => route.path === '/kiosk')
// The home page greets the visitor on the color of the brand, in the middle
// of the screen
const background = computed(() => (atStart.value ? 'bg-primary-600' : 'bg-elevation-1'))

const { idle, reset } = useIdle(IDLE_MS)
watch(idle, (isIdle) => {
  if (isIdle && !atHome.value) {
    navigateTo('/kiosk')
  }
  reset()
})
</script>

<template>
  <!-- No top bar: the home page greets the visitor, the other pages start
  with the way back -->
  <div :class="[background, 'text-primary-neutral min-h-screen']">
    <main :class="['mx-auto max-w-3xl px-6 py-8', { 'flex min-h-screen flex-col justify-center': atStart }]">
      <NeButton v-if="!atHome" kind="tertiary" size="lg" class="-ml-3 mb-6" @click="navigateTo('/kiosk')">
        <template #prefix>
          <FontAwesomeIcon :icon="faArrowLeft" aria-hidden="true" />
        </template>
        {{ t('kiosk.back_to_start') }}
      </NeButton>
      <slot />
    </main>
  </div>
</template>
