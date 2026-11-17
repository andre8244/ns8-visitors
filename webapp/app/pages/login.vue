<script setup lang="ts">
import { NeButton, NeCard, NeInlineNotification, NeTextInput } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { fetch: fetchSession, user } = useUserSession()

// The session of this browser, when it is a paired tablet: signing in
// replaces it
fetchSession()
const pairedTablet = computed(() => user.value?.kind === 'kiosk')

const username = ref('')
const password = ref('')
const usernameError = ref('')
const passwordError = ref('')
const loading = ref(false)
const error = ref('')

function validate() {
  usernameError.value = username.value.trim() ? '' : t('login.enter_username')
  passwordError.value = password.value ? '' : t('login.enter_password')
  return !usernameError.value && !passwordError.value
}

async function signIn() {
  error.value = ''
  if (!validate()) {
    return
  }
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username: username.value.trim(), password: password.value }
    })
    await fetchSession()
    await navigateTo('/admin')
  } catch (err: any) {
    const status: number | undefined = err?.statusCode
    if (status === 429) {
      const seconds = Number(err.response?.headers.get('retry-after')) || 60
      const minutes = Math.ceil(seconds / 60)
      error.value = t('login.too_many_attempts', minutes)
      return
    }
    const messages: Record<number, string> = {
      400: t('login.wrong_credentials'),
      401: t('login.wrong_credentials'),
      403: t('login.not_admin'),
      503: t('login.ldap_unavailable')
    }
    error.value = status ? (messages[status] ?? t('login.generic_error')) : t('login.network_error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-sm">
    <NeCard :title="t('login.title')">
      <NeInlineNotification
        v-if="pairedTablet"
        kind="warning"
        :title="t('login.paired_tablet_title')"
        :description="t('login.paired_tablet_description')"
        class="mb-6"
      />
      <form class="space-y-4" novalidate @submit.prevent="signIn">
        <NeTextInput
          v-model="username"
          :label="t('login.username')"
          :invalid-message="usernameError"
          autocomplete="username"
        />
        <NeTextInput
          v-model="password"
          :label="t('login.password')"
          :invalid-message="passwordError"
          :show-password-label="t('common.show_password')"
          :hide-password-label="t('common.hide_password')"
          is-password
          autocomplete="current-password"
        />
        <NeInlineNotification
          v-if="error"
          kind="error"
          :title="t('login.cannot_sign_in')"
          :description="error"
        />
        <NeButton kind="primary" type="submit" :loading="loading" :disabled="loading">
          {{ t('login.sign_in') }}
        </NeButton>
      </form>
    </NeCard>
  </div>
</template>
