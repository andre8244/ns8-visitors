<script setup lang="ts">
import { NeButton } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const { loggedIn, user, clear } = useUserSession()
// Applies the theme of this browser
useAdminTheme()

useHead({ title: () => t('app.title'), htmlAttrs: { lang: 'it' } })

const showNav = computed(() => loggedIn.value && route.path.startsWith('/admin'))

async function signOut() {
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <div class="bg-elevation-1 text-primary-neutral min-h-screen">
    <header class="bg-elevation-0">
      <div class="border-layout-divider border-b">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <NuxtLink to="/" class="font-medium">{{ t('app.title') }}</NuxtLink>
          <div class="flex items-center gap-3 text-sm">
            <ThemeToggle />
            <template v-if="loggedIn">
              <span class="hidden sm:inline">{{ user?.name }}</span>
              <NeButton kind="tertiary" size="sm" @click="signOut">{{ t('common.sign_out') }}</NeButton>
            </template>
          </div>
        </div>
      </div>
      <AdminNav v-if="showNav" />
    </header>
    <main class="mx-auto max-w-6xl px-4 py-8">
      <slot />
    </main>
    <ToastArea />
  </div>
</template>
