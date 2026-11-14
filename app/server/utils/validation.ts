import { z } from 'zod'

export const nameField = z.string().trim().min(1).max(100)

export const personSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  company: nameField
})

export const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const idField = z.coerce.number().int().positive()

// LIKE pattern matching the text anywhere, with % and _ taken literally
export function containsPattern(text: string) {
  return `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}

// Local midnight of a YYYY-MM-DD day
export function startOfDay(date: string) {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}
