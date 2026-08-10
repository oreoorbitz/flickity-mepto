import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: 'test',
  timeout: 10000,
  fullyParallel: true,
  use: { headless: true },
  reporter: 'list',
})
