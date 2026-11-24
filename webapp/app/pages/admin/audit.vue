<script setup lang="ts">
import { NeButton, NeEmptyState, NeInlineNotification, NePaginator } from '@nethesis/vue-components'
import { faList, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'
import type { AuditFilterValues } from '~/components/audit/AuditFilters.vue'

const { t } = useI18n()

const emptyFilters: AuditFilterValues = { actor: [], action: [], via: [], from: '', to: '' }
const filters = ref<AuditFilterValues>({ ...emptyFilters })
const page = shallowRef(1)
const pageSize = shallowRef(25)

const { entries, actors, total, loading, error } = useAuditLog(() => ({
  ...filters.value,
  page: page.value,
  pageSize: pageSize.value
}))

watch(filters, () => (page.value = 1))

const filtered = computed(() => Object.values(filters.value).some((value) => value.length))

function resetFilters() {
  filters.value = { ...emptyFilters }
}
</script>

<template>
  <div>
    <PageHeader :title="t('audit.title')" :description="t('audit.description')" />
    <AuditFilters v-model="filters" :actors="actors" class="mb-6" @reset="resetFilters" />
    <NeInlineNotification v-if="error" kind="error" :title="t('audit.cannot_load')" :description="error" class="mb-6" />
    <NeEmptyState
      v-if="!loading && !error && !entries.length && filtered"
      :icon="faMagnifyingGlass"
      :title="t('audit.no_entries_found')"
      :description="t('common.try_changing_filters')"
      class="bg-elevation-0"
    >
      <NeButton kind="tertiary" size="lg" @click="resetFilters">{{ t('common.reset_filters') }}</NeButton>
    </NeEmptyState>
    <NeEmptyState
      v-else-if="!loading && !error && !entries.length"
      :icon="faList"
      :title="t('audit.no_entries_yet')"
      class="bg-elevation-0"
    />
    <AuditTable v-else-if="!error" :entries="entries" :loading="loading">
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
    </AuditTable>
  </div>
</template>
