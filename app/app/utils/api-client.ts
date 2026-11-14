import type { NitroFetchOptions } from 'nitropack'

// $fetch without the route types of Nitro: inferring them on every call
// makes the type check too deep for TypeScript
export type ApiClient = <T = unknown>(url: string, options?: NitroFetchOptions<string>) => Promise<T>

export function createApiClient(onUnauthorized: () => Promise<void>, statuses: number[]): ApiClient {
  return $fetch.create({
    async onResponseError({ response }) {
      if (statuses.includes(response.status)) {
        await onUnauthorized()
      }
    }
  }) as ApiClient
}
