<script setup lang="ts">
import { NeHeading } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<!-- Admin home: present visitors, register and events come in phase 3 -->
<template>
  <NeHeading tag="h1">{{ t('app.title') }}</NeHeading>
</template>
