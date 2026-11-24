<script setup lang="ts">
import { NeBadgeV2, NeTable, NeTableBody, NeTableCell, NeTableHead, NeTableHeadCell, NeTableRow } from '@nethesis/vue-components'
import { useI18n } from 'vue-i18n'
import type { AuditEntry } from '~~/shared/types/admin'

defineProps<{ entries: AuditEntry[]; loading: boolean }>()

const { t, te } = useI18n()

const sourceKind = { ldap: 'blue', kiosk: 'indigo', system: 'gray' } as const
</script>

<template>
  <NeTable :aria-label="t('audit.title')" :loading="loading" card-breakpoint="lg">
    <NeTableHead>
      <NeTableHeadCell>{{ t('audit.date') }}</NeTableHeadCell>
      <NeTableHeadCell>{{ t('audit.user') }}</NeTableHeadCell>
      <NeTableHeadCell>{{ t('audit.source') }}</NeTableHeadCell>
      <NeTableHeadCell>{{ t('audit.action') }}</NeTableHeadCell>
      <NeTableHeadCell>{{ t('audit.details') }}</NeTableHeadCell>
    </NeTableHead>
    <NeTableBody>
      <NeTableRow v-for="entry in entries" :key="entry.id">
        <NeTableCell :data-label="t('audit.date')">{{ formatDateTime(entry.at) }}</NeTableCell>
        <NeTableCell :data-label="t('audit.user')">{{ auditActorLabel(entry.actor, t) }}</NeTableCell>
        <NeTableCell :data-label="t('audit.source')">
          <NeBadgeV2 :kind="sourceKind[entry.via]">{{ t(`audit.sources.${entry.via}`) }}</NeBadgeV2>
        </NeTableCell>
        <NeTableCell :data-label="t('audit.action')">{{ auditActionLabel(entry.action, t, te) }}</NeTableCell>
        <NeTableCell :data-label="t('audit.details')">
          <div v-if="auditObjects(entry, t).length || entry.details" class="space-y-1">
            <p v-for="object in auditObjects(entry, t)" :key="object">{{ object }}</p>
            <!-- Values recorded by the server, as they are: no personal data -->
            <code v-if="entry.details" class="text-secondary-neutral block text-xs break-all">{{ JSON.stringify(entry.details) }}</code>
          </div>
          <span v-else>-</span>
        </NeTableCell>
      </NeTableRow>
    </NeTableBody>
    <template #paginator>
      <slot name="paginator" />
    </template>
  </NeTable>
</template>
