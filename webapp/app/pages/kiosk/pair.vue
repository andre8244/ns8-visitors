<script setup lang="ts">
import { NeButton, NeCard, NeInlineNotification, NeTextInput } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'

definePageMeta({ layout: 'kiosk', middleware: 'kiosk' })

const { t } = useI18n()
const { fetch: fetchSession, user } = useUserSession()

// Pairing replaces the session of an administrator in this browser
const adminSession = computed(() => user.value?.kind === 'admin')

const code = shallowRef('')
const codeError = shallowRef('')
const pairing = shallowRef(false)
const error = shallowRef('')

async function pair() {
  error.value = ''
  const value = code.value.replace(/\s/g, '').toUpperCase()
  codeError.value = /^[A-Z0-9]{8}$/.test(value) ? '' : t('kiosk.enter_code')
  if (codeError.value) return
  pairing.value = true
  try {
    await $fetch('/api/kiosk/pair', { method: 'POST', body: { code: value } })
    await fetchSession()
    await navigateTo('/kiosk')
  } catch (err) {
    const status = errorStatus(err)
    if (status === 400) error.value = t('kiosk.invalid_code')
    else if (status === 429) error.value = t('kiosk.too_many_requests')
    else error.value = status ? t('kiosk.generic_error') : t('kiosk.network_error')
  } finally {
    pairing.value = false
  }
}
</script>

<template>
  <NeCard :title="t('kiosk.pair_title')" class="mx-auto max-w-md">
    <p class="mb-6">{{ t('kiosk.pair_description') }}</p>
    <NeInlineNotification
      v-if="adminSession"
      kind="warning"
      :title="t('kiosk.admin_session_title')"
      :description="t('kiosk.admin_session_description')"
      class="mb-6"
    />
    <form class="space-y-6" novalidate @submit.prevent="pair">
      <NeTextInput
        v-model="code"
        :label="t('kiosk.pairing_code')"
        :invalid-message="codeError"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
      />
      <NeInlineNotification v-if="error" kind="error" :title="t('kiosk.cannot_pair')" :description="error" />
      <NeButton type="submit" kind="primary" size="lg" :loading="pairing" :disabled="pairing">{{ t('kiosk.pair') }}</NeButton>
    </form>
  </NeCard>
</template>
