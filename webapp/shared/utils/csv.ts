// CSV files written by spreadsheets, Excel included: comma or semicolon
// separators, quoted fields, UTF-8 or Windows-1252 encoding

// Excel saves "CSV (separated by semicolons)" in Windows-1252 and
// "CSV UTF-8" with a byte order mark
export function decodeCsvBytes(bytes: ArrayBuffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '')
  } catch {
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

// The separator that splits the first line in more fields
function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const count = (char: string) => firstLine.split(char).length
  return count(';') > count(',') ? ';' : ','
}

export function parseCsv(text: string): string[][] {
  const delimiter = detectDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === delimiter) {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') {
        i++
      }
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  // Skip empty lines
  return rows.filter((r) => r.some((value) => value.trim()))
}

// A spreadsheet runs a cell that starts with one of these as a formula
const FORMULA_START = /^[=+\-@\t\r]/

export function toCsv(rows: (string | null | undefined)[][], delimiter = ';') {
  const escape = (value: string | null | undefined) => {
    let text = value ?? ''
    if (FORMULA_START.test(text)) {
      text = `'${text}`
    }
    return /[";\n\r,]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  // Byte order mark: Excel opens the file as UTF-8
  return '﻿' + rows.map((row) => row.map(escape).join(delimiter)).join('\r\n') + '\r\n'
}

export type CsvGuest = { firstName: string; lastName: string; company: string }

export type CsvGuestError = {
  // Line number in the file, starting from 1
  line: number
  reason: 'missing_value' | 'too_long'
}

const HEADERS: Record<keyof CsvGuest, string[]> = {
  firstName: ['nome', 'first name', 'firstname', 'name'],
  lastName: ['cognome', 'last name', 'lastname', 'surname'],
  company: ['azienda', 'company', 'societa', 'ditta']
}

const MAX_LENGTH = 100

// Guests from a CSV file with a header line naming the columns, in any order.
// Returns null when the header lacks a column
export function parseGuestsCsv(text: string): { guests: CsvGuest[]; errors: CsvGuestError[] } | null {
  const [header, ...rows] = parseCsv(text)
  if (!header) {
    return null
  }
  const normalized = header.map((name) =>
    name
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()
  )
  const columns = {} as Record<keyof CsvGuest, number>
  for (const key of Object.keys(HEADERS) as (keyof CsvGuest)[]) {
    const index = normalized.findIndex((name) => HEADERS[key].includes(name))
    if (index < 0) {
      return null
    }
    columns[key] = index
  }

  const guests: CsvGuest[] = []
  const errors: CsvGuestError[] = []
  rows.forEach((row, index) => {
    const guest = {
      firstName: (row[columns.firstName] ?? '').trim(),
      lastName: (row[columns.lastName] ?? '').trim(),
      company: (row[columns.company] ?? '').trim()
    }
    const values = Object.values(guest)
    // The header is line 1
    const line = index + 2
    if (values.some((value) => !value)) {
      errors.push({ line, reason: 'missing_value' })
    } else if (values.some((value) => value.length > MAX_LENGTH)) {
      errors.push({ line, reason: 'too_long' })
    } else {
      guests.push(guest)
    }
  })
  return { guests, errors }
}
