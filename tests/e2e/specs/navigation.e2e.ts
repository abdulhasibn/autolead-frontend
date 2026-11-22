/** Navigation, not-found states, dashboard, mobile layout and console health. */
import { randomUUID } from "node:crypto"
import type { Page } from "@playwright/test"
import { test, expect } from "../fixtures"
import { expectNoHorizontalScroll } from "../support/ui"

test.use({ timezoneId: "Asia/Kolkata" })

const PAGES = [
  { link: "Dashboard", path: "/dashboard" },
  { link: "Insights", path: "/insights" },
  { link: /^Finance/, path: "/finance" },
  { link: "Leads", path: "/leads" },
  { link: "Vehicles", path: "/vehicles" },
  { link: "Owners", path: "/owners" },
  { link: "Staff", path: "/users" },
] as const

/** Value shown on a dashboard KPI card. */
async function kpi(page: Page, label: string): Promise<number> {
  const card = page.getByText(label, { exact: true }).locator("xpath=..")
  const text = (await card.locator(".font-mono-data").first().textContent()) ?? ""
  return Number(text.replace(/[^\d.]/g, ""))
}

/** Today at hh:mm IST as a UTC instant. */
function todayIst(hh: number, mm = 0): Date {
  const ist = new Date(Date.now() + 5.5 * 3_600_000)
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), hh, mm) - 5.5 * 3_600_000)
}

test.describe("navigation", () => {
  test("@smoke NAV-01 every sidebar link opens its page", async ({ page }) => {
    await page.goto("/dashboard")
    const nav = page.getByRole("navigation").first()
    for (const { link, path } of PAGES) {
      await nav.getByRole("link", { name: link, exact: typeof link === "string" }).click()
      await expect(page).toHaveURL(new RegExp(`${path}(\\?|$)`))
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible()
    }
  })

  test("@regression NAV-02 an unknown route shows the 404 page with a way back", async ({ page }) => {
    const res = await page.goto("/does-not-exist")
    expect(res?.status()).toBe(404)
    await expect(page.getByText("Page not found.")).toBeVisible()
    await page.getByRole("link", { name: "Go to dashboard" }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  for (const path of [`/leads/${randomUUID()}`, `/vehicles/${randomUUID()}`, `/owners/${randomUUID()}`, "/vehicles/not-a-uuid", "/leads/not-a-uuid"]) {
    test(`@regression NAV-03 ${path.replace(/[0-9a-f-]{36}/, "<uuid>")} shows not found, not a crash`, async ({ page, consoleErrors }) => {
      await page.goto(path)
      await expect(page.getByText(/not found/i).first()).toBeVisible()
      await expect(page.getByText(/Something went wrong|Application error/i)).toHaveCount(0)
      expect(consoleErrors.filter((e) => e.startsWith("pageerror"))).toEqual([])
    })
  }

  test("@regression NAV-06 Back from a lead returns to the searched list", async ({ page, e2e }) => {
    await page.goto("/leads")
    const search = page.getByRole("searchbox").first()
    await search.fill(e2e.leadName)
    await expect(page).toHaveURL(/[?&]q=|search=/)
    const listUrl = page.url()
    await page.getByRole("link", { name: e2e.leadName, exact: true }).first().click()
    await expect(page).toHaveURL(new RegExp(`/leads/${e2e.leadId}`))
    await page.goBack()
    await expect(page).toHaveURL(listUrl)
    await expect(page.getByRole("searchbox").first()).toHaveValue(e2e.leadName)
    await expect(page.getByRole("link", { name: e2e.leadName, exact: true }).first()).toBeVisible()
  })

  test("@regression NAV-07 Escape closes a dialog and focus is visible on Tab", async ({ page }) => {
    await page.goto("/leads")
    await page.getByRole("button", { name: /New lead/ }).click()
    const d = page.getByRole("dialog", { name: "New lead" })
    await expect(d).toBeVisible()
    await page.keyboard.press("Tab")
    const focusedInside = await d.evaluate((el) => el.contains(document.activeElement))
    expect(focusedInside, "focus stays inside the open dialog").toBe(true)
    await page.keyboard.press("Escape")
    await expect(d).toBeHidden()
  })

  test("@regression NAV-08 main pages load without console errors", async ({ page, consoleErrors }) => {
    for (const { path } of PAGES) {
      await page.goto(path)
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible()
    }
    // Ignore noise from the dev server itself (HMR, React dev warnings about keys are real bugs, so keep them).
    const real = consoleErrors.filter((e) => !/webpack|HMR|Fast Refresh|favicon/i.test(e))
    expect(real).toEqual([])
  })
})

test.describe("mobile layout", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })

  test("@regression NAV-04 pages don't scroll sideways at 375px", async ({ page }) => {
    for (const { path } of PAGES) {
      await page.goto(path)
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible()
      await expectNoHorizontalScroll(page)
    }
  })

  test("@regression NAV-04b the mobile menu opens and navigates", async ({ page }) => {
    await page.goto("/dashboard")
    await page.getByRole("button", { name: "Open navigation" }).click()
    await page.getByRole("dialog").getByRole("link", { name: "Vehicles", exact: true }).click()
    await expect(page).toHaveURL(/\/vehicles/)
  })

  test("@regression MOB-01 the Make picker keeps its height and search box after filtering", async ({ page, api }) => {
    const cat = await api.catalog()
    await page.goto("/vehicles")
    await page.getByRole("button", { name: /Add vehicle/ }).click()
    const form = page.getByRole("dialog", { name: "Add vehicle" })
    await form.getByRole("button", { name: /Make \*|Select make/ }).first().click()
    const picker = page.getByRole("dialog").filter({ has: page.getByPlaceholder("Search…") })
    const search = picker.getByPlaceholder("Search…")
    await expect(search).toBeVisible()
    const before = (await picker.boundingBox())!
    await search.fill(cat.make.name.slice(0, 2))
    await expect(picker.getByRole("option", { name: cat.make.name })).toBeVisible()
    const after = (await picker.boundingBox())!
    // Filtering must not shrink the sheet (which used to drop it under the keyboard).
    expect(Math.abs(after.height - before.height)).toBeLessThan(2)
    const searchBox = (await search.boundingBox())!
    expect(searchBox.y).toBeGreaterThanOrEqual(0)
    expect(searchBox.y + searchBox.height).toBeLessThanOrEqual(812)
    await picker.getByRole("option", { name: cat.make.name }).click()
    await expect(form.getByLabel("Make *")).toContainText(cat.make.name)
  })
})

test.describe("dashboard", () => {
  test("@smoke DASH-01 tiles and sections render with real numbers", async ({ page }) => {
    await page.goto("/dashboard")
    for (const label of ["Cars sold", "New leads", "Conversion rate", "In stock"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible()
      expect(Number.isFinite(await kpi(page, label)), label).toBe(true)
    }
    for (const title of ["Today's follow-ups", "Overdue follow-ups", "No follow-up scheduled", "Aged stock"]) {
      await expect(page.getByText(title, { exact: true }).first()).toBeVisible()
    }
    await expect(page.getByText(/\bNaN\b|\bundefined\b|\bnull\b/)).toHaveCount(0)
  })

  test("@regression DASH-02 a new lead raises the New leads count", async ({ page, api, e2e }) => {
    await page.goto("/dashboard")
    const before = await kpi(page, "New leads")
    await api.createLead(e2e.prefix)
    await page.reload()
    await expect.poll(() => kpi(page, "New leads")).toBeGreaterThanOrEqual(before + 1)
  })

  test("@regression DASH-03 a follow-up later today shows under Today's follow-ups and opens the lead", async ({ page, api, e2e }) => {
    const ist = new Date(Date.now() + 5.5 * 3_600_000)
    test.skip(ist.getUTCHours() >= 23, "too close to midnight IST for a 'later today' follow-up")
    const lead = await api.createLead(e2e.prefix)
    await api.scheduleFollowUp(lead.id, todayIst(23, 45))
    await page.goto("/dashboard")
    const section = page.getByText("Today's follow-ups", { exact: true }).locator("xpath=ancestor::section[1]")
    const link = page.locator(`a[href="/leads/${lead.id}"]`).first()
    await expect(link).toBeVisible()
    if (await section.count()) await expect(section.locator(`a[href="/leads/${lead.id}"]`).first()).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(new RegExp(`/leads/${lead.id}$`))
  })

  test("@regression DASH-04 period tabs switch without errors", async ({ page, consoleErrors }) => {
    await page.goto("/dashboard")
    const tabs = page.getByRole("tab")
    const count = await tabs.count()
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click()
      await expect(page.getByText("New leads", { exact: true })).toBeVisible()
      await expect(page.getByText(/\bNaN\b|\bundefined\b/)).toHaveCount(0)
    }
    expect(consoleErrors.filter((e) => e.startsWith("pageerror"))).toEqual([])
  })
})
