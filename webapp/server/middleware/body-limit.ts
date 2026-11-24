// The server reads a request body whole into memory: a limit before any
// route, so a huge body cannot exhaust it. The largest legitimate body is a
// guest list of an event, well below
const MAX_BODY_BYTES = 1024 * 1024

export default defineEventHandler((event) => {
  const length = getRequestHeader(event, 'content-length')
  if (length !== undefined) {
    if (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES) {
      throw createError({ statusCode: 413, statusMessage: 'Request body too large' })
    }
  } else if (getRequestHeader(event, 'transfer-encoding')) {
    // A body of unknown length: browsers always send its length
    throw createError({ statusCode: 411, statusMessage: 'Length required' })
  }
})
