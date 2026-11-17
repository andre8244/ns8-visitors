import type { H3Event } from 'h3'

// In-memory sliding windows: enough for one application process
const hits = new Map<string, number[]>()

function recentHits(key: string, windowMs: number, now: number) {
  const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs)
  hits.set(key, recent)
  return recent
}

// Throws 429 when `key` has `max` hits in the window, with the seconds to
// wait in the Retry-After header of `event`. Does not count a hit.
export function checkLimit(key: string, max: number, windowMs: number, event?: H3Event) {
  const now = Date.now()
  const recent = recentHits(key, windowMs, now)
  if (recent.length >= max) {
    if (event) {
      const retryAfter = Math.ceil((recent[recent.length - max]! + windowMs - now) / 1000)
      setResponseHeader(event, 'Retry-After', Math.max(1, retryAfter))
    }
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }
}

export function countHit(key: string) {
  hits.set(key, [...(hits.get(key) ?? []), Date.now()])
}

// Removes the last hit of `key`
export function forgetHit(key: string) {
  hits.get(key)?.pop()
}

export function resetHits(key: string) {
  hits.delete(key)
}

// Counts every request: throws 429 when `key` has `max` hits in the window
export function rateLimit(key: string, max: number, windowMs: number, event?: H3Event) {
  checkLimit(key, max, windowMs, event)
  countHit(key)
}

// Forget the keys with no recent hits, so the map does not grow forever
setInterval(() => {
  const now = Date.now()
  for (const [key, times] of hits) {
    if (times.every((at) => now - at > 60 * 60_000)) hits.delete(key)
  }
}, 10 * 60_000).unref()
