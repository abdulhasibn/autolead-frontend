import { defineConfig, devices } from "@playwright/test"
import { AUTH_FILE } from "./tests/e2e/paths"
import { loadLocalEnv } from "./tests/e2e/support/env"

loadLocalEnv()

const isCI = !!process.env.CI
const baseURL = process.env.BASE_URL ?? "http://localhost:3001"
const siteURL = process.env.SITE_URL ?? "http://localhost:3002"
// AUTH-16 needs a second CRM server whose API is unreachable. It reuses the
// production build, so it runs on CI (always built) or locally after
// `pnpm build` with E2E_API_DOWN=1.
const apiDownURL = "http://localhost:3011"
const runApiDown = isCI || !!process.env.E2E_API_DOWN

// Locally Playwright's bundled Chromium can be mismatched with the OS; use the
// installed Chrome there. CI installs bundled chromium (`playwright install`).
const browser = isCI ? {} : { channel: "chrome" as const }
const desktop = { ...devices["Desktop Chrome"], ...browser }

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["**/*.e2e.ts", "**/*.setup.ts"],
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: isCI ? [["blob"], ["list"]] : [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/, use: desktop },
    {
      // CRM, signed in as the run's admin.
      name: "chromium",
      testMatch: /specs\/(?!site|finance|api-down).*\.e2e\.ts/,
      dependencies: ["setup"],
      use: { ...desktop, storageState: AUTH_FILE },
    },
    {
      // Finance shares one vault and its lockout counter: one test at a time.
      name: "finance",
      testMatch: /specs\/finance\.e2e\.ts/,
      dependencies: ["setup"],
      fullyParallel: false,
      use: { ...desktop, storageState: AUTH_FILE },
    },
    {
      // Public site (wheelsExpertsWeb); signed out.
      name: "site",
      testMatch: /specs\/site\.e2e\.ts/,
      dependencies: ["setup"],
      fullyParallel: false,
      use: { ...desktop, baseURL: siteURL },
    },
    ...(runApiDown
      ? [
          {
            name: "api-down",
            testMatch: /specs\/api-down\.e2e\.ts/,
            use: { ...desktop, baseURL: apiDownURL },
          },
        ]
      : []),
  ],
  // Servers. Skipped when BASE_URL points at an already-running deployment.
  // Locally, servers already running on these ports are reused.
  webServer: process.env.BASE_URL
    ? undefined
    : [
        {
          command: isCI ? "pnpm build && pnpm start --port 3001" : "pnpm exec next dev --port 3001",
          url: baseURL,
          reuseExistingServer: !isCI,
          timeout: 240_000,
          stdout: "pipe",
          stderr: "pipe",
        },
        {
          command: `pnpm --dir ${process.env.SITE_DIR ?? "../wheelsExpertsWeb"} ${isCI ? "start --port 3002" : "dev"}`,
          url: siteURL,
          reuseExistingServer: !isCI,
          timeout: 240_000,
          stdout: "pipe",
          stderr: "pipe",
        },
        ...(runApiDown
          ? [
              {
                command: "pnpm start --port 3011",
                url: apiDownURL,
                reuseExistingServer: !isCI,
                timeout: 240_000,
                env: {
                  API_BASE_URL: "http://localhost:9",
                  NEXT_PUBLIC_API_BASE_URL: "http://localhost:9",
                  AUTH_URL: apiDownURL,
                },
              },
            ]
          : []),
      ],
})
