import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from '../database/schema'

export { schema }

let sqlite: Database.Database | undefined
let db: BetterSQLite3Database<typeof schema> | undefined

export function useDb() {
  if (!db) {
    const { databasePath } = useRuntimeConfig()
    // SQLite creates the file, not its directory
    mkdirSync(dirname(databasePath), { recursive: true })
    sqlite = new Database(databasePath)
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')
    // Overwrite deleted rows, so expired signatures do not stay in the file
    sqlite.pragma('secure_delete = ON')
    db = drizzle(sqlite, { schema })
  }
  return db
}

// The raw connection, for pragmas
export function useSqlite() {
  useDb()
  return sqlite!
}
