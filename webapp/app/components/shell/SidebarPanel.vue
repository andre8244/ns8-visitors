<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<!-- Content of the sidebar, fixed on wide screens and in a dialog on small ones -->
<template>
  <div class="bg-elevation-0 flex grow flex-col gap-y-5 overflow-y-auto px-2 pb-4">
    <div class="flex h-16 shrink-0 items-center px-3">
      <NuxtLink
        to="/admin"
        class="focus-visible:ring-primary-500 rounded-sm text-lg font-medium focus-visible:ring-2 focus-visible:outline-none"
      >
        {{ t('app.title') }}
      </NuxtLink>
    </div>
    <SideMenu />
  </div>
</template>
