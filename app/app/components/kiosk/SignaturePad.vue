<script setup lang="ts">
import { NeButton, NeFormItemLabel } from '@nethesis/vue-components'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faEraser } from '@fortawesome/free-solid-svg-icons'
import { useResizeObserver } from '@vueuse/core'
import SignaturePad from 'signature_pad'
import { useI18n } from 'vue-i18n'

defineProps<{ label: string; invalidMessage?: string }>()

// PNG data URL of the signature, null while the pad is empty. Only the image
// leaves the pad: the stroke timing and pressure are never sent
const signature = defineModel<string | null>({ default: null })

const { t } = useI18n()
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
let pad: SignaturePad | undefined

function update() {
  signature.value = pad && !pad.isEmpty() ? pad.toDataURL('image/png') : null
}

// Size the canvas to its box and to the screen density, keeping the strokes
function resize() {
  if (!canvas.value || !pad) return
  const data = pad.toData()
  const ratio = Math.max(window.devicePixelRatio || 1, 1)
  canvas.value.width = canvas.value.offsetWidth * ratio
  canvas.value.height = canvas.value.offsetHeight * ratio
  canvas.value.getContext('2d')?.scale(ratio, ratio)
  pad.clear()
  pad.fromData(data)
}

onMounted(() => {
  // White background and black ink in both themes: the stored image is a
  // signature on paper
  pad = new SignaturePad(canvas.value!, { backgroundColor: 'rgb(255, 255, 255)', penColor: 'rgb(0, 0, 0)' })
  pad.addEventListener('endStroke', update)
  resize()
})

onBeforeUnmount(() => pad?.off())

useResizeObserver(canvas, resize)

function clearPad() {
  pad?.clear()
  update()
}
</script>

<template>
  <div>
    <NeFormItemLabel>{{ label }}</NeFormItemLabel>
    <canvas
      ref="canvas"
      class="h-56 w-full touch-none rounded-md bg-white ring-1"
      :class="invalidMessage ? 'ring-rose-500 dark:ring-rose-400' : 'ring-gray-300 dark:ring-gray-500'"
      role="img"
      :aria-label="label"
    />
    <div class="mt-2 flex items-center justify-between gap-4">
      <p v-if="invalidMessage" class="text-sm text-rose-700 dark:text-rose-500">{{ invalidMessage }}</p>
      <span v-else />
      <NeButton kind="tertiary" :disabled="!signature" @click="clearPad">
        <template #prefix>
          <FontAwesomeIcon :icon="faEraser" aria-hidden="true" />
        </template>
        {{ t('kiosk.clear_signature') }}
      </NeButton>
    </div>
  </div>
</template>
