import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: { name: 'unit', include: ['tests/unit/**/*.test.ts'] }
      },
      {
        // Runs the built server (.output): build first with `pnpm build`
        test: {
          name: 'api',
          include: ['tests/api/**/*.test.ts'],
          testTimeout: 20_000,
          hookTimeout: 30_000
        }
      }
    ]
  }
})
