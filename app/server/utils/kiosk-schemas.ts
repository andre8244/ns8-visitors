import { z } from 'zod'

export const signedSchema = z.object({
  noticeVersionId: z.number().int().positive(),
  signature: z.string().max(400_000)
})

export const searchQuerySchema = z.object({ q: z.string().trim().max(100) })
