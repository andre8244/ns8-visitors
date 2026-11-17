<script setup lang="ts">
import { NeTooltip } from '@nethesis/vue-components'
import { useClipboard } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

// Text copied with a click, as in My Nethesis. The legacy fallback copies
// also on plain HTTP, where the Clipboard API is missing (pnpm dev --host)
const props = defineProps<{ text: string }>()

const { t } = useI18n()
const { copy, copied } = useClipboard({ copiedDuring: 2000, legacy: true })
// In the body, the tooltip does not take the font of the copied text
const tippyProps = { hideOnClick: false, appendTo: () => document.body }
</script>

<template>
  <NeTooltip trigger-event="mouseenter focus" :tippy-props="tippyProps">
    <template #trigger>
      <button
        type="button"
        class="focus-visible:ring-primary-500 cursor-pointer rounded-sm text-left break-all hover:underline focus-visible:ring-2 focus-visible:outline-none"
        @click="copy(props.text)"
      >
        {{ text }}
      </button>
    </template>
    <template #content>
      {{ copied ? t('common.copied') : t('common.click_to_copy') }}
    </template>
  </NeTooltip>
  <!-- Announces the copy to screen readers, which do not read the tooltip -->
  <span class="sr-only" aria-live="polite">{{ copied ? t('common.copied') : '' }}</span>
</template>
