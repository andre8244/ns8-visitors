// Against cross-site request forgery, beyond the SameSite cookie: a page of
// another origin, even of a sibling subdomain (same site for the cookie),
// cannot make the browser change data with the session of the user.
// Browsers send Sec-Fetch-Site, older ones at least Origin; clients that
// send neither are not browsers, and have no cookie of the user
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export default defineEventHandler((event) => {
  if (SAFE_METHODS.has(event.method) || !event.path.startsWith('/api/')) {
    return
  }
  const fetchSite = getRequestHeader(event, 'sec-fetch-site')
  if (fetchSite) {
    if (fetchSite !== 'same-origin') {
      throw createError({ statusCode: 403, statusMessage: 'Cross-origin request' })
    }
    return
  }
  const origin = getRequestHeader(event, 'origin')
  if (origin && originHost(origin) !== getRequestHost(event)) {
    throw createError({ statusCode: 403, statusMessage: 'Cross-origin request' })
  }
})

function originHost(origin: string) {
  try {
    return new URL(origin).host
  } catch {
    return null
  }
}
