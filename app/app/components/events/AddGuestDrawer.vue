<script setup lang="ts">
import { NeButton, NeInlineNotification, NeSideDrawer, NeTextInput, focusElement } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ isShown: boolean; eventId: number }>()
const emit = defineEmits<{ close: []; added: [name: string] }>()

const { t } = useI18n()
const { api, errorText } = useApi()

const guest = ref({ firstName: '', lastName: '', company: '' })
const errors = ref({ firstName: '', lastName: '', company: '' })
const saving = shallowRef(false)
const saveError = shallowRef('')
const firstNameRef = ref()

function onShow() {
  guest.value = { firstName: '', lastName: '', company: '' }
  errors.value = { firstName: '', lastName: '', company: '' }
  saveError.value = ''
  focusElement(firstNameRef)
}

function validate() {
  const { firstName, lastName, company } = guest.value
  errors.value = {
    firstName: firstName.trim() ? '' : t('guests.enter_first_name'),
    lastName: lastName.trim() ? '' : t('guests.enter_last_name'),
    company: company.trim() ? '' : t('guests.enter_company')
  }
  return !Object.values(errors.value).some(Boolean)
}

async function add() {
  if (!validate()) return
  saving.value = true
  saveError.value = ''
  try {
    await api(`/api/admin/events/${props.eventId}/guests`, { method: 'POST', body: { guests: [guest.value] } })
    emit('added', fullName(guest.value))
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
    :title="t('guests.add_guest')"
    :close-aria-label="t('common.close_drawer')"
    @show="onShow"
    @close="emit('close')"
  >
    <form novalidate @submit.prevent="add">
      <div class="space-y-6">
        <NeTextInput
          ref="firstNameRef"
          v-model="guest.firstName"
          :label="t('visits.first_name')"
          :invalid-message="errors.firstName"
          :disabled="saving"
        />
        <NeTextInput v-model="guest.lastName" :label="t('visits.last_name')" :invalid-message="errors.lastName" :disabled="saving" />
        <NeTextInput v-model="guest.company" :label="t('visits.company')" :invalid-message="errors.company" :disabled="saving" />
        <NeInlineNotification v-if="saveError" kind="error" :title="t('guests.cannot_add_guest')" :description="saveError" />
      </div>
      <hr class="border-layout-divider my-8" />
      <div class="flex justify-end gap-3">
        <NeButton kind="tertiary" size="lg" :disabled="saving" @click="emit('close')">{{ t('common.cancel') }}</NeButton>
        <NeButton type="submit" kind="primary" size="lg" :disabled="saving" :loading="saving">{{ t('guests.add_guest') }}</NeButton>
      </div>
    </form>
  </NeSideDrawer>
</template>
