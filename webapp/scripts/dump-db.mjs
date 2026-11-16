// Write a consistent copy of the live database to the path given as
// argument. Used by the NS8 module-dump-state script before each backup.
import { rmSync } from 'node:fs'
import Database from 'better-sqlite3'

const [source, target] = process.argv.slice(2)
if (!source || !target) {
  console.error('Usage: node dump-db.mjs <source.sqlite> <target.sqlite>')
  process.exit(1)
}

const db = new Database(source, { readonly: true, fileMustExist: true })
// VACUUM INTO fails on an existing file, such as one left by a failed run
rmSync(target, { force: true })
db.prepare('VACUUM INTO ?').run(target)
db.close()
