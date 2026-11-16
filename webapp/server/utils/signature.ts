const PREFIX = 'data:image/png;base64,'
const MAX_BYTES = 200 * 1024
const MAX_SIDE = 4000
const PNG_MAGIC = Buffer.from('89504e470d0a1a0a', 'hex')

// The signature drawn on the tablet, as a PNG image. Only the image is
// stored: no stroke timing or pressure, so it is not biometric data
export function parseSignature(dataUrl: string) {
  const invalid = () => createError({ statusCode: 400, statusMessage: 'Invalid signature image' })
  if (!dataUrl.startsWith(PREFIX)) throw invalid()
  const png = Buffer.from(dataUrl.slice(PREFIX.length), 'base64')
  if (png.length > MAX_BYTES || png.length < 33 || !png.subarray(0, 8).equals(PNG_MAGIC)) throw invalid()
  // IHDR chunk: width and height right after the magic bytes, length and type
  if (png.toString('ascii', 12, 16) !== 'IHDR') throw invalid()
  const width = png.readUInt32BE(16)
  const height = png.readUInt32BE(20)
  if (!width || !height || width > MAX_SIDE || height > MAX_SIDE) throw invalid()
  return png
}
