<script setup lang="ts">
import { NeSideDrawer } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'
import type { Visit } from '~~/shared/types/admin'

const props = defineProps<{ visit: Visit | null }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

// Keep showing the last visit while the drawer slides out: an empty title
// in the middle of the transition leaves the drawer stuck on the screen
const visit = shallowRef<Visit | null>(null)
watch(
  () => props.visit,
  (value) => {
    if (value) visit.value = value
  },
  { immediate: true }
)

const checkOutText = computed(() => {
  const current = visit.value
  if (!current?.checkOutAt) return t('visits.in_office')
  const by = current.checkOutBy ? t(`visits.check_out_by.${current.checkOutBy}`) : ''
  return `${formatDateTime(current.checkOutAt)} (${by})`
})

const fields = computed(() => {
  const current = visit.value
  if (!current) return []
  return [
    { label: t('visits.company'), value: current.company },
    { label: t('visits.host'), value: current.host ?? '-' },
    { label: t('visits.event'), value: current.eventName ?? '-' },
    { label: t('visits.check_in'), value: formatDateTime(current.checkInAt) },
    { label: t('visits.check_out_column'), value: checkOutText.value }
  ]
})
</script>

<!-- Details of a visit, with the signature. Opening it is recorded in the audit log -->
<template>
  <NeSideDrawer
    :is-shown="!!props.visit"
    :title="visit ? fullName(visit) : ''"
    :close-aria-label="t('common.close_drawer')"
    @close="emit('close')"
  >
    <template v-if="visit">
      <dl class="space-y-4">
        <div v-for="field in fields" :key="field.label">
          <dt class="text-tertiary-neutral text-sm">{{ field.label }}</dt>
          <dd>{{ field.value }}</dd>
        </div>
      </dl>
      <hr class="border-layout-divider my-8" />
      <p class="text-tertiary-neutral mb-2 text-sm">{{ t('visits.signature') }}</p>
      <!-- White background: the signature is black ink in both themes -->
      <img
        v-if="visit.signed"
        :src="`/api/admin/visits/${visit.id}/signature`"
        :alt="t('visits.signature_of', { name: fullName(visit) })"
        class="border-layout-divider w-full rounded-md border bg-white"
      />
      <p v-else>{{ t('visits.signed_first_day') }}</p>
    </template>
  </NeSideDrawer>
</template>
