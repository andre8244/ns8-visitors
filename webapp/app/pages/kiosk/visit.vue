<script setup lang="ts">
import { NeHeading } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'
import type { CheckInSubmit } from '~/components/kiosk/CheckInForm.vue'

definePageMeta({ layout: 'kiosk', middleware: 'kiosk' })

const { t } = useI18n()
const { config, api, loadConfig } = useKiosk()
const { saving, error, run } = useCheckIn()
const doneName = shallowRef('')

if (!config.value) {
  loadConfig().catch(() => {
    navigateTo('/kiosk')
  })
}

async function checkIn({ person, signature }: CheckInSubmit) {
  const ok = await run(() =>
    api('/api/kiosk/visits', {
      method: 'POST',
      body: { ...person, host: person.host.trim() || undefined, noticeVersionId: config.value!.notice!.id, signature }
    })
  )
  if (ok) doneName.value = fullName(person)
}
</script>

<template>
  <KioskDone
    v-if="doneName"
    :title="t('kiosk.checked_in')"
    :description="t('kiosk.checked_in_description', { name: doneName })"
  />
  <div v-else-if="config?.notice">
    <NeHeading tag="h1" class="mb-8">{{ t('kiosk.visit_title') }}</NeHeading>
    <CheckInForm mode="visitor" :notice="config.notice.bodyMd" :saving="saving" :error="error" @submit="checkIn" />
  </div>
</template>
