<script setup lang="ts">
import { NeButton, NeInlineNotification, NeTextInput } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'

export type CheckInPerson = { firstName: string; lastName: string; company: string; host: string }
export type CheckInSubmit = { person: CheckInPerson; signature: string }

// visitor: name, company, contact person and signature. walk-in: a guest not
// in the list, without contact person. guest: only the signature, the
// person is known
const props = defineProps<{
  mode: 'visitor' | 'walk-in' | 'guest'
  notice: string
  saving: boolean
  error: string
}>()
const emit = defineEmits<{ submit: [value: CheckInSubmit] }>()

const { t } = useI18n()

const person = ref<CheckInPerson>({ firstName: '', lastName: '', company: '', host: '' })
const signature = shallowRef<string | null>(null)
const errors = ref({ firstName: '', lastName: '', company: '', signature: '' })

const askPerson = computed(() => props.mode !== 'guest')

// An error goes away as soon as the visitor fixes the field
watch(person, (value, old) => {
  for (const key of ['firstName', 'lastName', 'company'] as const) {
    if (value[key] !== old[key]) errors.value[key] = ''
  }
}, { deep: true })
watch(signature, () => (errors.value.signature = ''))

function validate() {
  const { firstName, lastName, company } = person.value
  errors.value = {
    firstName: askPerson.value && !firstName.trim() ? t('kiosk.enter_first_name') : '',
    lastName: askPerson.value && !lastName.trim() ? t('kiosk.enter_last_name') : '',
    company: askPerson.value && !company.trim() ? t('kiosk.enter_company') : '',
    signature: signature.value ? '' : t('kiosk.sign_here')
  }
  return !Object.values(errors.value).some(Boolean)
}

function submit() {
  if (!validate()) return
  emit('submit', { person: { ...person.value }, signature: signature.value! })
}
</script>

<template>
  <form class="space-y-8" novalidate @submit.prevent="submit">
    <NoticeBox :markdown="notice" />
    <div v-if="askPerson" class="grid gap-6 sm:grid-cols-2">
      <NeTextInput v-model="person.firstName" :label="t('visits.first_name')" :invalid-message="errors.firstName" autocomplete="off" />
      <NeTextInput v-model="person.lastName" :label="t('visits.last_name')" :invalid-message="errors.lastName" autocomplete="off" />
      <NeTextInput v-model="person.company" :label="t('visits.company')" :invalid-message="errors.company" autocomplete="off" />
      <NeTextInput
        v-if="mode === 'visitor'"
        v-model="person.host"
        :label="t('kiosk.host')"
        :helper-text="t('kiosk.host_helper')"
        optional
        :optional-label="t('common.optional')"
        autocomplete="off"
      />
    </div>
    <SignaturePad v-model="signature" :label="t('kiosk.signature_label')" :invalid-message="errors.signature" />
    <NeInlineNotification v-if="error" kind="error" :title="t('kiosk.cannot_check_in')" :description="error" />
    <div class="flex justify-end">
      <NeButton type="submit" kind="primary" size="lg" :loading="saving" :disabled="saving">
        {{ t('kiosk.check_in') }}
      </NeButton>
    </div>
  </form>
</template>
