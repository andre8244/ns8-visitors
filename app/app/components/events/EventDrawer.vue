<script setup lang="ts">
import { NeButton, NeInlineNotification, NeSideDrawer, NeTextInput, focusElement } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'
import type { EventSummary } from '~~/shared/types/admin'

// Create an event, or edit the one given
const props = defineProps<{ isShown: boolean; event: EventSummary | null }>()
const emit = defineEmits<{ close: []; saved: [name: string, created: boolean] }>()

const { t } = useI18n()
const { api, errorText } = useApi()

const name = shallowRef('')
const startDate = shallowRef('')
const endDate = shallowRef('')
const errors = ref({ name: '', startDate: '', endDate: '' })
const saving = shallowRef(false)
const saveError = shallowRef('')
const nameRef = ref()

const editing = computed(() => !!props.event)

function onShow() {
  name.value = props.event?.name ?? ''
  startDate.value = props.event?.startDate ?? todayDate()
  endDate.value = props.event?.endDate ?? todayDate()
  errors.value = { name: '', startDate: '', endDate: '' }
  saveError.value = ''
  focusElement(nameRef)
}

function validate() {
  errors.value = {
    name: name.value.trim() ? '' : t('events.enter_name'),
    startDate: startDate.value ? '' : t('events.enter_start_date'),
    endDate: !endDate.value ? t('events.enter_end_date') : endDate.value < startDate.value ? t('events.end_before_start') : ''
  }
  return !Object.values(errors.value).some(Boolean)
}

async function save() {
  if (!validate()) return
  saving.value = true
  saveError.value = ''
  const body = { name: name.value.trim(), startDate: startDate.value, endDate: endDate.value }
  try {
    if (props.event) {
      await api(`/api/admin/events/${props.event.id}`, { method: 'PATCH', body })
    } else {
      await api('/api/admin/events', { method: 'POST', body })
    }
    emit('saved', body.name, !props.event)
  } catch (err) {
    saveError.value = errorText(err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <NeSideDrawer
    :is-shown="isShown"
    :title="editing ? t('events.edit_event') : t('events.create_event')"
    :close-aria-label="t('common.close_drawer')"
    @show="onShow"
    @close="emit('close')"
  >
    <form novalidate @submit.prevent="save">
      <div class="space-y-6">
        <NeTextInput
          ref="nameRef"
          v-model="name"
          :label="t('events.name')"
          :placeholder="t('events.name_placeholder')"
          :invalid-message="errors.name"
          :disabled="saving"
        />
        <NeTextInput
          v-model="startDate"
          type="date"
          :label="t('events.start_date')"
          :invalid-message="errors.startDate"
          :disabled="saving"
        />
        <NeTextInput
          v-model="endDate"
          type="date"
          :label="t('events.end_date')"
          :helper-text="t('events.end_date_helper')"
          :invalid-message="errors.endDate"
          :disabled="saving"
        />
        <NeInlineNotification
          v-if="saveError"
          kind="error"
          :title="editing ? t('events.cannot_save_event') : t('events.cannot_create_event')"
          :description="saveError"
        />
      </div>
      <hr class="border-layout-divider my-8" />
      <div class="flex justify-end gap-3">
        <NeButton kind="tertiary" size="lg" :disabled="saving" @click="emit('close')">{{ t('common.cancel') }}</NeButton>
        <NeButton type="submit" kind="primary" size="lg" :disabled="saving" :loading="saving">
          {{ editing ? t('common.save') : t('events.create_event') }}
        </NeButton>
      </div>
    </form>
  </NeSideDrawer>
</template>
