<script setup lang="ts">
import { NeButton } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { loggedIn, user, clear } = useUserSession()

useHead({ title: () => t('app.title'), htmlAttrs: { lang: 'it' } })

async function signOut() {
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <div class="bg-elevation-1 text-primary-neutral min-h-screen">
    <header class="border-layout-divider bg-elevation-0 border-b">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <NuxtLink to="/" class="font-medium">{{ t('app.title') }}</NuxtLink>
        <div class="flex items-center gap-3 text-sm">
          <ThemeToggle />
          <template v-if="loggedIn">
            <span>{{ user?.name }}</span>
            <NeButton kind="tertiary" size="sm" @click="signOut">{{ t('common.sign_out') }}</NeButton>
          </template>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>
