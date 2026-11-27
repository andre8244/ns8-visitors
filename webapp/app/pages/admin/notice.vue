<script setup lang="ts">
import {
  NeButton,
  NeCard,
  NeEmptyState,
  NeHeading,
  NeInlineNotification,
  NeSkeleton,
  NeTable,
  NeTableBody,
  NeTableCell,
  NeTableHead,
  NeTableHeadCell,
  NeTableRow
} from '@nethesis/vue-components'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCirclePlus, faEye, faFileShield } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'
import type { NoticeVersion } from '~~/shared/types/admin'

const { t } = useI18n()
const { api, errorText } = useApi()
const { showSuccess } = useToasts()

const versions = shallowRef<NoticeVersion[]>([])
const loading = shallowRef(true)
const error = shallowRef('')

async function reload() {
  try {
    versions.value = await api<NoticeVersion[]>('/api/admin/notice')
    error.value = ''
  } catch (err) {
    error.value = errorText(err)
  } finally {
    loading.value = false
  }
}
reload()

const current = computed(() => versions.value[0] ?? null)
const publishShown = shallowRef(false)
const shownVersion = shallowRef<NoticeVersion | null>(null)

function onPublished() {
  publishShown.value = false
  showSuccess(t('notice.published'), t('notice.published_description'), { afterDialog: true })
  reload()
}
</script>

<template>
  <div>
    <PageHeader :title="t('notice.title')" :description="t('notice.description')">
      <template v-if="current" #actions>
        <NeButton kind="primary" size="lg" @click="publishShown = true">
          <template #prefix>
            <FontAwesomeIcon :icon="faCirclePlus" aria-hidden="true" />
          </template>
          {{ t('notice.publish_version') }}
        </NeButton>
      </template>
    </PageHeader>
    <NeInlineNotification v-if="error" kind="error" :title="t('notice.cannot_load')" :description="error" />
    <NeSkeleton v-else-if="loading" :lines="8" />
    <NeEmptyState
      v-else-if="!current"
      :icon="faFileShield"
      :title="t('notice.no_notice')"
      :description="t('notice.no_notice_description')"
      class="bg-elevation-0"
    >
      <NeButton kind="primary" size="lg" @click="publishShown = true">
        <template #prefix>
          <FontAwesomeIcon :icon="faCirclePlus" aria-hidden="true" />
        </template>
        {{ t('notice.publish_version') }}
      </NeButton>
    </NeEmptyState>
    <template v-else>
      <NeCard :title="t('notice.current_version', { number: current.id })" class="mb-10">
        <p class="text-tertiary-neutral mb-6 text-sm">
          {{ t('notice.published_by', { date: formatDateTime(current.publishedAt), name: auditActorLabel(current.publishedBy, t) }) }}
        </p>
        <NoticeText :markdown="current.bodyMd" :heading-level="4" />
      </NeCard>
      <NeHeading tag="h2" class="mb-4">{{ t('notice.history') }}</NeHeading>
      <NeTable :aria-label="t('notice.history')" card-breakpoint="md">
        <NeTableHead>
          <NeTableHeadCell>{{ t('notice.version') }}</NeTableHeadCell>
          <NeTableHeadCell>{{ t('notice.published_at') }}</NeTableHeadCell>
          <NeTableHeadCell>{{ t('notice.published_by_column') }}</NeTableHeadCell>
          <NeTableHeadCell>
            <!-- no header for actions -->
          </NeTableHeadCell>
        </NeTableHead>
        <NeTableBody>
          <NeTableRow v-for="version in versions" :key="version.id">
            <NeTableCell :data-label="t('notice.version')">{{ version.id }}</NeTableCell>
            <NeTableCell :data-label="t('notice.published_at')">{{ formatDateTime(version.publishedAt) }}</NeTableCell>
            <NeTableCell :data-label="t('notice.published_by_column')">{{ auditActorLabel(version.publishedBy, t) }}</NeTableCell>
            <NeTableCell :data-label="t('common.actions')">
              <div class="-ml-2.5 flex md:ml-0 md:justify-end">
                <NeButton
                  kind="tertiary"
                  :aria-label="`${t('visits.details')} ${t('notice.version_number', { number: version.id })}`"
                  @click="shownVersion = version"
                >
                  <template #prefix>
                    <FontAwesomeIcon :icon="faEye" class="h-4 w-4" aria-hidden="true" />
                  </template>
                  {{ t('visits.details') }}
                </NeButton>
              </div>
            </NeTableCell>
          </NeTableRow>
        </NeTableBody>
      </NeTable>
    </template>
    <PublishNoticeDrawer
      :is-shown="publishShown"
      :current-text="current?.bodyMd ?? ''"
      @close="publishShown = false"
      @published="onPublished"
    />
    <NoticeVersionDrawer :version="shownVersion" @close="shownVersion = null" />
  </div>
</template>
