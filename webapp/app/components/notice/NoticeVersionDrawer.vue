<script setup lang="ts">
import { NeSideDrawer } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'
import type { NoticeVersion } from '~~/shared/types/admin'

const props = defineProps<{ version: NoticeVersion | null }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

// Keep the last version while the drawer slides out (see VisitDetailsDrawer)
const version = shallowRef<NoticeVersion | null>(null)
watch(
  () => props.version,
  (value) => {
    if (value) version.value = value
  },
  { immediate: true }
)
</script>

<template>
  <NeSideDrawer
    :is-shown="!!props.version"
    :title="version ? t('notice.version_number', { number: version.id }) : ''"
    :close-aria-label="t('common.close_drawer')"
    @close="emit('close')"
  >
    <template v-if="version">
      <p class="text-tertiary-neutral mb-6 text-sm">
        {{ t('notice.published_by', { date: formatDateTime(version.publishedAt), name: auditActorLabel(version.publishedBy, t) }) }}
      </p>
      <NoticeText :markdown="version.bodyMd" :heading-level="4" />
    </template>
  </NeSideDrawer>
</template>
