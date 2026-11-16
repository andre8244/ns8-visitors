<script setup lang="ts">
import { NeInlineNotification, NeModal } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'

// Delete item modal pattern: the parent runs the deletion in the action prop
const props = defineProps<{
  visible: boolean
  title: string
  description: string
  errorTitle: string
  confirmLabel?: string
  action: () => Promise<void>
}>()
const emit = defineEmits<{ close: []; done: [] }>()

const { t } = useI18n()
const { errorText } = useApi()
const running = shallowRef(false)
const error = shallowRef('')

// The parent clears the object when the modal closes: keep the texts while
// it fades out
const shownTitle = shallowRef(props.title)
const shownDescription = shallowRef(props.description)
watch(
  () => [props.visible, props.title, props.description] as const,
  ([visible, title, description]) => {
    if (visible) {
      shownTitle.value = title
      shownDescription.value = description
    }
  }
)

watch(
  () => props.visible,
  () => (error.value = '')
)

async function confirm() {
  running.value = true
  error.value = ''
  try {
    await props.action()
    emit('done')
  } catch (err) {
    error.value = errorText(err)
  } finally {
    running.value = false
  }
}
</script>

<template>
  <NeModal
    :visible="visible"
    kind="warning"
    :title="shownTitle"
    :primary-label="confirmLabel ?? t('common.delete')"
    primary-button-kind="danger"
    :primary-button-disabled="running"
    :primary-button-loading="running"
    :cancel-label="t('common.cancel')"
    :close-aria-label="t('common.close')"
    @primary-click="confirm"
    @close="emit('close')"
  >
    <p>{{ shownDescription }}</p>
    <NeInlineNotification v-if="error" kind="error" :title="errorTitle" :description="error" class="mt-5" />
  </NeModal>
</template>
