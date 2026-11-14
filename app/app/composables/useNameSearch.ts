import { refDebounced } from '@vueuse/core'
import type { NameSearchResult } from '~/components/kiosk/NameSearch.vue'

export const SEARCH_MIN_LENGTH = 3

// Search names on the tablet as the visitor types
export function useNameSearch<T extends NameSearchResult = NameSearchResult>(url: () => string | null) {
  const { api, errorText } = useKiosk()
  const query = shallowRef('')
  const debounced = refDebounced(query, 300)
  const results = shallowRef<T[]>([])
  const searching = shallowRef(false)
  const error = shallowRef('')
  // The text of the last search done: no 'not found' while the visitor types
  const searchedText = shallowRef('')

  watch([debounced, url], async ([text, target], _old, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    if (!target || text.trim().length < SEARCH_MIN_LENGTH) {
      results.value = []
      return
    }
    searching.value = true
    try {
      results.value = await api<T[]>(target, { query: { q: text }, signal: controller.signal })
      searchedText.value = text
      error.value = ''
    } catch (err) {
      if (!controller.signal.aborted) error.value = errorText(err)
    } finally {
      searching.value = false
    }
  })

  const searched = computed(() => !searching.value && searchedText.value === query.value && query.value.trim().length >= SEARCH_MIN_LENGTH)

  return { query, results, searching, searched, error }
}
