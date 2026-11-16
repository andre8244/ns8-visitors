<script setup lang="ts">
import { NeButton, NeInlineNotification, NeSideDrawer, NeTextArea } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'

// Publish a new version of the privacy notice, starting from the current text
const props = defineProps<{ isShown: boolean; currentText: string }>()
const emit = defineEmits<{ close: []; published: [] }>()

const { t } = useI18n()
const { api, errorText } = useApi()

const text = shallowRef('')
const textError = shallowRef('')
const publishing = shallowRef(false)
const publishError = shallowRef('')

function onShow() {
  text.value = props.currentText
  textError.value = ''
  publishError.value = ''
}

async function publish() {
  textError.value = text.value.trim() ? '' : t('notice.enter_text')
  if (textError.value) return
  publishing.value = true
  publishError.value = ''
  try {
    await api('/api/admin/notice', { method: 'POST', body: { bodyMd: text.value } })
    emit('published')
  } catch (err) {
    publishError.value = errorText(err)
  } finally {
    publishing.value = false
  }
}
</script>

<template>
  <NeSideDrawer
    :is-shown="isShown"
    :title="t('notice.publish_version')"
    :close-aria-label="t('common.close_drawer')"
    @show="onShow"
    @close="emit('close')"
  >
    <form novalidate @submit.prevent="publish">
      <div class="space-y-6">
        <NeTextArea
          v-model="text"
          :label="t('notice.text')"
          :helper-text="t('notice.text_helper')"
          :invalid-message="textError"
          :rows="18"
          :disabled="publishing"
        />
        <NeInlineNotification kind="info" :title="t('notice.publish_info_title')" :description="t('notice.publish_info')" />
        <NeInlineNotification v-if="publishError" kind="error" :title="t('notice.cannot_publish')" :description="publishError" />
      </div>
      <hr class="border-layout-divider my-8" />
      <div class="flex justify-end gap-3">
        <NeButton kind="tertiary" size="lg" :disabled="publishing" @click="emit('close')">{{ t('common.cancel') }}</NeButton>
        <NeButton type="submit" kind="primary" size="lg" :disabled="publishing" :loading="publishing">{{ t('notice.publish') }}</NeButton>
      </div>
    </form>
  </NeSideDrawer>
</template>
