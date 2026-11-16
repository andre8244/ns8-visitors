<script setup lang="ts">
import { NeInlineNotification, NeModal, NeTextInput } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'
import type { Visit } from '~~/shared/types/admin'

// Deletes every visit and event registration of the person: the user types
// the name to confirm, as it destroys many records
const props = defineProps<{ visit: Visit | null }>()
const emit = defineEmits<{ close: []; deleted: [name: string] }>()

const { t } = useI18n()
const { api, errorText } = useApi()

const confirmText = shallowRef('')
const deleting = shallowRef(false)
const error = shallowRef('')

// Keep the name while the modal fades out, after the parent clears the visit
const name = shallowRef('')
watch(
  () => props.visit,
  (visit) => {
    if (visit) name.value = fullName(visit)
  },
  { immediate: true }
)
const confirmed = computed(() => confirmText.value.trim() === name.value)

watch(
  () => props.visit,
  () => {
    confirmText.value = ''
    error.value = ''
  }
)

async function deletePerson() {
  if (!props.visit || !confirmed.value) return
  deleting.value = true
  error.value = ''
  try {
    await api('/api/admin/people/delete', { method: 'POST', body: { searchName: props.visit.searchName } })
    emit('deleted', name.value)
  } catch (err) {
    error.value = errorText(err)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <NeModal
    :visible="!!visit"
    kind="warning"
    :title="t('visits.delete_person_title')"
    :primary-label="t('common.delete')"
    primary-button-kind="danger"
    :primary-button-disabled="!confirmed || deleting"
    :primary-button-loading="deleting"
    :cancel-label="t('common.cancel')"
    :close-aria-label="t('common.close')"
    @primary-click="deletePerson"
    @close="emit('close')"
  >
    <p class="mb-5">{{ t('visits.delete_person_description', { name }) }}</p>
    <NeTextInput v-model="confirmText" :label="t('common.type_to_confirm', { name })" />
    <NeInlineNotification
      v-if="error"
      kind="error"
      :title="t('visits.cannot_delete_person')"
      :description="error"
      class="mt-5"
    />
  </NeModal>
</template>
