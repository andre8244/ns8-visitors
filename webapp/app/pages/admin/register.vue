<script setup lang="ts">
import { NeButton, NeEmptyState, NeInlineNotification, NePaginator } from '@nethesis/vue-components'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faClipboardList, faFileCsv, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { refDebounced } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import type { Visit } from '~~/shared/types/admin'
import type { RegisterFilterValues } from '~/components/visits/RegisterFilters.vue'

const { t } = useI18n()

const emptyFilters: RegisterFilterValues = { q: '', from: '', to: '' }
const filters = ref<RegisterFilterValues>({ ...emptyFilters })
// Wait for the user to stop typing before searching
const debouncedFilters = refDebounced(filters, 300)
const page = shallowRef(1)
const pageSize = shallowRef(25)

const { visits, total, loading, error, reload } = useVisits(() => ({
  ...debouncedFilters.value,
  page: page.value,
  pageSize: pageSize.value
}))
const { actionError, checkOut, personDeleted } = useVisitActions(reload)
const { exporting, exportError, exportCsv } = useVisitsExport()

watch(debouncedFilters, () => (page.value = 1))

const filtered = computed(() => Object.values(filters.value).some(Boolean))
const pageError = computed(() => error.value || actionError.value || exportError.value)
const pageErrorTitle = computed(() => {
  if (error.value) return t('register.cannot_load')
  if (exportError.value) return t('register.cannot_export')
  return t('visits.cannot_check_out')
})

const detailsVisit = shallowRef<Visit | null>(null)
const deleteVisit = shallowRef<Visit | null>(null)

function resetFilters() {
  filters.value = { ...emptyFilters }
}

function onDeleted(name: string) {
  deleteVisit.value = null
  personDeleted(name)
}
</script>

<template>
  <div>
    <PageHeader :title="t('register.title')" :description="t('register.description')">
      <template #actions>
        <NeButton kind="secondary" size="lg" :loading="exporting" :disabled="exporting || !total" @click="exportCsv(filters)">
          <template #prefix>
            <FontAwesomeIcon :icon="faFileCsv" aria-hidden="true" />
          </template>
          {{ t('register.export_csv') }}
        </NeButton>
      </template>
    </PageHeader>
    <RegisterFilters v-model="filters" class="mb-6" @reset="resetFilters" />
    <NeInlineNotification v-if="pageError" kind="error" :title="pageErrorTitle" :description="pageError" class="mb-6" />
    <NeEmptyState
      v-if="!loading && !error && !visits.length && filtered"
      :icon="faMagnifyingGlass"
      :title="t('register.no_visits_found')"
      :description="t('common.try_changing_filters')"
      class="bg-elevation-0"
    >
      <NeButton kind="tertiary" size="lg" @click="resetFilters">{{ t('common.reset_filters') }}</NeButton>
    </NeEmptyState>
    <NeEmptyState
      v-else-if="!loading && !error && !visits.length"
      :icon="faClipboardList"
      :title="t('register.no_visits_yet')"
      class="bg-elevation-0"
    />
    <VisitsTable
      v-else-if="!error"
      :visits="visits"
      :loading="loading"
      mode="register"
      @details="detailsVisit = $event"
      @check-out="checkOut"
      @delete-person="deleteVisit = $event"
    >
      <template #paginator>
        <NePaginator
          :current-page="page"
          :total-rows="total"
          :page-size="pageSize"
          :page-sizes="[10, 25, 50, 100]"
          :previous-label="t('paginator.previous')"
          :next-label="t('paginator.next')"
          :nav-pagination-label="t('paginator.label')"
          :range-of-total-label="t('paginator.of')"
          :page-size-label="t('paginator.show')"
          @select-page="page = $event"
          @select-page-size="(size: number) => { pageSize = size; page = 1 }"
        />
      </template>
    </VisitsTable>
    <VisitDetailsDrawer :visit="detailsVisit" @close="detailsVisit = null" />
    <DeletePersonModal :visit="deleteVisit" @close="deleteVisit = null" @deleted="onDeleted" />
  </div>
</template>
