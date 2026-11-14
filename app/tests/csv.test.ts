import { describe, expect, it } from 'vitest'
import { decodeCsvBytes, parseCsv, parseGuestsCsv, toCsv } from '../shared/utils/csv'

describe('parseCsv', () => {
  it('reads semicolons, quotes and line breaks in fields', () => {
    expect(parseCsv('a;"b;c";"d ""e"""\r\n"multi\nline";x;\n')).toEqual([
      ['a', 'b;c', 'd "e"'],
      ['multi\nline', 'x', '']
    ])
  })
  it('reads commas when the header uses them', () => {
    expect(parseCsv('nome,cognome\nMario,Rossi')).toEqual([
      ['nome', 'cognome'],
      ['Mario', 'Rossi']
    ])
  })
  it('skips empty lines', () => {
    expect(parseCsv('a;b\n\n;\nc;d')).toEqual([
      ['a', 'b'],
      ['c', 'd']
    ])
  })
})

describe('decodeCsvBytes', () => {
  it('reads UTF-8 with a byte order mark', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('Nicolò')])
    expect(decodeCsvBytes(bytes.buffer)).toBe('Nicolò')
  })
  it('falls back to Windows-1252', () => {
    expect(decodeCsvBytes(new Uint8Array([0x4e, 0x69, 0x63, 0x6f, 0x6c, 0xf2]).buffer)).toBe('Nicolò')
  })
})

describe('parseGuestsCsv', () => {
  it('maps the columns by header, in any order', () => {
    const result = parseGuestsCsv('Azienda;Cognome;Nome\nACME;Rossi;Mario\n;Bianchi;Luca\nACME;Verdi;' + 'x'.repeat(101))
    expect(result).toEqual({
      guests: [{ firstName: 'Mario', lastName: 'Rossi', company: 'ACME' }],
      errors: [
        { line: 3, reason: 'missing_value' },
        { line: 4, reason: 'too_long' }
      ]
    })
  })
  it('rejects a header without the needed columns', () => {
    expect(parseGuestsCsv('Nome;Cognome\nMario;Rossi')).toBeNull()
  })
})

describe('toCsv', () => {
  it('quotes separators and neutralizes formulas', () => {
    expect(toCsv([['a;b', '=SUM(A1)', '-1', 'say "hi"']])).toBe('﻿"a;b";\'=SUM(A1);\'-1;"say ""hi"""\r\n')
  })
})
