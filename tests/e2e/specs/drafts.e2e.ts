/**
 * Form drafts (IndexedDB, auto-restore) and live Indian-comma number inputs.
 *
 * A draft is what a salesperson typed before a phone call interrupted them:
 * it must survive the tab being reloaded, come back with a banner, and go away
 * once the form is submitted or discarded.
 */
import type { Page } from "@playwright/test"
import { test, expect, signIn } from "../fixtures"
import { randomPhone, randomPlate } from "../support/api"
import { dialog, pick, toast } from "../support/ui"

/** Keys in the draft store (IndexedDB, or the localStorage fallback). */
async function draftKeys(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const fromLocal = Object.keys(localStorage)
      .filter((k) => k.startsWith("autolead-draft:"))
      .map((k) => k.slice("autolead-draft:".length))
    const fromIdb = await new Promise<string[]>((resolve) => {
      const req = indexedDB.open("autolead-drafts")
      req.onerror = () => resolve([])
      req.onsuccess = () => {
        const db = req.result
        if (!db.objectStoreNames.contains("drafts")) return (db.close(), resolve([]))
        const all = db.transaction("drafts", "readonly").objectStore("drafts").getAllKeys()
        all.onsuccess = () => (db.close(), resolve(all.result.map(String)))
        all.onerror = () => (db.close(), resolve([]))
      }
    })
    return [...fromIdb, ...fromLocal]
  })
}

/** Waits until a draft whose key contains `fragment` has been written (saves are debounced). */
async function waitForDraft(page: Page, fragment: string) {
  await expect.poll(async () => (await draftKeys(page)).some((k) => k.includes(fragment))).toBe(true)
}

async function expectNoDraft(page: Page, fragment: string) {
  await expect.poll(async () => (await draftKeys(page)).some((k) => k.includes(fragment))).toBe(false)
}

async function openNewLead(page: Page) {
  await page.goto("/leads")
  await page.getByRole("button", { name: /New lead/ }).click()
  const d = dialog(page, "New lead")
  await expect(d).toBeVisible()
  return d
}

async function openAddVehicle(page: Page) {
  await page.goto("/vehicles")
  await page.getByRole("button", { name: /Add vehicle/ }).click()
  const s = dialog(page, "Add vehicle")
  await expect(s).toBeVisible()
  return s
}

const restoredBanner = (scope: ReturnType<typeof dialog>) => scope.getByRole("status").filter({ hasText: /Draft from .* restored/ })

test.describe("form drafts", () => {
  test("@smoke DRAFT-01 a half-filled new lead survives a reload and comes back with a banner", async ({ page, e2e }) => {
    const name = `Lead ${e2e.prefix} D01`
    const phone = randomPhone().slice(3)
    let d = await openNewLead(page)
    await d.getByLabel("Full name *").fill(name)
    await d.getByLabel("Phone *").fill(phone)
    await waitForDraft(page, "lead:create")

    // The call comes in; the tab is reloaded (or killed) and reopened.
    await page.reload()
    await expect(page.getByRole("button", { name: /New lead/ }).getByLabel("Draft saved")).toBeVisible()
    d = await openNewLead(page)
    await expect(restoredBanner(d)).toBeVisible()
    await expect(d.getByLabel("Full name *")).toHaveValue(name)
    await expect(d.getByLabel("Phone *")).toHaveValue(phone)
  })

  test("@smoke DRAFT-02 submitting clears the draft", async ({ page, e2e, db }) => {
    const name = `Lead ${e2e.prefix} D02`
    let d = await openNewLead(page)
    await d.getByLabel("Full name *").fill(name)
    await d.getByLabel("Phone *").fill(randomPhone().slice(3))
    await pick(d, "Source *", "Walk-in")
    await waitForDraft(page, "lead:create")
    await d.getByRole("button", { name: "Create now" }).click()
    await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible({ timeout: 30_000 })
    const id = page.url().split("/").pop()!
    expect((await db.select("leads", `id=eq.${id}`, "id")).length).toBe(1)
    await expectNoDraft(page, "lead:create")

    d = await openNewLead(page)
    await expect(restoredBanner(d)).toBeHidden()
    await expect(d.getByLabel("Full name *")).toHaveValue("")
  })

  test("@regression DRAFT-03 Save draft keeps the input, closes the form and marks the button", async ({ page, e2e }) => {
    const d = await openNewLead(page)
    await d.getByLabel("Full name *").fill(`Lead ${e2e.prefix} D03`)
    await d.getByRole("button", { name: "Save draft" }).click()
    await expect(toast(page, /Draft saved/)).toBeVisible()
    await expect(d).toBeHidden()
    await expect(page.getByRole("button", { name: /New lead/ }).getByLabel("Draft saved")).toBeVisible()
    await waitForDraft(page, "lead:create")
  })

  test("@regression DRAFT-04 Discard empties the form and deletes the draft", async ({ page, e2e }) => {
    let d = await openNewLead(page)
    await d.getByLabel("Full name *").fill(`Lead ${e2e.prefix} D04`)
    await waitForDraft(page, "lead:create")
    await page.reload()
    d = await openNewLead(page)
    await restoredBanner(d).getByRole("button", { name: "Discard" }).click()
    await expect(restoredBanner(d)).toBeHidden()
    await expect(d.getByLabel("Full name *")).toHaveValue("")
    await expectNoDraft(page, "lead:create")
    await page.reload()
    d = await openNewLead(page)
    await expect(restoredBanner(d)).toBeHidden()
  })

  test("@regression DRAFT-05 closing the form without saving keeps the draft", async ({ page, e2e }) => {
    const name = `Lead ${e2e.prefix} D05`
    let d = await openNewLead(page)
    await d.getByLabel("Full name *").fill(name)
    await page.keyboard.press("Escape")
    await expect(d).toBeHidden()
    await waitForDraft(page, "lead:create")
    d = await openNewLead(page)
    await expect(d.getByLabel("Full name *")).toHaveValue(name)
  })

  test("@regression DRAFT-06 the wizard step is restored with the draft", async ({ page, e2e }) => {
    let d = await openNewLead(page)
    await d.getByLabel("Full name *").fill(`Lead ${e2e.prefix} D06`)
    await d.getByLabel("Phone *").fill(randomPhone().slice(3))
    await pick(d, "Source *", "Walk-in")
    await d.getByRole("button", { name: "Continue" }).click()
    await d.getByLabel("Max budget (₹)").fill("650000")
    await expect(d.getByLabel("Max budget (₹)")).toHaveValue("6,50,000")
    await waitForDraft(page, "lead:create")
    await page.reload()
    d = await openNewLead(page)
    await expect(restoredBanner(d)).toBeVisible()
    await expect(d.getByLabel("Max budget (₹)")).toHaveValue("6,50,000")
  })

  test("@smoke DRAFT-07 a half-filled vehicle (make, model, plate) survives a reload", async ({ page, api }) => {
    test.setTimeout(90_000)
    const cat = await api.catalog()
    const reg = randomPlate()
    let s = await openAddVehicle(page)
    await pick(s, "Make *", cat.make.name)
    await pick(s, "Model *", cat.model.name)
    await s.getByLabel("Registration number *").fill(reg)
    await s.getByLabel("Km driven *").fill("42000")
    await waitForDraft(page, "vehicle:create")
    await page.reload()
    s = await openAddVehicle(page)
    await expect(restoredBanner(s)).toBeVisible()
    await expect(s.getByLabel("Registration number *")).toHaveValue(new RegExp(reg.slice(-4)))
    await expect(s.getByLabel("Km driven *")).toHaveValue("42,000")
    await expect(s.getByRole("button", { name: /Make \*/ }).or(s.getByRole("combobox", { name: /Make \*/ })).first()).toContainText(cat.make.name)
    await expect(s.getByRole("button", { name: /Model \*/ }).or(s.getByRole("combobox", { name: /Model \*/ })).first()).toContainText(cat.model.name)
  })

  test("@regression DRAFT-08 edit drafts belong to one record only", async ({ page, api, e2e }) => {
    const a = await api.createOwner(e2e.prefix)
    const b = await api.createOwner(e2e.prefix)
    await page.goto(`/owners/${a.id}`)
    await page.getByRole("button", { name: /^Edit/ }).click()
    let s = dialog(page, "Edit owner")
    await s.getByLabel("City").fill("Draftpur")
    await waitForDraft(page, a.id)
    await page.keyboard.press("Escape")

    await page.goto(`/owners/${b.id}`)
    await page.getByRole("button", { name: /^Edit/ }).click()
    s = dialog(page, "Edit owner")
    await expect(restoredBanner(s)).toBeHidden()
    await expect(s.getByLabel("City")).not.toHaveValue("Draftpur")
    await page.keyboard.press("Escape")

    await page.goto(`/owners/${a.id}`)
    await page.getByRole("button", { name: /^Edit/ }).click()
    s = dialog(page, "Edit owner")
    await expect(restoredBanner(s)).toBeVisible()
    await expect(s.getByLabel("City")).toHaveValue("Draftpur")
  })

  test("@regression DRAFT-09 signing out deletes that user's drafts", async ({ browser, e2e }) => {
    // Own session (salesperson) so signing out doesn't end the shared admin one.
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await ctx.newPage()
    try {
      await signIn(page, e2e.salesEmail, e2e.salesPassword)
      const d = await openNewLead(page)
      await d.getByLabel("Full name *").fill(`Lead ${e2e.prefix} D09`)
      await waitForDraft(page, `u:${e2e.salesId}:lead:create`)
      await page.keyboard.press("Escape")
      await page.getByRole("button", { name: "User menu" }).click()
      await page.getByRole("menuitem", { name: "Sign out", exact: true }).click()
      await expect(page).toHaveURL(/\/login/)
      await expectNoDraft(page, `u:${e2e.salesId}:`)
    } finally {
      await ctx.close()
    }
  })

  test("@regression DRAFT-10 another user signing in on the same browser can't see the draft", async ({ browser, e2e }) => {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await ctx.newPage()
    try {
      await signIn(page, e2e.salesEmail, e2e.salesPassword)
      const d = await openNewLead(page)
      await d.getByLabel("Full name *").fill(`Lead ${e2e.prefix} D10`)
      await waitForDraft(page, `u:${e2e.salesId}:lead:create`)
      // Session ends without a sign-out (cookie cleared), then the admin signs in.
      await ctx.clearCookies()
      await signIn(page, e2e.email, e2e.password)
      await expectNoDraft(page, `u:${e2e.salesId}:`)
      const d2 = await openNewLead(page)
      await expect(restoredBanner(d2)).toBeHidden()
      await expect(d2.getByLabel("Full name *")).toHaveValue("")
    } finally {
      await ctx.close()
    }
  })
})

test.describe("Indian-comma number inputs", () => {
  test("@smoke NUM-01 budget groups while typing and is saved as a plain number", async ({ page, e2e, db }) => {
    const name = `Lead ${e2e.prefix} N01`
    const d = await openNewLead(page)
    await d.getByLabel("Full name *").fill(name)
    await d.getByLabel("Phone *").fill(randomPhone().slice(3))
    await pick(d, "Source *", "Walk-in")
    await d.getByRole("button", { name: "Continue" }).click()
    const budget = d.getByLabel("Max budget (₹)")
    await budget.pressSequentially("1250000")
    await expect(budget).toHaveValue("12,50,000")
    await d.getByRole("button", { name: "Create now" }).click()
    await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible({ timeout: 30_000 })
    const id = page.url().split("/").pop()!
    expect(Number((await db.one("leads", `id=eq.${id}`, "budget")).budget)).toBe(1250000)
  })

  test("@regression NUM-02 grouping follows the Indian system", async ({ page }) => {
    const d = await openNewLead(page)
    await d.getByLabel("Full name *").fill("x")
    await d.getByLabel("Phone *").fill(randomPhone().slice(3))
    await pick(d, "Source *", "Walk-in")
    await d.getByRole("button", { name: "Continue" }).click()
    const budget = d.getByLabel("Max budget (₹)")
    for (const [typed, shown] of [
      ["999", "999"],
      ["1000", "1,000"],
      ["100000", "1,00,000"],
      ["123456789", "12,34,56,789"],
    ] as const) {
      await budget.fill(typed)
      await expect(budget).toHaveValue(shown)
    }
  })

  test("@regression NUM-03 editing a middle digit keeps the cursor in place", async ({ page }) => {
    const d = await openNewLead(page)
    await d.getByLabel("Full name *").fill("x")
    await d.getByLabel("Phone *").fill(randomPhone().slice(3))
    await pick(d, "Source *", "Walk-in")
    await d.getByRole("button", { name: "Continue" }).click()
    const budget = d.getByLabel("Max budget (₹)")
    await budget.pressSequentially("650000")
    await expect(budget).toHaveValue("6,50,000")
    // Put the caret after "6," and type 1 -> 61,50,000; next key lands after the 1.
    await budget.evaluate((el: HTMLInputElement) => el.setSelectionRange(2, 2))
    await page.keyboard.type("1")
    await expect(budget).toHaveValue("61,50,000")
    await page.keyboard.type("2")
    await expect(budget).toHaveValue("6,12,50,000")
  })

  test("@regression NUM-04 pasted amounts with ₹, commas and /- are cleaned", async ({ page }) => {
    const d = await openNewLead(page)
    await d.getByLabel("Full name *").fill("x")
    await d.getByLabel("Phone *").fill(randomPhone().slice(3))
    await pick(d, "Source *", "Walk-in")
    await d.getByRole("button", { name: "Continue" }).click()
    const budget = d.getByLabel("Max budget (₹)")
    await budget.fill("₹5,45,000/-")
    await expect(budget).toHaveValue("5,45,000")
    await budget.fill("abc12x34")
    await expect(budget).toHaveValue("1,234")
  })

  test("@regression NUM-05 vehicle km driven is grouped and saved as a number", async ({ page, api, e2e, db }) => {
    test.setTimeout(120_000)
    const cat = await api.catalog()
    const owner = await api.createOwner(e2e.prefix)
    const reg = randomPlate()
    const s = await openAddVehicle(page)
    await pick(s, "Make *", cat.make.name)
    await pick(s, "Model *", cat.model.name)
    await pick(s, "Variant *", cat.variant.name)
    await s.getByLabel("Registration number *").fill(reg)
    await s.getByLabel("Year *").fill("2019")
    await pick(s, "Fuel *", "Petrol")
    await pick(s, "Transmission *", "Manual")
    await s.getByLabel("Km driven *").pressSequentially("125000")
    await expect(s.getByLabel("Km driven *")).toHaveValue("1,25,000")
    await s.getByLabel("Previous owners *").fill("1")
    await s.getByRole("button", { name: "White", exact: true }).click()
    await s.getByRole("button", { name: "Continue" }).click()
    await s.getByRole("button", { name: "Continue" }).click()
    await s.getByLabel("Search owners").fill(owner.fullName)
    await s.getByRole("button", { name: new RegExp(owner.fullName) }).or(page.getByRole("option", { name: new RegExp(owner.fullName) })).first().click()
    await s.getByRole("button", { name: "Commission sale" }).click()
    await s.getByRole("button", { name: "Add vehicle" }).click()
    await expect(toast(page, "Vehicle added. Now add its photos.")).toBeVisible({ timeout: 30_000 })
    const row = await db.one("vehicles", `registration_number=eq.${reg}`, "km_driven")
    expect(Number(row.km_driven)).toBe(125000)
  })

  test("@regression NUM-06 listed price groups while typing and saves", async ({ page, api, e2e }) => {
    const v = await api.createVehicle(e2e.prefix)
    await page.goto(`/vehicles/${v.id}`)
    await page.locator("section[aria-label='Listed price']").getByRole("button").first().click()
    const d = dialog(page, "Listed price")
    const price = d.getByLabel("Price (₹)")
    await price.pressSequentially("545000")
    await expect(price).toHaveValue("5,45,000")
    await d.getByRole("button", { name: /save/i }).click()
    await expect(toast(page, "Listed price saved.")).toBeVisible()
    expect((await api.ok("GET", `/vehicles/${v.id}`)).listedPrice).toBe(545000)
  })
})
