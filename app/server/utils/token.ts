import { createHash, randomBytes } from 'node:crypto'

// Only hashes of tokens and codes are stored: a database leak does not
// expose usable credentials
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url')
}
