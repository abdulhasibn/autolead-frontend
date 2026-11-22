import { test as base, expect, type Page } from "@playwright/test"
import { Api } from "./support/api"
import { bugUrls } from "./support/bugs"
import * as db from "./support/db"

export interface E2EData {
  prefix: string
  userId: string
  email: string
  password: string
  userName: string
  salesId: string
  salesEmail: string
  salesPassword: string
  salesName: string
  leadId: string
  leadName: string
  leadPhone: string
  financeKey: string
}

function need(name: string): string {
  const v = process.env[name]
  if (v === undefined) throw new Error(`E2E: ${name} not set (did globalSetup run?)`)
  return v
}

function readData(): E2EData {
  return {
    prefix: need("E2E_PREFIX"),
    userId: need("E2E_USER_ID"),
    email: need("E2E_USER_EMAIL"),
    password: need("E2E_USER_PASSWORD"),
    userName: need("E2E_USER_NAME"),
    salesId: need("E2E_SALES_ID"),
    salesEmail: need("E2E_SALES_EMAIL"),
    salesPassword: need("E2E_SALES_PASSWORD"),
    salesName: need("E2E_SALES_NAME"),
    leadId: need("E2E_LEAD_ID"),
    leadName: need("E2E_LEAD_NAME"),
    leadPhone: need("E2E_LEAD_PHONE"),
    financeKey: need("E2E_FINANCE_KEY"),
  }
}

/**
 * Marks the running test as the regression check for filed bug(s). The test
 * still asserts the correct behaviour, so it fails until the bug is fixed;
 * the annotation puts the GitHub issue next to the failure in the report.
 */
export function bug(...ids: string[]): void {
  for (const url of bugUrls(...ids)) {
    base.info().annotations.push({ type: "issue", description: url })
  }
}

/** Placeholder for a case whose screen does not exist yet (enhancement issue). */
export function missingUi(...ids: string[]): void {
  bug(...ids)
  base.fixme(true, `UI not built yet: ${bugUrls(...ids).join(", ")}`)
}

/** Sign in through the login form (for tests that need their own session). Admins land on the dashboard, salespeople on leads. */
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login")
  await page.getByLabel("Email address").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/(dashboard|leads)/)
}

type TestFixtures = {
  /** Uncaught page errors and console errors collected during the test. */
  consoleErrors: string[]
}
type WorkerFixtures = {
  e2e: E2EData
  api: Api
  salesApi: Api
  db: typeof db
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  e2e: [async ({}, provide) => provide(readData()), { scope: "worker" }],
  api: [
    async ({ e2e }, provide) => provide(await Api.login(e2e.email, e2e.password)),
    { scope: "worker" },
  ],
  salesApi: [
    async ({ e2e }, provide) => provide(await Api.login(e2e.salesEmail, e2e.salesPassword)),
    { scope: "worker" },
  ],
  db: [async ({}, provide) => provide(db), { scope: "worker" }],
  context: async ({ context }, provide) => {
    // Test visits must not land in the public site's visitor analytics
    // (web_sessions / web_events). Drop the beacon and its fetch fallback.
    await context.addInitScript(() => {
      const original = navigator.sendBeacon?.bind(navigator)
      if (!original) return
      navigator.sendBeacon = (url, data) => (String(url).includes("/public/events") ? true : original(url, data))
    })
    await context.route("**/public/events", (route) => route.fulfill({ status: 204, body: "" }))
    await provide(context)
  },
  page: async ({ page }, provide) => {
    // `next dev` floats its dev-tools badge, and dev builds float the
    // TanStack Query devtools button, over the bottom corners where dialogs
    // keep their primary button. Hide both (test-side only).
    await page.addInitScript(() => {
      const hide = () => {
        const style = document.createElement("style")
        style.textContent = "nextjs-portal, .tsqd-parent-container { display: none !important; }"
        document.head.appendChild(style)
      }
      if (document.head) hide()
      else document.addEventListener("DOMContentLoaded", hide)
    })
    await provide(page)
  },
  consoleErrors: async ({ page }, provide) => {
    const errors: string[] = []
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`))
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`console: ${m.text()}`)
    })
    await provide(errors)
  },
})

export { expect }
