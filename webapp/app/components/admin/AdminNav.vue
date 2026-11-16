<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const links = computed(() => [
  { to: '/admin', label: t('nav.present') },
  { to: '/admin/register', label: t('nav.register') },
  { to: '/admin/events', label: t('nav.events') },
  { to: '/admin/notice', label: t('nav.notice') },
  { to: '/admin/devices', label: t('nav.devices') },
  { to: '/admin/settings', label: t('nav.settings') }
])
</script>

<!-- Custom markup: the design system has no navigation menu component -->
<template>
  <nav :aria-label="t('nav.label')" class="border-layout-divider border-b">
    <ul class="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
      <li v-for="link in links" :key="link.to">
        <NuxtLink
          :to="link.to"
          :exact="link.to === '/admin'"
          class="text-tertiary-neutral hover:text-primary-neutral block border-b-2 border-transparent px-3 py-3 text-sm whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
          exact-active-class="!border-primary-700 dark:!border-primary-500 !text-primary-neutral font-medium"
          :active-class="link.to === '/admin' ? '' : '!border-primary-700 dark:!border-primary-500 !text-primary-neutral font-medium'"
        >
          {{ link.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
