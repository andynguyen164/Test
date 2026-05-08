import { defineConfig, devices } from '@playwright/test';
import { fallbackRunId } from './utils/run-context';

// RUN_ID must be stable across reporters; provision before defineConfig reads it.
if (!process.env.RUN_ID) {
  process.env.RUN_ID = fallbackRunId();
}
const RUN_ID = process.env.RUN_ID!;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 2,
  workers: 1,
  timeout: 120_000,
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
  reporter: [
    ['html', { outputFolder: `reports/${RUN_ID}/playwright-html`, open: 'never' }],
    ['json', { outputFile: `reports/${RUN_ID}/test-results.json` }],
    ['list'],
  ],
  use: {
    baseURL: 'https://unstable.dev.beetrade.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    storageState: 'utils/.auth/state.json',
  },
  outputDir: `reports/${RUN_ID}/test-output`,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
