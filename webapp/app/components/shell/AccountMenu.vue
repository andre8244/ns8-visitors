<script setup lang="ts">
import { NeDropdown, NeTooltip, type NeDropdownItem } from '@nethesis/vue-components'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faArrowRightFromBracket,
  faChevronDown,
  faCircleUser,
  faMoon,
  faSun
} from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { user, clear } = useUserSession()
const { isDark, toggleTheme } = useAdminTheme()

async function signOut() {
  await clear()
  await navigateTo('/login')
}

const items = computed<NeDropdownItem[]>(() => [
  {
    id: 'theme',
    label: isDark.value ? t('theme.switch_to_light') : t('theme.switch_to_dark'),
    icon: isDark.value ? faSun : faMoon,
    action: () => toggleTheme()
  },
  { id: 'divider' },
  { id: 'signOut', label: t('common.sign_out'), icon: faArrowRightFromBracket, action: signOut }
])
</script>

<!-- Account menu of the top bar, as in My Nethesis -->
<template>
  <NeTooltip trigger-event="mouseenter focus" placement="bottom" class="flex">
    <template #trigger>
      <NeDropdown
        :items="items"
        align-to-right
        :open-menu-aria-label="t('shell.open_account_menu')"
        class="relative"
      >
        <template #button>
          <span :class="[topBarButtonClasses, 'items-center gap-2']">
            <FontAwesomeIcon :icon="faCircleUser" class="h-6 w-6 shrink-0" aria-hidden="true" />
            <FontAwesomeIcon :icon="faChevronDown" class="h-3 w-3 shrink-0" aria-hidden="true" />
          </span>
        </template>
        <template #menuHeader>
          <div class="space-y-1 px-4 py-2 text-sm">
            <div class="text-primary-neutral font-medium">{{ user?.name }}</div>
            <div class="text-tertiary-neutral">{{ user?.username }}</div>
          </div>
          <hr class="border-layout-divider my-1" />
        </template>
      </NeDropdown>
    </template>
    <template #content>{{ t('shell.account') }}</template>
  </NeTooltip>
</template>
