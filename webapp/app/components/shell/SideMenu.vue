<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faCalendarDay,
  faClipboardList,
  faFileShield,
  faGear,
  faHouse,
  faTabletScreenButton
} from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()

const items = computed(() => [
  { to: '/admin', label: t('nav.present'), icon: faHouse },
  { to: '/admin/register', label: t('nav.register'), icon: faClipboardList },
  { to: '/admin/events', label: t('nav.events'), icon: faCalendarDay },
  { to: '/admin/notice', label: t('nav.notice'), icon: faFileShield },
  { to: '/admin/devices', label: t('nav.devices'), icon: faTabletScreenButton },
  { to: '/admin/settings', label: t('nav.settings'), icon: faGear }
])

// The home page is current only on itself, the others on their subpages too
function isCurrent(to: string) {
  return to === '/admin' ? route.path === to : route.path.startsWith(to)
}
</script>

<!-- Main sidebar of My Nethesis: the design system has no navigation component -->
<template>
  <nav :aria-label="t('nav.label')">
    <ul role="list" class="space-y-1">
      <li v-for="item in items" :key="item.to">
        <NuxtLink
          :to="item.to"
          :aria-current="isCurrent(item.to) ? 'page' : undefined"
          :class="[
            isCurrent(item.to)
              ? 'border-primary-700 dark:border-primary-500 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50'
              : 'text-tertiary-neutral border-transparent hover:text-gray-900 dark:hover:text-gray-50',
            'group focus-visible:ring-primary-500 flex items-center gap-x-3 rounded-md border-l-4 px-3 py-2 text-sm leading-6 font-medium transition-colors hover:bg-gray-100 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-gray-800'
          ]"
        >
          <FontAwesomeIcon :icon="item.icon" class="h-5 w-8 shrink-0" aria-hidden="true" />
          {{ item.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
