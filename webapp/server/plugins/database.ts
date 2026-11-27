import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

export default defineNitroPlugin(() => {
  migrate(useDb(), { migrationsFolder: useRuntimeConfig().migrationsPath })
  publishDefaultNotice()
})
