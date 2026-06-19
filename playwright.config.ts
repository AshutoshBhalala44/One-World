import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for end-to-end browser tests.
 *
 * Set BASE_URL to point at any deployment (preview, published, custom domain).
 * Defaults to the published app.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "https://one-world.lovable.app",
    headless: true,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Safari/WebKit profile — verifies session persistence under
      // Safari's stricter storage semantics (e.g. ITP).
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
