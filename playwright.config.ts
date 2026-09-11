import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000/hari-ini",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-320", use: { viewport: { width: 320, height: 740 } } },
    { name: "mobile-375", use: { viewport: { width: 375, height: 812 } } },
    { name: "mobile-414", use: { viewport: { width: 414, height: 896 } } },
    { name: "tablet-768", use: { viewport: { width: 768, height: 1024 } } },
  ],
});
