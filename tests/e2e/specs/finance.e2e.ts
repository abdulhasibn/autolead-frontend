import type { Page } from "@playwright/test"
import { test, expect, bug } from "../fixtures"
import type { Api } from "../support/api"
import { register } from "../support/db"
import { dialog, toast } from "../support/ui"

// One vault, one lockout counter: the "finance" project runs this file in
// order in one worker (fullyParallel: false). Not "serial" mode, because a
// test that fails on a known bug must not skip the rest.

const today = () => new Date().toISOString().slice(0, 10)

async function unlock(page: Page, key: string) {
  await page.goto("/finance/unlock")
  await page.getByLabel("Finance key").fill(key)
  await page.getByRole("button", { name: "Unlock" }).click()
  await expect(page.getByText(/Unlocked · locks at/)).toBeVisible({ timeout: 30_000 })
}

async function finSession(api: Api, key: string): Promise<Record<string, string>> {
  const { sessionToken } = await api.ok("POST", "/finance/unlock", { financeKey: key })
  return { "X-Finance-Session": sessionToken }
}

/** "₹17,51,000" / "+₹11,87,500" / "−₹5,000" -> number */
function rupees(text: string | null): number {
  const t = (text ?? "").replace(/[₹,\s+]/g, "").replace("−", "-")
  return Number(t)
}

test.describe("finance", () => {
  test.beforeEach(({ e2e }) => {
    test.skip(!e2e.financeKey, "needs E2E_FINANCE_KEY (shared vault) or a fresh vault")
  })

  test("@smoke FIN-01 finance while locked shows the unlock screen", async ({ page }) => {
    await page.goto("/finance")
    await expect(page).toHaveURL(/\/finance\/unlock/)
    await expect(page.getByRole("heading", { name: "Unlock finance", level: 1 })).toBeVisible()
  })

  test("@smoke FIN-02 the correct key unlocks finance", async ({ page, e2e }) => {
    await unlock(page, e2e.financeKey)
    await page.goto("/finance")
    await expect(page.getByRole("navigation", { name: "Finance sections" })).toBeVisible()
  })

  test("@regression FIN-03 a wrong key shows a clear error, nothing in the URL", async ({ page, e2e }) => {
    bug("SEC-3") // should also say how many tries are left
    await page.goto("/finance/unlock")
    const wrong = "FK-AAAA-BBBB-CCCC-DDDD-EEEE-FFFF"
    await page.getByLabel("Finance key").fill(wrong)
    await page.getByRole("button", { name: "Unlock" }).click()
    await expect(page.getByText("That key didn't open the vault.")).toBeVisible()
    expect(page.url()).not.toContain("AAAA")
    await expect(page.getByText(/\d+ (tries|attempts) left/i)).toBeVisible()
    // Reset the shared counter with a good unlock.
    await unlock(page, e2e.financeKey)
  })

  test("@regression FIN-04 key with spaces and lower case is accepted", async ({ page, e2e }) => {
    const messy = `  ${e2e.financeKey.toLowerCase().replace(/-/g, " ")}  `
    await unlock(page, messy)
  })

  test("@smoke FIN-05 lock returns to unlock; Back shows no money", async ({ page, e2e }) => {
    await unlock(page, e2e.financeKey)
    await page.goto("/finance/entries")
    await expect(page.getByText("Money in").first()).toBeVisible()
    await page.getByRole("button", { name: "Lock", exact: true }).click()
    await expect(page).toHaveURL(/\/finance\/unlock/)
    await page.goBack()
    await expect(page.getByText("Money in")).toHaveCount(0)
  })

  test("@smoke FIN-06 add expense and income; totals move by the amounts", async ({ page, e2e, db }) => {
    await unlock(page, e2e.financeKey)
    await page.goto("/finance/entries")
    const moneyOut = page.getByRole("term").filter({ hasText: "Money out" }).locator("xpath=following-sibling::dd[1]")
    const moneyIn = page.getByRole("term").filter({ hasText: "Money in" }).locator("xpath=following-sibling::dd[1]")
    await expect(moneyOut).toBeVisible()
    const outBefore = rupees(await moneyOut.textContent())
    const inBefore = rupees(await moneyIn.textContent())

    await page.getByRole("button", { name: "Add expense" }).click()
    let d = dialog(page, "Add expense")
    await d.getByLabel("Amount").fill("1234")
    await d.getByRole("group", { name: "Tags" }).getByRole("button", { name: "Fuel" }).click()
    await d.getByLabel("Paid to (optional)").fill(`Party ${e2e.prefix}`)
    await d.getByLabel("Note (optional)").fill(`Note ${e2e.prefix} expense`)
    await d.getByRole("button", { name: "Add", exact: true }).click()
    await expect(d).toBeHidden()

    await page.getByRole("button", { name: "Add income" }).click()
    d = dialog(page, "Add income")
    await d.getByLabel("Amount").fill("4321")
    await d.getByLabel("Note (optional)").fill(`Note ${e2e.prefix} income`)
    await d.getByRole("button", { name: "Add", exact: true }).click()
    await expect(d).toBeHidden()

    await expect.poll(async () => rupees(await moneyOut.textContent())).toBe(outBefore + 1234)
    await expect.poll(async () => rupees(await moneyIn.textContent())).toBe(inBefore + 4321)
    await expect(page.getByText(`Note ${e2e.prefix} expense`).first()).toBeVisible()
    expect(await db.select("finance_entries", `recorded_by=eq.${e2e.userId}&deleted_at=is.null`, "id")).toHaveLength(2)
  })

  for (const amount of ["0", "-5", "abc"]) {
    test(`@regression FIN-07 amount "${amount}" is rejected`, async ({ page, e2e }) => {
      await unlock(page, e2e.financeKey)
      await page.goto("/finance/entries")
      await page.getByRole("button", { name: "Add expense" }).click()
      const d = dialog(page, "Add expense")
      await d.getByLabel("Amount").fill(amount)
      await d.getByRole("button", { name: "Add", exact: true }).click()
      await expect(d).toBeVisible()
      await expect(d.getByLabel("Amount")).toHaveAttribute("aria-invalid", "true")
    })
  }

  test("@regression FIN-07 party > 120, note > 1000 and 11 tags are refused (API)", async ({ api, e2e }) => {
    const fin = await finSession(api, e2e.financeKey)
    const tags = (await api.ok("GET", "/finance/tags", undefined, fin)) as { id: string }[]
    const base = { kind: "expense", amount: 100, entryDate: today(), vehicleId: null, purpose: null }
    for (const extra of [{ party: "p".repeat(121) }, { note: "n".repeat(1001) }, { tagIds: Array(11).fill(tags[0]!.id) }]) {
      const res = await api.call("POST", "/finance/entries", { ...base, ...extra }, fin)
      expect(res.status, JSON.stringify(Object.keys(extra))).toBe(422)
    }
  })

  test("@regression FIN-08 edit a business (no-car) entry", async ({ page, api, e2e }) => {
    bug("FN-1")
    const fin = await finSession(api, e2e.financeKey)
    const note = `Note ${e2e.prefix} edit-me`
    await api.ok("POST", "/finance/entries", { kind: "expense", amount: 777, entryDate: today(), vehicleId: null, purpose: null, note }, fin)
    await unlock(page, e2e.financeKey)
    await page.goto("/finance/entries")
    const row = page.getByRole("row").filter({ hasText: note })
    await row.getByRole("button", { name: "Entry actions" }).click()
    await page.getByRole("menuitem", { name: "Edit" }).click()
    const d = dialog(page, "Edit entry")
    await d.getByLabel("Amount").fill("888")
    await d.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Request validation failed")).toHaveCount(0)
    await expect(d).toBeHidden()
    await expect(row.getByText("−₹888")).toBeVisible()
  })

  // MF-7 said there was no delete control; there is one (Entry actions >
  // Delete). This test keeps it working.
  test("@regression FIN-08b delete an entry (soft)", async ({ page, api, e2e, db }) => {
    const fin = await finSession(api, e2e.financeKey)
    const note = `Note ${e2e.prefix} delete-me`
    const entry = await api.ok("POST", "/finance/entries", { kind: "expense", amount: 555, entryDate: today(), vehicleId: null, purpose: null, note }, fin)
    await unlock(page, e2e.financeKey)
    await page.goto("/finance/entries")
    const row = page.getByRole("row").filter({ hasText: note })
    await row.getByRole("button", { name: "Entry actions" }).click()
    await page.getByRole("menuitem", { name: "Delete" }).click()
    const confirm = page.getByRole("alertdialog")
    await confirm.getByRole("button", { name: /delete/i }).click()
    await expect(page.getByRole("row").filter({ hasText: note })).toHaveCount(0)
    await expect
      .poll(async () => (await db.one("finance_entries", `id=eq.${entry.id}`, "deleted_at")).deleted_at, { timeout: 15_000 })
      .not.toBeNull()
    await page.reload()
    await expect(page.getByRole("row").filter({ hasText: note })).toHaveCount(0)
  })

  test("@regression FIN-09 inverted or > 366-day ranges are refused", async ({ api, e2e }) => {
    const fin = await finSession(api, e2e.financeKey)
    expect((await api.call("GET", "/finance/entries?from=2026-11-10&to=2026-11-01", undefined, fin)).status).toBe(422)
    expect((await api.call("GET", "/finance/entries?from=2025-01-01&to=2026-11-01", undefined, fin)).status).toBe(422)
  })

  test("@regression FIN-10 tag create, rename, archive; archived tag not offered", async ({ page, api, e2e }) => {
    const name = `T${e2e.prefix.slice(-6)}`
    await unlock(page, e2e.financeKey)
    await page.goto("/finance/settings")
    await page.getByPlaceholder("New tag, e.g. Detailing").fill(name)
    await page.getByRole("button", { name: "Add tag" }).click()
    await expect(toast(page, `Tag “${name}” added.`)).toBeVisible()
    const fin = await finSession(api, e2e.financeKey)
    const created = ((await api.ok("GET", "/finance/tags?includeArchived=true", undefined, fin)) as { id: string; name: string }[]).find((t) => t.name === name)
    if (created) register("finance_tag", created.id)

    await page.getByRole("button", { name: `Edit ${name}` }).click()
    await page.locator('input[aria-label="Tag name"]').fill(`${name}R`)
    await page.getByRole("button", { name: "Save", exact: true }).click()
    const renamed = page.getByRole("button", { name: `Edit ${name}R` })
    await expect(renamed).toBeVisible()
    await renamed.locator("xpath=..").getByRole("button", { name: "Archive" }).click()
    await expect(renamed).toBeHidden()

    await page.goto("/finance/entries")
    await page.getByRole("button", { name: "Add expense" }).click()
    await expect(dialog(page, "Add expense").getByRole("button", { name: `${name}R` })).toHaveCount(0)
    const res = await api.call("POST", "/finance/entries", { kind: "expense", amount: 10, entryDate: today(), vehicleId: null, purpose: null, tagIds: [created!.id] }, fin)
    expect(res.status).toBe(422)
  })

  test("@regression FIN-11 tag names are unique ignoring case", async ({ page, e2e }) => {
    await unlock(page, e2e.financeKey)
    await page.goto("/finance/settings")
    await page.getByPlaceholder("New tag, e.g. Detailing").fill("fUEL")
    await page.getByRole("button", { name: "Add tag" }).click()
    await expect(page.getByText("Another tag already has that name.")).toBeVisible()
  })

  test("@regression FIN-12 car deal: commission and prices save", async ({ page, api, e2e }) => {
    bug("VAL-4") // minimum above listed price should warn
    const v = await api.createVehicle(e2e.prefix)
    await api.ok("PUT", `/vehicles/${v.id}/listed-price`, { listedPrice: 485000 })
    await unlock(page, e2e.financeKey)
    await page.goto(`/vehicles/${v.id}?tab=money`)
    const deal = page.getByRole("region", { name: "Deal" }).or(page.locator("section[aria-label='Deal']"))
    await deal.getByRole("button", { name: /Add deal|Edit/ }).click()
    const form = page.getByRole("form", { name: "Edit deal" })
    await form.getByLabel("Our commission (% of sale price)").fill("3.5")
    await form.getByLabel("Owner’s expected price (optional)").fill("300000")
    await form.getByLabel("Minimum selling price (optional)").fill("900000")
    await form.getByRole("button", { name: /save/i }).click()
    const fin = await finSession(api, e2e.financeKey)
    await expect.poll(async () => (await api.ok("GET", `/finance/vehicles/${v.id}`, undefined, fin)).deal?.commissionPercent).toBe(3.5)
    // Minimum (9L) above the listed price (4.85L) deserves a warning.
    await expect(page.getByText(/above the listed price|higher than the listed/i)).toBeVisible()
  })

  async function bookedCar(api: Api, e2e: { prefix: string; financeKey: string }) {
    const v = await api.createVehicle(e2e.prefix)
    const lead = await api.createLead(e2e.prefix, { vehicleId: v.id })
    await api.ok("POST", `/leads/${lead.id}/status`, { status: "booking_confirmed" })
    const fin = await finSession(api, e2e.financeKey)
    await api.ok("PUT", `/finance/vehicles/${v.id}`, { commissionPercent: 2 }, fin)
    return { v, lead, fin }
  }

  async function recordSaleUI(page: Page, price: string) {
    const sale = page.locator("section[aria-label='Sale']")
    await sale.getByRole("button", { name: "Record sale" }).click()
    const form = page.getByRole("form", { name: "Record sale" })
    // With one booked lead the buyer is shown as text; with several, pick one.
    const buyer = form.getByRole("radiogroup", { name: "Buyer's lead" })
    if (await buyer.count()) await buyer.getByRole("radio").first().check()
    await form.getByLabel("Finalised price").fill(price)
    await form.getByRole("button", { name: "Fully paid" }).or(form.getByRole("radio", { name: "Fully paid" })).click()
    await form.getByRole("button", { name: "Save sale" }).click()
    await expect(toast(page, /The lead is converted and the car marked sold/)).toBeVisible({ timeout: 30_000 })
    return sale
  }

  test("@smoke FIN-13 record a sale against the booked lead, then remove it", async ({ page, api, e2e, db }) => {
    const { v, lead } = await bookedCar(api, e2e)
    await unlock(page, e2e.financeKey)
    await page.goto(`/vehicles/${v.id}?tab=money`)
    const sale = await recordSaleUI(page, "500000")
    expect((await db.one("leads", `id=eq.${lead.id}`, "status")).status).toBe("converted")
    await sale.getByRole("button", { name: /remove/i }).click()
    await page.getByRole("button", { name: "Remove sale" }).click()
    await expect(toast(page, "Sale removed.")).toBeVisible()
  })

  test("@regression FIN-13b editing a fully-paid sale adjusts the buyer payment", async ({ page, api, e2e }) => {
    bug("DI-2")
    const { v, fin } = await bookedCar(api, e2e)
    await unlock(page, e2e.financeKey)
    await page.goto(`/vehicles/${v.id}?tab=money`)
    const sale = await recordSaleUI(page, "500000")
    await sale.getByRole("button", { name: "Edit" }).click()
    const form = page.getByRole("form", { name: "Record sale" })
    await form.getByLabel("Finalised price").fill("450000")
    await form.getByRole("button", { name: "Save sale" }).click()
    await expect(form).toBeHidden()
    // Money received from the buyer must not exceed the new price.
    await expect
      .poll(async () => (await api.ok("GET", `/finance/entries?vehicleId=${v.id}`, undefined, fin)).totals.income)
      .toBeLessThanOrEqual(450000)
  })

  test("@smoke FIN-14 quotes: add for a lead, delete", async ({ page, api, e2e }) => {
    const v = await api.createVehicle(e2e.prefix)
    const lead = await api.createLead(e2e.prefix, { vehicleId: v.id })
    await unlock(page, e2e.financeKey)
    await page.goto(`/vehicles/${v.id}?tab=money`)
    const quotes = page.locator("section[aria-label='Quotes']")
    await quotes.getByRole("button", { name: "Add quote" }).click()
    const d = dialog(page, "Add quote")
    await d.getByLabel(/amount|price/i).first().fill("610000")
    await d.getByRole("button", { name: /lead/i }).first().click()
    await page.getByRole("option", { name: new RegExp(lead.fullName) }).first().click()
    await d.getByRole("button", { name: /add|save/i }).last().click()
    await expect(toast(page, "Quote added.")).toBeVisible()
    await quotes.getByRole("button", { name: "Delete quote" }).first().click()
    const confirm = page.getByRole("alertdialog").or(page.getByRole("dialog"))
    if (await confirm.count()) await confirm.getByRole("button", { name: /delete/i }).click()
    await expect(toast(page, "Quote deleted.")).toBeVisible()
  })

  test("@regression FIN-15 reports render and 'Sales' agrees across screens", async ({ page, api, e2e }) => {
    bug("UX-1", "DI-3")
    await unlock(page, e2e.financeKey)
    for (const report of ["P&L", "Cash flow", "Profit per car", "Dues", "Stock"]) {
      await page.goto("/finance/reports")
      const tab = page.getByRole("tab", { name: new RegExp(report, "i") }).or(page.getByRole("link", { name: new RegExp(report, "i") }))
      if (await tab.count()) await tab.first().click()
      await expect(page.getByText(/NaN|undefined/)).toHaveCount(0)
    }
    const fin = await finSession(api, e2e.financeKey)
    const from = `${today().slice(0, 7)}-01`
    const pnl = await api.ok("GET", `/finance/reports/pnl?from=${from}&to=${today()}&period=month`, undefined, fin)
    const perCar = await api.ok("GET", `/finance/reports/vehicle-profit?from=${from}&to=${today()}`, undefined, fin)
    const sum = (o: any, re: RegExp): number =>
      Object.entries(o ?? {}).reduce((t, [k, v]) => t + (re.test(k) && typeof v === "number" ? v : 0), 0)
    const pnlSales = sum(pnl.totals ?? pnl.total ?? pnl, /^sales$/i)
    const carSales = sum(perCar.totals ?? perCar.total ?? perCar, /^(sales|salePrice|revenue)$/i)
    expect(pnlSales, "P&L 'Sales' equals the per-car sales total").toBe(carSales)
    // DI-3: sale-purpose income on an unsold car should be refused.
    const open = await api.createVehicle(e2e.prefix)
    const res = await api.call("POST", "/finance/entries", { kind: "income", amount: 1000, entryDate: today(), vehicleId: open.id, purpose: "sale" }, fin)
    expect(res.status).toBe(422)
  })

  test("@regression FIN-16 reports with no data show an empty state, not NaN", async ({ page, e2e }) => {
    bug("UX-11")
    await unlock(page, e2e.financeKey)
    await page.goto("/finance/reports?from=2001-01-01&to=2001-01-31")
    await expect(page.getByText(/NaN|undefined/)).toHaveCount(0)
    await expect(page.getByText("₹4")).toHaveCount(0)
  })

  test("@regression FIN-18 finance API without a session is locked (423)", async ({ api }) => {
    for (const path of ["/finance/entries?from=2026-11-01&to=2026-11-17", "/finance/tags", "/finance/summary"]) {
      expect((await api.call("GET", path)).status, path).toBe(423)
    }
  })

  test("@smoke FIN-20 a converted car waits for its sale price", async ({ page, api, e2e }) => {
    const v = await api.createVehicle(e2e.prefix)
    const lead = await api.createLead(e2e.prefix, { vehicleId: v.id })
    await api.convert(lead.id)
    const fin = await finSession(api, e2e.financeKey)
    const awaiting = (await api.ok("GET", "/finance/vehicles/awaiting-sale-price", undefined, fin)) as { vehicleId: string }[]
    expect(awaiting.map((a) => a.vehicleId)).toContain(v.id)
    await unlock(page, e2e.financeKey)
    await page.goto("/finance")
    await expect(page.getByText(v.registrationNumber).first()).toBeVisible()
  })

  // Changes the vault key: only on a disposable vault (CI) or when allowed.
  test("@regression FIN-17 change the finance key: new works, old fails", async ({ api, e2e }) => {
    test.skip(!process.env.CI && !process.env.E2E_ALLOW_FINANCE_KEY_CHANGE, "rotates the shared vault key")
    const fin = await finSession(api, e2e.financeKey)
    const { financeKey } = await api.ok("POST", "/finance/vault/change-key", { currentKey: e2e.financeKey }, fin)
    expect((await api.call("POST", "/finance/unlock", { financeKey: e2e.financeKey })).status).toBe(401)
    expect((await api.call("POST", "/finance/unlock", { financeKey })).status).toBe(200)
    process.env.E2E_FINANCE_KEY = financeKey
  })

  // Locks the vault for 15 minutes: last, and only where allowed.
  test("@regression FIN-19 five wrong keys pause unlocking", async ({ api }) => {
    test.skip(!process.env.CI && !process.env.E2E_ALLOW_FINANCE_LOCKOUT, "locks the shared vault for 15 minutes")
    let last = 0
    for (let i = 0; i < 6; i++) {
      last = (await api.call("POST", "/finance/unlock", { financeKey: "FK-AAAA-BBBB-CCCC-DDDD-EEEE-FFFF" })).status
    }
    expect(last).toBe(429)
  })
})
