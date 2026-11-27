<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const route = useRoute()
const { loggedIn } = useUserSession()
// Applies the theme of this browser
useAdminTheme()
// Applies the view, standard or compact, of the signed-in admin
useAdminDensity()

useHead({ title: () => t('app.title'), htmlAttrs: { lang: locale } })

// The sign-in page has only the top bar
const withSidebar = computed(() => loggedIn.value && route.path.startsWith('/admin'))
const sidebarOpen = ref(false)
</script>

<!-- Application shell of My Nethesis: sidebar, top bar and page -->
<template>
  <div class="bg-elevation-1 text-primary-neutral min-h-screen">
    <template v-if="withSidebar">
      <MobileSidebar v-model:open="sidebarOpen" />
      <div class="border-layout-divider hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col lg:border-r">
        <SidebarPanel />
      </div>
    </template>

    <div :class="{ 'lg:pl-72': withSidebar }">
      <TopBar :with-sidebar="withSidebar" @open-sidebar="sidebarOpen = true" />
      <main class="px-4 py-10 sm:px-6 lg:px-8">
        <slot />
      </main>
    </div>
    <ToastArea />
  </div>
</template>
