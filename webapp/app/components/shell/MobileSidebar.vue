<script setup lang="ts">
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'

const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const route = useRoute()

// Close after choosing a page
watch(
  () => route.path,
  () => (open.value = false)
)
</script>

<!-- Sidebar of small screens, as in My Nethesis -->
<template>
  <TransitionRoot as="template" :show="open">
    <Dialog as="div" class="relative z-50 lg:hidden" @close="open = false">
      <TransitionChild
        as="template"
        enter="transition-opacity ease-linear duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="transition-opacity ease-linear duration-300"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-900/80" />
      </TransitionChild>

      <div class="fixed inset-0 flex">
        <TransitionChild
          as="template"
          enter="transition ease-in-out duration-300 transform"
          enter-from="-translate-x-full"
          enter-to="translate-x-0"
          leave="transition ease-in-out duration-300 transform"
          leave-from="translate-x-0"
          leave-to="-translate-x-full"
        >
          <DialogPanel class="relative mr-16 flex w-full max-w-xs flex-1">
            <div class="absolute top-0 left-full flex w-16 justify-center pt-4">
              <button
                type="button"
                class="rounded-full p-2.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                @click="open = false"
              >
                <span class="sr-only">{{ t('shell.close_sidebar') }}</span>
                <FontAwesomeIcon :icon="faXmark" class="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <SidebarPanel />
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
