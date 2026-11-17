<script setup lang="ts">
import { NeInlineNotification, NeSkeleton } from '@nethesis/vue-components'
import { faCalendarCheck, faDoorOpen, faUserCheck } from '@fortawesome/free-solid-svg-icons'
import { useIntervalFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

definePageMeta({ layout: 'kiosk', middleware: 'kiosk' })

// Events of the day and the privacy notice change while the tablet is on
const RELOAD_MS = 5 * 60_000

const { t } = useI18n()
const { config, loadConfig, errorText } = useKiosk()
const error = shallowRef('')

async function load() {
  try {
    await loadConfig()
    error.value = ''
  } catch (err) {
    error.value = errorText(err)
  }
}
load()
useIntervalFn(load, RELOAD_MS)
</script>

<template>
  <div>
    <!-- Larger than the h1 of NeHeading: the greeting of the entrance -->
    <h1 class="motion-safe:animate-rise mt-4 mb-10 text-center text-4xl font-medium text-white sm:text-5xl dark:text-gray-950">{{ t('kiosk.welcome') }}</h1>
    <NeInlineNotification v-if="error" kind="error" :title="t('kiosk.cannot_load')" :description="error" class="mb-6" />
    <NeSkeleton v-if="!config && !error" :lines="6" />
    <template v-else-if="config">
      <NeInlineNotification
        v-if="!config.notice"
        kind="warning"
        :title="t('kiosk.not_available')"
        :description="t('kiosk.not_available_description')"
        class="mb-6"
      />
      <div class="rise-children space-y-4">
        <template v-if="config.notice">
          <KioskChoice to="/kiosk/visit" :icon="faUserCheck" :title="t('kiosk.visit_title')" :description="t('kiosk.visit_description')" />
          <KioskChoice
            v-if="config.events.length"
            to="/kiosk/event"
            :icon="faCalendarCheck"
            :title="t('kiosk.event_title')"
            :description="t('kiosk.event_description')"
          />
        </template>
        <KioskChoice to="/kiosk/exit" :icon="faDoorOpen" :title="t('kiosk.exit_title')" :description="t('kiosk.exit_description')" />
      </div>
    </template>
  </div>
</template>
