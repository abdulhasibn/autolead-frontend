import { defineConfig, devices } from "@playwright/test"
import { AUTH_FILE } from "./tests/e2e/paths"

const isCI = !!process.env.CI
const baseURL = process.env.BASE_URL ?? "http://localhost:3001"

// Locally Playwright's bundled Chromium can be mismatched with the OS; use the
// installed Chrome there. CI installs bundled chromium (`playwright install`).
const browser = isCI ? {} : { channel: "chrome" as const }

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["**/*.e2e.ts", "**/*.setup.ts"],
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [["blob"], ["list"]] : [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: { ...devices["Desktop Chrome"], ...browser },
    },
    {
      name: "chromium",
      testMatch: /.*\.e2e\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], ...browser, storageState: AUTH_FILE },
    },
  ],
  // Serve the built app. Skipped when BASE_URL points at an already-running
  // deployment. Locally an existing server on :3001 is reused.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: isCI ? "pnpm build && pnpm start --port 3001" : "pnpm exec next dev --port 3001",
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 240_000,
        stdout: "pipe",
        stderr: "pipe",
      },
})
