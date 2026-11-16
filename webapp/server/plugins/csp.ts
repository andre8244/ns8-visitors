import { randomBytes } from 'node:crypto'

// Content Security Policy: only the scripts of the application, with a
// nonce for the two inline scripts Nuxt adds to the page. Styles allow
// inline values, set by the components for positioning and transitions
export default defineNitroPlugin((nitroApp) => {
  if (import.meta.dev) {
    return
  }
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const nonce = randomBytes(16).toString('base64')
    const addNonce = (part: string) => part.replace(/<script\b/g, `<script nonce="${nonce}"`)
    html.head = html.head.map(addNonce)
    html.bodyPrepend = html.bodyPrepend.map(addNonce)
    html.body = html.body.map(addNonce)
    html.bodyAppend = html.bodyAppend.map(addNonce)
    setResponseHeader(
      event,
      'Content-Security-Policy',
      [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}'`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
      ].join('; ')
    )
  })
})
