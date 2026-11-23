/**
 * Public site (wheelsExpertsWeb), signed out. Cars come from the CRM through
 * the API, so each test lists its own car and reads the CRM side back.
 *
 * Test-drive requests are rate limited per IP, so only WEB-07 and WEB-09
 * actually send one.
 */
import { test, expect } from "../fixtures"
import { randomPhone } from "../support/api"

const OPEN_LEADS = "deleted_at=is.null"

test.describe("public site", () => {
  test("@smoke WEB-01 home page loads without errors", async ({ page, consoleErrors }) => {
    const res = await page.goto("/")
    expect(res?.status()).toBe(200)
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible()
    expect(consoleErrors.filter((e) => e.startsWith("pageerror"))).toEqual([])
  })

  test("@smoke WEB-02 a listed car is public without its plate or owner", async ({ page, api, e2e }) => {
    const v = await api.createVehicle(e2e.prefix)
    const owner = await api.ok<{ fullName: string; phone: string }>("GET", `/owners/${v.ownerId}`)
    const res = await page.goto(`/cars/${v.id}`)
    expect(res?.status()).toBe(200)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    const html = await page.content()
    expect(html).not.toContain(v.registrationNumber)
    expect(html).not.toContain(owner.fullName)
    expect(html).not.toContain(owner.phone.replace(/^\+91/, ""))
  })

  test("@regression WEB-05 a car without a listed price shows price on request", async ({ page, api, e2e }) => {
    const v = await api.createVehicle(e2e.prefix)
    await page.goto(`/cars/${v.id}`)
    await expect(page.getByText("Price on request").first()).toBeVisible()
  })

  test("@regression WEB-06 a dropped car shows the not-found page", async ({ page, api, e2e }) => {
    const v = await api.createVehicle(e2e.prefix)
    expect((await api.setVehicleStatus(v.id, "dropped", "E2E: taken off the floor")).status).toBeLessThan(300)
    await page.goto(`/cars/${v.id}`)
    await expect(page.getByRole("heading", { name: "This car has found a new home." })).toBeVisible()
  })

  test("@regression WEB-06b an unknown car id shows the not-found page", async ({ page }) => {
    await page.goto("/cars/00000000-0000-4000-8000-000000000000")
    await expect(page.getByRole("heading", { name: "This car has found a new home." })).toBeVisible()
  })

  test("@regression WEB-04 filters with no results show an empty state", async ({ page }) => {
    await page.goto("/cars?priceMax=1")
    await expect(page.getByText("No cars match those filters.")).toBeVisible()
  })

  test("@regression WEB-08 invalid name and phone are caught before sending", async ({ page, api, e2e }) => {
    const v = await api.createVehicle(e2e.prefix)
    await page.goto(`/cars/${v.id}`)
    await page.getByRole("button", { name: "Location for test drive" }).first().click()
    let sent = false
    page.on("request", (r) => {
      if (r.method() === "POST" && /test-drive/.test(r.url())) sent = true
    })
    await page.getByLabel("Your name").fill("1")
    await page.getByLabel("Mobile number").fill("12345")
    await page.getByRole("button", { name: "Show me the location" }).click()
    await expect(page.getByText("Please tell us your name.")).toBeVisible()
    await expect(page.getByText("Enter a valid 10-digit mobile number.")).toBeVisible()
    expect(sent).toBe(false)
  })

  test("@smoke WEB-07 a test-drive request becomes a website lead; the car is linked; admins are told", async ({ page, api, e2e, db }) => {
    const v = await api.createVehicle(e2e.prefix)
    const phone = randomPhone().slice(3)
    const name = `Web Visitor ${e2e.prefix.replace(/[^a-z]/gi, "")}`
    await page.goto(`/cars/${v.id}`)
    await page.getByRole("button", { name: "Location for test drive" }).first().click()
    await page.getByLabel("Your name").fill(name)
    await page.getByLabel("Mobile number").fill(phone)
    await page.getByRole("button", { name: "Show me the location" }).click()
    await expect(page.getByRole("button", { name: "Show me the location" })).toBeHidden({ timeout: 20_000 })
    // Next.js always renders an empty route-announcer with role=alert; only alerts with text are errors.
    await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveCount(0)

    await expect.poll(async () => (await db.select("leads", `vehicle_id=eq.${v.id}&${OPEN_LEADS}`, "id")).length).toBe(1)
    const [lead] = await db.select("leads", `vehicle_id=eq.${v.id}&${OPEN_LEADS}`, "id,source,status")
    expect(lead.source).toMatch(/web/)
    await expect.poll(async () => (await db.one("vehicles", `id=eq.${v.id}`, "status")).status).toBe("linked")
    await expect
      .poll(async () => (await db.select("notifications", `type=eq.website_lead&entity_id=eq.${lead.id}`, "id")).length)
      .toBeGreaterThan(0)
  })

  test("@regression WEB-09 the same phone asking again for the same car doesn't duplicate the lead", async ({ page, api, e2e, db }) => {
    const v = await api.createVehicle(e2e.prefix)
    const phone = randomPhone().slice(3)
    const name = `Web Repeat ${e2e.prefix.replace(/[^a-z]/gi, "")}`
    for (let i = 0; i < 2; i++) {
      await page.goto(`/cars/${v.id}`)
      await page.getByRole("button", { name: "Location for test drive" }).first().click()
      await page.getByLabel("Your name").fill(name)
      await page.getByLabel("Mobile number").fill(phone)
      await page.getByRole("button", { name: "Show me the location" }).click()
      await expect(page.getByRole("button", { name: "Show me the location" })).toBeHidden({ timeout: 20_000 })
    }
    await expect.poll(async () => (await db.select("leads", `vehicle_id=eq.${v.id}&${OPEN_LEADS}`, "id")).length).toBe(1)
  })

  test("@regression WEB-12 the staff link points to the CRM sign-in", async ({ page }) => {
    await page.goto("/")
    const href = await page.getByRole("link", { name: "Staff login" }).getAttribute("href")
    expect(href).toMatch(/\/login$/)
  })

  test.describe("mobile", () => {
    test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })

    test("@regression WEB-11 home and car list don't scroll sideways at 375px", async ({ page }) => {
      for (const path of ["/", "/cars"]) {
        await page.goto(path)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, path).toBeLessThanOrEqual(1)
      }
    })
  })
})
