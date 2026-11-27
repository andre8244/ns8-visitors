import { getPreference, savePreference } from '@nethesis/vue-components'

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100]

// The rows per page of a table, as in My Nethesis: 10 by default, and the
// size chosen by the admin saved in the browser for that admin and table
// (local storage entry "preferences-<username>")
export function useTablePageSize(tableId: string) {
  const { user } = useUserSession()
  const username = user.value?.username
  const key = `${tableId}PageSize`

  const pageSize = shallowRef(load())

  function load() {
    if (!username) return DEFAULT_PAGE_SIZE
    try {
      const saved = Number(getPreference(key, username))
      return PAGE_SIZE_OPTIONS.includes(saved) ? saved : DEFAULT_PAGE_SIZE
    } catch {
      // storage blocked or not valid: the default
      return DEFAULT_PAGE_SIZE
    }
  }

  function setPageSize(size: number) {
    pageSize.value = size
    if (!username) return
    try {
      savePreference(key, size, username)
    } catch {
      // storage blocked: the size lasts until the page is left
    }
  }

  return { pageSize, setPageSize }
}
