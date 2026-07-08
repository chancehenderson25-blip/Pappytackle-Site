import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  webServer: { command: 'npm run dev -- --port 4321', url: 'http://localhost:4321', reuseExistingServer: true, timeout: 30_000 },
  use: { baseURL: 'http://localhost:4321' },
});
