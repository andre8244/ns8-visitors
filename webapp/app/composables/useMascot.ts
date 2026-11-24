import { createGlobalState } from '@vueuse/core'
import type { MascotMood } from '~/components/kiosk/KioskMascot.vue'

export interface MascotState {
  mood?: MascotMood
  // Always shown in the bubble
  message?: string
  // Shown when the visitor taps the mascot: what to do on this page
  help?: string
  // A page with a form: on narrow screens the mascot shrinks to its head,
  // not to cover the fields
  compact?: boolean
}

const useStack = createGlobalState(() => shallowRef<Array<() => MascotState>>([]))

// The mascot lives in the kiosk layout; pages and components tell it what to
// say. The last one set up wins, so the confirmation after a check-in covers
// its page, and it is removed with the component that set it
export function useMascot(state: () => MascotState) {
  const stack = useStack()
  stack.value = [...stack.value, state]
  onScopeDispose(() => {
    stack.value = stack.value.filter((item) => item !== state)
  })
}

export function useMascotState() {
  const stack = useStack()
  return computed<MascotState>(() => stack.value.at(-1)?.() ?? {})
}
