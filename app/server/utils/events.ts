import { z } from 'zod'

export const eventSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    startDate: dateField,
    endDate: dateField
  })
  .refine((value) => value.endDate >= value.startDate, { path: ['endDate'], message: 'end_before_start' })

export const MAX_GUESTS_PER_REQUEST = 2000
