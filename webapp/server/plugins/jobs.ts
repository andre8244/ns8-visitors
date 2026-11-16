const INTERVAL_MS = 15 * 60 * 1000

// Runs after the database plugin (alphabetical order): migrations are done
export default defineNitroPlugin(() => {
  const run = () => {
    const now = new Date()
    for (const job of [autoCheckOut, deleteExpired]) {
      try {
        job(now)
      } catch (error) {
        console.error(`Job ${job.name} failed:`, error)
      }
    }
  }
  run()
  setInterval(run, INTERVAL_MS).unref()
})
