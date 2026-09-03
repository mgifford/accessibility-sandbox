import { defineConfig, devices } from '@playwright/test';

// Deterministic cross-browser config. Guidepup runners are standalone and are not
// part of this Playwright project (see guidepup/).
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: process.env.CI ? 'line' : 'list',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
