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

const { idle, reset } = useIdle(IDLE_MS)
watch(idle, (isIdle) => {
  if (isIdle && !atHome.value) {
    navigateTo('/kiosk')
  }
  reset()
})
</script>

<template>
  <div class="bg-elevation-1 text-primary-neutral min-h-screen">
    <header class="bg-elevation-0 border-layout-divider border-b">
      <div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
        <span class="text-lg font-medium">{{ t('app.title') }}</span>
        <NeButton v-if="!atHome" kind="tertiary" size="lg" @click="navigateTo('/kiosk')">
          <template #prefix>
            <FontAwesomeIcon :icon="faArrowLeft" aria-hidden="true" />
          </template>
          {{ t('kiosk.back_to_start') }}
        </NeButton>
      </div>
    </header>
    <main class="mx-auto max-w-3xl px-6 py-8">
      <slot />
    </main>
  </div>
</template>
