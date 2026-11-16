// In-memory sliding window: enough for one application process
const hits = new Map<string, number[]>()

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }
  recent.push(now)
  hits.set(key, recent)
}

// Forget the keys with no recent hits, so the map does not grow forever
setInterval(() => {
  const now = Date.now()
  for (const [key, times] of hits) {
    if (times.every((at) => now - at > 10 * 60_000)) hits.delete(key)
  }
}, 10 * 60_000).unref()
