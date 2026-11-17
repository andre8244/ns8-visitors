import type { NitroFetchOptions } from 'nitropack'

// $fetch without the route types of Nitro: inferring them on every call
// makes the type check too deep for TypeScript
export type ApiClient = <T = unknown>(url: string, options?: NitroFetchOptions<string>) => Promise<T>

// `handlers` react to some statuses, such as a session that ended
export function createApiClient(handlers: Partial<Record<number, () => Promise<unknown>>>): ApiClient {
  return $fetch.create({
    async onResponseError({ response }) {
      await handlers[response.status]?.()
    }
  }) as ApiClient
}
