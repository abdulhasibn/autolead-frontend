import type { Page } from "@playwright/test"
import { test, expect, bug, missingUi } from "../fixtures"
import { randomPhone, type Vehicle } from "../support/api"
import { dialog, pick, settled, toast } from "../support/ui"

/** "KA12EX1234" -> "KA 12 EX 1234" as the CRM prints plates. */
const plate = (reg: string) => reg.replace(/^([A-Z]{2})(\d{2})([A-Z]{1,3})(\d{4})$/, "$1 $2 $3 $4")

async function changeStatus(page: Page, status: string, notes?: string) {
  await page.getByRole("button", { name: "Change status" }).click()
  const d = dialog(page, "Change status")
  await pick(d, "New status", status)
  if (notes) await d.getByLabel("Notes").fill(notes)
  await d.getByRole("button", { name: "Save" }).click()
  await expect(toast(page, `Status changed to ${status}.`)).toBeVisible()
}

async function linkVehicle(page: Page, v: Vehicle) {
  await page.getByRole("button", { name: "Link vehicle" }).click()
  const d = dialog(page, "Link vehicle")
  await pick(d, "Vehicle", new RegExp(plate(v.registrationNumber)))
  await d.getByRole("button", { name: "Link vehicle" }).click()
  await expect(d).toBeHidden()
}

async function openNewLead(page: Page) {
  await page.goto("/leads")
  await page.getByRole("button", { name: "New lead" }).click()
  return dialog(page, "New lead")
}

test.describe("leads", () => {
  test("@smoke leads list renders the provisioned lead", async ({ page, e2e }) => {
    await page.goto("/leads")
    await expect(page.getByRole("heading", { name: "Leads", level: 1 })).toBeVisible()
    // exact: the run's other leads are named "<leadName> 1234" and would match too.
    await expect(page.getByRole("link", { name: e2e.leadName, exact: true })).toBeVisible()
  })

  test("@smoke opens a lead detail from the list", async ({ page, e2e }) => {
    await page.goto("/leads")
    await page.getByRole("link", { name: e2e.leadName, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/leads/${e2e.leadId}$`))
    await expect(page.getByRole("heading", { name: e2e.leadName, level: 1, exact: true })).toBeVisible()
  })

  test("@smoke LEAD-01 creates a lead without a car: New, unassigned", async ({ page, e2e, db }) => {
    const name = `Lead ${e2e.prefix} L01`
    const phone = randomPhone()
    const d = await openNewLead(page)
    await d.getByLabel("Full name *").fill(name)
    await d.getByLabel("Phone *").fill(phone.slice(3))
    await pick(d, "Source *", "Walk-in")
    await d.getByRole("button", { name: "Create now" }).click()
    await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible({ timeout: 30_000 })
    await expect(toast(page, `Lead created for ${name}.`)).toBeVisible()
    const id = page.url().split("/").pop()!
    const row = await db.one("leads", `id=eq.${id}`, "status,user_id,vehicle_id,source")
    expect(row).toMatchObject({ status: "new", user_id: null, vehicle_id: null, source: "walkin" })
  })

  test("@regression LEAD-02 a lead linked to an open car makes the car linked", async ({ page, api, e2e, db }) => {
    const v = await api.createVehicle(e2e.prefix)
    const lead = await api.createLead(e2e.prefix)
    await page.goto(`/leads/${lead.id}`)
    await linkVehicle(page, v)
    await expect.poll(async () => (await db.one("vehicles", `id=eq.${v.id}`, "status")).status).toBe("linked")
  })

  test("@regression LEAD-03 required fields are enforced", async ({ page }) => {
    const d = await openNewLead(page)
    await d.getByRole("button", { name: "Create now" }).click()
    await expect(d.getByText("Full name is required")).toBeVisible()
    await expect(d.getByText("Enter a 10-digit mobile number")).toBeVisible()
    await expect(d.getByLabel("Source *")).toHaveAttribute("aria-invalid", "true")
    await expect(d).toBeVisible()
  })

  test("@regression LEAD-04 reusing a phone reuses the contact without renaming it", async ({ page, api, e2e, db }) => {
    bug("DI-6")
    const phone = randomPhone()
    await api.createLead(e2e.prefix, { fullName: `Lead ${e2e.prefix} Original`, phone })
    const d = await openNewLead(page)
    await d.getByLabel("Full name *").fill(`Lead ${e2e.prefix} Other`)
    await d.getByLabel("Phone *").fill(phone.slice(3))
    await pick(d, "Source *", "Phone")
    await d.getByRole("button", { name: "Create now" }).click()
    await expect(page).toHaveURL(/\/leads\/[0-9a-f-]{36}$/)
    const contacts = await db.select("contacts", `phone=eq.${encodeURIComponent(phone)}`, "id,full_name")
    expect(contacts).toHaveLength(1)
    // Silently renaming the existing contact is the bug: it should keep its name
    // (or ask first).
    expect(contacts[0].full_name).toBe(`Lead ${e2e.prefix} Original`)
  })

  // The budget field only takes digits: "-5" and "abc" can't be entered.
  for (const budget of ["-5", "abc"]) {
    test(`@regression LEAD-05 budget "${budget}" keeps digits only`, async ({ page }) => {
      const d = await openNewLead(page)
      await d.getByLabel("Full name *").fill("Digits only")
      await d.getByLabel("Phone *").fill(randomPhone().slice(3))
      await pick(d, "Source *", "Phone")
      await d.getByRole("button", { name: "Continue" }).click()
      const field = d.getByLabel("Max budget (₹)")
      await field.fill(budget)
      await expect(field).toHaveValue(/^[\d,]*$/)
    })
  }

  // An absurdly large budget gets a field error; 0 (= unknown) and a normal
  // budget are stored and display without breaking.
  for (const [budget, ok] of [["1000000000000", false], ["0", true], ["850000", true]] as const) {
    test(`@regression LEAD-05 budget "${budget}" is ${ok ? "accepted" : "rejected"}`, async ({ page, e2e, db }) => {
      const name = `Lead ${e2e.prefix} L05 ${budget}`
      const d = await openNewLead(page)
      await d.getByLabel("Full name *").fill(name)
      await d.getByLabel("Phone *").fill(randomPhone().slice(3))
      await pick(d, "Source *", "Phone")
      await d.getByRole("button", { name: "Continue" }).click()
      const field = d.getByLabel("Max budget (₹)")
      await field.fill(budget)
      await d.getByRole("button", { name: "Create now" }).click()
      if (!ok) {
        if (budget === "1000000000000") bug("NEW-1")
        await expect(d).toBeVisible()
        await expect(toast(page, /Service temporarily unavailable/)).toHaveCount(0)
        await expect(field).toHaveAttribute("aria-invalid", "true")
        return
      }
      await expect(toast(page, `Lead created for ${name}.`)).toBeVisible({ timeout: 30_000 })
      // Read this test's own lead by id: the parallel budget cases use the same
      // admin, so "newest lead by creator" can be another case's lead.
      await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible({ timeout: 30_000 })
      const id = page.url().split("/").pop()!
      const row = await db.one("leads", `id=eq.${id}`, "id,budget")
      expect(Number(row.budget)).toBe(Number(budget))
      await page.reload()
      await expect(page.getByText(/NaN|undefined/)).toHaveCount(0)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(1)
    })
  }

  test("@regression LEAD-06 edit lead fields (no UI yet)", async () => {
    missingUi("MF-2")
  })
  test("@regression LEAD-07 assign / reassign / unassign (no UI yet)", async () => {
    missingUi("MF-2")
  })

  test("@smoke LEAD-08 full lifecycle new → not now → new → booked → converted", async ({ page, api, e2e, db }) => {
    const v = await api.createVehicle(e2e.prefix)
    const lead = await api.createLead(e2e.prefix, { vehicleId: v.id })
    await page.goto(`/leads/${lead.id}`)
    await changeStatus(page, "Not now", "call next month")
    await changeStatus(page, "New")
    await changeStatus(page, "Booking confirmed", "token paid")
    await changeStatus(page, "Converted")
    // DATA-01 / DATA-02
    const history = await db.select("lead_status_history", `lead_id=eq.${lead.id}&order=changed_at.asc`, "from_status,to_status,changed_by,notes")
    expect(history.map((h) => `${h.from_status}->${h.to_status}`)).toEqual(
      expect.arrayContaining(["new->not_now", "not_now->new", "new->booking_confirmed", "booking_confirmed->converted"])
    )
    expect(history.filter((h) => h.from_status).every((h) => h.changed_by === e2e.userId)).toBe(true)
    expect(history.find((h) => h.to_status === "not_now")?.notes).toBe("call next month")
    const car = await db.one("vehicles", `id=eq.${v.id}`, "status,sold_lead_id")
    expect(car).toEqual({ status: "sold", sold_lead_id: lead.id })
  })

  test("@regression LEAD-09 illegal transitions are not offered and the API refuses them", async ({ page, api, e2e }) => {
    const lead = await api.createLead(e2e.prefix)
    await page.goto(`/leads/${lead.id}`)
    await page.getByRole("button", { name: "Change status" }).click()
    await dialog(page, "Change status").getByRole("combobox", { name: "New status" }).click()
    await expect(page.getByRole("option", { name: "Converted" })).toHaveCount(0)
    expect((await api.setStatus(lead.id, "converted")).status).toBe(422)
    await api.setStatus(lead.id, "lost")
    expect((await api.setStatus(lead.id, "new")).status).toBe(422)
  })

  test("@regression LEAD-10 booking without a car is blocked", async ({ page, api, e2e }) => {
    const lead = await api.createLead(e2e.prefix)
    await page.goto(`/leads/${lead.id}`)
    await page.getByRole("button", { name: "Change status" }).click()
    await dialog(page, "Change status").getByRole("combobox", { name: "New status" }).click()
    const booking = page.getByRole("option", { name: /Booking confirmed/ })
    await expect(booking).toHaveAttribute("aria-disabled", "true")
    const res = await api.setStatus(lead.id, "booking_confirmed")
    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe("LEAD_REQUIRES_VEHICLE")
  })

  test("@regression LEAD-11 removing the car from a booked lead is blocked", async ({ api, e2e }) => {
    const v = await api.createVehicle(e2e.prefix)
    const lead = await api.createLead(e2e.prefix, { vehicleId: v.id })
    await api.ok("POST", `/leads/${lead.id}/status`, { status: "booking_confirmed" })
    const res = await api.call("DELETE", `/leads/${lead.id}/vehicle`)
    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe("LEAD_REQUIRES_VEHICLE")
  })

  test("@regression LEAD-12 converting lead A makes lead B vehicle_unavailable and notifies", async ({ page, api, e2e, db }) => {
    const v = await api.createVehicle(e2e.prefix)
    const a = await api.createLead(e2e.prefix, { vehicleId: v.id })
    const b = await api.createLead(e2e.prefix, { vehicleId: v.id })
    await api.ok("PUT", `/leads/${b.id}/assignment`, { assignedTo: e2e.salesId })
    await page.goto(`/leads/${a.id}`)
    await changeStatus(page, "Booking confirmed")
    await changeStatus(page, "Converted")
    await expect.poll(async () => (await db.one("leads", `id=eq.${b.id}`, "status")).status).toBe("vehicle_unavailable")
    const notes = await db.select("notifications", `user_id=eq.${e2e.salesId}&lead_id=eq.${b.id}`, "type")
    expect(notes.length).toBeGreaterThan(0)
  })

  test("@regression LEAD-13 an unavailable lead can link another car and book", async ({ page, api, e2e, db }) => {
    const v1 = await api.createVehicle(e2e.prefix)
    const v2 = await api.createVehicle(e2e.prefix)
    const a = await api.createLead(e2e.prefix, { vehicleId: v1.id })
    const b = await api.createLead(e2e.prefix, { vehicleId: v1.id })
    await api.convert(a.id)
    await page.goto(`/leads/${b.id}`)
    await expect(page.getByText("Vehicle unavailable").first()).toBeVisible()
    await linkVehicle(page, v2)
    await changeStatus(page, "Booking confirmed")
    expect(await db.one("leads", `id=eq.${b.id}`, "status,vehicle_id")).toEqual({ status: "booking_confirmed", vehicle_id: v2.id })
  })

  test("@regression LEAD-14 sold and dropped cars cannot be linked", async ({ page, api, e2e }) => {
    const dropped = await api.createVehicle(e2e.prefix)
    await api.setVehicleStatus(dropped.id, "dropped", "owner withdrew")
    const sold = await api.createVehicle(e2e.prefix)
    const buyer = await api.createLead(e2e.prefix, { vehicleId: sold.id })
    await api.convert(buyer.id)
    const lead = await api.createLead(e2e.prefix)
    await page.goto(`/leads/${lead.id}`)
    await page.getByRole("button", { name: "Link vehicle" }).click()
    await dialog(page, "Link vehicle").getByRole("combobox", { name: "Vehicle" }).click()
    await expect(page.getByRole("option", { name: new RegExp(plate(dropped.registrationNumber)) })).toHaveCount(0)
    await expect(page.getByRole("option", { name: new RegExp(plate(sold.registrationNumber)) })).toHaveCount(0)
    for (const v of [dropped, sold]) {
      const res = await api.call("PATCH", `/leads/${lead.id}/vehicle`, { vehicleId: v.id })
      expect(res.status).toBe(422)
      expect(res.body.error.code).toBe("VEHICLE_NOT_LINKABLE")
    }
  })

  test("@regression LEAD-15 marking lost closes the lead and cancels open follow-ups", async ({ page, api, e2e, db }) => {
    const lead = await api.createLead(e2e.prefix)
    await api.scheduleFollowUp(lead.id, new Date(Date.now() + 86_400_000))
    await page.goto(`/leads/${lead.id}`)
    await changeStatus(page, "Lost", "bought elsewhere")
    expect((await db.one("leads", `id=eq.${lead.id}`, "status")).status).toBe("lost")
    // DATA-04
    expect(await db.select("follow_ups", `lead_id=eq.${lead.id}&completed_at=is.null&deleted_at=is.null`, "id")).toHaveLength(0)
  })

  test("@regression LEAD-16 closed leads disable editing controls and the API refuses", async ({ page, api, e2e }) => {
    const lead = await api.createLead(e2e.prefix)
    await api.setStatus(lead.id, "lost")
    await page.goto(`/leads/${lead.id}`)
    for (const name of ["Schedule follow-up", "Link vehicle", "Change status"]) {
      const btn = page.getByRole("button", { name })
      if (await btn.count()) await expect(btn).toBeDisabled()
    }
    const res = await api.call("POST", `/leads/${lead.id}/follow-ups`, {
      scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
      taskType: "call",
    })
    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe("LEAD_CLOSED")
  })

  test("@regression LEAD-17 undo a sale: lead back to booked, car back to linked", async ({ page, api, e2e, db }) => {
    const v = await api.createVehicle(e2e.prefix)
    const lead = await api.createLead(e2e.prefix, { vehicleId: v.id })
    await api.convert(lead.id)
    await page.goto(`/leads/${lead.id}`)
    await page.getByRole("button", { name: "Undo sale" }).click()
    const undo = dialog(page, "Undo this sale?")
    await settled(undo) // a click during the open animation is lost
    await undo.getByRole("button", { name: "Undo sale" }).click()
    await expect(toast(page, "Sale undone. The lead is back to booking confirmed.")).toBeVisible()
    // DATA-02
    expect((await db.one("leads", `id=eq.${lead.id}`, "status")).status).toBe("booking_confirmed")
    expect(await db.one("vehicles", `id=eq.${v.id}`, "status,sold_lead_id")).toEqual({ status: "linked", sold_lead_id: null })
  })

  test("@regression LEAD-18 undo is blocked while finance has a sale price", async ({ page, api, e2e, db }) => {
    test.skip(!e2e.financeKey, "needs E2E_FINANCE_KEY")
    const v = await api.createVehicle(e2e.prefix)
    const lead = await api.createLead(e2e.prefix, { vehicleId: v.id })
    await api.convert(lead.id)
    const { sessionToken } = await api.ok("POST", "/finance/unlock", { financeKey: e2e.financeKey })
    const fin = { "X-Finance-Session": sessionToken }
    await api.ok("PUT", `/finance/vehicles/${v.id}`, { commissionPercent: 2 }, fin)
    await api.ok("POST", `/finance/vehicles/${v.id}/sale`, {
      finalisedPrice: 700000,
      soldOn: new Date().toISOString().slice(0, 10),
      leadId: lead.id,
    }, fin)
    await api.call("POST", "/finance/lock", undefined, fin)
    await page.goto(`/leads/${lead.id}`)
    await page.getByRole("button", { name: "Undo sale" }).click()
    const undo = dialog(page, "Undo this sale?")
    await settled(undo) // a click during the open animation is lost
    await undo.getByRole("button", { name: "Undo sale" }).click()
    await expect(page.getByText(/Remove the sale in Finance first/).first()).toBeVisible()
    expect((await db.one("leads", `id=eq.${lead.id}`, "status")).status).toBe("converted")
  })

  test("@regression LEAD-19 remove car from a new lead (no UI yet)", async () => {
    missingUi("MF-5")
  })

  test("@regression LEAD-20 full buyer preference persists", async ({ page, api, e2e, db }) => {
    const lead = await api.createLead(e2e.prefix)
    await page.goto(`/leads/${lead.id}`)
    await page.getByRole("button", { name: "Add preference" }).click()
    const d = dialog(page, "Buyer preference")
    await d.getByLabel("Year from").fill("2018")
    await d.getByLabel("Max km").fill("60000")
    await d.getByLabel("Max owners").fill("1")
    await d.getByRole("button", { name: "Petrol", exact: true }).click()
    await d.getByRole("button", { name: "Manual", exact: true }).click()
    await d.getByRole("button", { name: /save/i }).click()
    await expect(toast(page, "Buyer preference saved.")).toBeVisible()
    await page.reload()
    const row = await db.one("leads", `id=eq.${lead.id}`, "preferred_year_min,preferred_km_max,preferred_max_owners,preferred_fuel_types,preferred_transmissions")
    expect(row).toMatchObject({ preferred_year_min: 2018, preferred_km_max: 60000, preferred_max_owners: 1 })
    expect(row.preferred_fuel_types).toContain("petrol")
    expect(row.preferred_transmissions).toContain("manual")
    await expect(page.getByText("Petrol").first()).toBeVisible()
  })

  test("@regression LEAD-21 invalid preference values are rejected", async ({ page, api, e2e }) => {
    const lead = await api.createLead(e2e.prefix)
    await page.goto(`/leads/${lead.id}`)
    await page.getByRole("button", { name: "Add preference" }).click()
    const d = dialog(page, "Buyer preference")
    await d.getByLabel("Year from").fill("1949")
    await d.getByLabel("Max km").fill("-5")
    // Max km only takes digits, so the minus sign never lands.
    await expect(d.getByLabel("Max km")).toHaveValue(/^[\d,]*$/)
    await d.getByRole("button", { name: /save/i }).click()
    await expect(d).toBeVisible()
    await expect(d.getByLabel("Year from")).toHaveAttribute("aria-invalid", "true")
  })

  test("@regression LEAD-22 lead detail shows server-scored suggestions with match %", async ({ page, api, e2e }) => {
    const cat = await api.catalog()
    const v = await api.createVehicle(e2e.prefix, { year: 2020, kmDriven: 30000 })
    const lead = await api.createLead(e2e.prefix, { budget: 900000 })
    await api.ok("PUT", `/leads/${lead.id}/preference`, {
      preferredMakeId: cat.make.id,
      preferredModelId: cat.model.id,
      preferredYearMin: 2018,
      preferredKmMax: 60000,
      preferredFuelTypes: ["petrol"],
    })
    const server = await api.ok("GET", `/leads/${lead.id}/vehicle-matches`)
    const match = server.suggested.find((s: any) => s.vehicle.id === v.id)
    expect(match, "server suggests the car").toBeTruthy()
    await page.goto(`/leads/${lead.id}`)
    const row = page.getByText(plate(v.registrationNumber)).locator("xpath=ancestor::li[1]")
    await expect(row.getByText(`${match.match.score}%`)).toBeVisible()
  })

  test("@regression LEAD-22b new-lead wizard suggestions agree with the server score", async ({ page, api, e2e }) => {
    bug("FN-2")
    // Seed a petrol car of make A, then ask the wizard for make B. The wizard
    // must score make A cars the way the server does once the lead exists.
    const cat = await api.catalog()
    const v = await api.createVehicle(e2e.prefix, { year: 2020, kmDriven: 30000 })
    await api.ok("PUT", `/vehicles/${v.id}/listed-price`, { listedPrice: 650000 })
    const makes = (await api.ok("GET", "/catalog/makes?limit=100")).items as { id: string; name: string }[]
    let other: { make: string; model: string } | undefined
    for (const m of makes.filter((m) => m.id !== cat.make.id)) {
      const models = (await api.ok("GET", `/catalog/makes/${m.id}/models?limit=5`)).items
      if (models.length) {
        other = { make: m.name, model: models[0].name }
        break
      }
    }
    expect(other, "a second make with models").toBeTruthy()
    const name = `Lead ${e2e.prefix} L22b`
    const d = await openNewLead(page)
    await d.getByLabel("Full name *").fill(name)
    await d.getByLabel("Phone *").fill(randomPhone().slice(3))
    await pick(d, "Source *", "Phone")
    await d.getByRole("button", { name: "Continue" }).click()
    await d.getByLabel("Max budget (₹)").fill("900000")
    await pick(d, "Make", other!.make)
    await pick(d, "Model", other!.model)
    await d.getByRole("button", { name: "Petrol", exact: true }).click()
    await d.getByLabel("Year from").fill("2015")
    await d.getByRole("button", { name: "Continue" }).click()
    // Compare the wizard's % for this test's own car (other cars may score
    // higher and be listed first) with the server's score once the lead exists.
    const scored = d
      .getByRole("heading", { name: /Suggested cars/ })
      .locator("xpath=..")
      .getByRole("listitem")
      .filter({ hasText: /\d+%/ })
      .filter({ hasText: new RegExp(v.registrationNumber.split("").join(" ?")) })
    await expect(scored).toHaveCount(1)
    const wizardText = (await scored.textContent()) ?? ""
    const wizardPct = Number(/(\d+)%/.exec(wizardText)?.[1])
    await d.getByRole("button", { name: "Create lead" }).click()
    await expect(toast(page, `Lead created for ${name}.`)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible({ timeout: 30_000 })
    const id = page.url().split("/").pop()!
    const server = await api.ok("GET", `/leads/${id}/vehicle-matches?minScore=0&limit=50`)
    const reg = v.registrationNumber.replace(/ /g, "")
    const match = [...(server.suggested ?? []), ...(server.linked ? [].concat(server.linked) : [])].find(
      (s: any) => s.vehicle.registrationNumber.replace(/ /g, "") === reg
    )
    expect(match, `server match for ${reg}`).toBeTruthy()
    expect(wizardPct).toBe(match.match.score)
  })

  test("@regression LEAD-23 filter by assignee and source", async ({ page }) => {
    bug("MF-8")
    await page.goto("/leads")
    await expect(page.getByRole("combobox", { name: /assignee|assigned/i })).toBeVisible()
    await expect(page.getByRole("combobox", { name: /source/i })).toBeVisible()
  })

  test("@regression LEAD-23b status filter and search narrow the list", async ({ page, api, e2e }) => {
    const lost = await api.createLead(e2e.prefix, { fullName: `Lead ${e2e.prefix} Filterlost` })
    await api.setStatus(lost.id, "lost")
    await page.goto("/leads")
    await page.getByRole("searchbox", { name: "Search leads" }).fill(`${e2e.prefix} Filterlost`)
    await expect(page.getByRole("link", { name: `Lead ${e2e.prefix} Filterlost` })).toBeVisible()
    await pick(page, "Filter by status", "New")
    await expect(page.getByRole("link", { name: `Lead ${e2e.prefix} Filterlost` })).toHaveCount(0)
    await pick(page, "Filter by status", "Lost")
    await expect(page.getByRole("link", { name: `Lead ${e2e.prefix} Filterlost` })).toBeVisible()
  })

  test("@regression LEAD-24 a 1000+ char status note saves and displays", async ({ page, api, e2e, db }) => {
    const lead = await api.createLead(e2e.prefix)
    const note = "Long note. ".repeat(100)
    await page.goto(`/leads/${lead.id}`)
    await changeStatus(page, "Not now", note)
    const h = await db.one("lead_status_history", `lead_id=eq.${lead.id}&to_status=eq.not_now`, "notes")
    expect(h.notes.length).toBeGreaterThan(1000)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test("@regression LEAD-25 double-clicking Save records one transition", async ({ page, api, e2e, db }) => {
    const lead = await api.createLead(e2e.prefix)
    await page.goto(`/leads/${lead.id}`)
    await page.getByRole("button", { name: "Change status" }).click()
    const d = dialog(page, "Change status")
    await pick(d, "New status", "Not now")
    await d.getByRole("button", { name: "Save" }).dblclick()
    await expect(toast(page, "Status changed to Not now.").first()).toBeVisible()
    await page.waitForLoadState("networkidle")
    expect(await db.select("lead_status_history", `lead_id=eq.${lead.id}&to_status=eq.not_now`, "id")).toHaveLength(1)
  })

  test("@regression LEAD-26 a stale tab gets a clear error, not corrupt state", async ({ page, api, e2e, db }) => {
    const lead = await api.createLead(e2e.prefix)
    await page.goto(`/leads/${lead.id}`)
    await api.setStatus(lead.id, "lost") // "tab A"
    await page.getByRole("button", { name: "Change status" }).click()
    const d = dialog(page, "Change status")
    await pick(d, "New status", "Not now")
    await d.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText(/closed|no longer|refresh|cannot|can't/i).first()).toBeVisible()
    expect((await db.one("leads", `id=eq.${lead.id}`, "status")).status).toBe("lost")
  })
})
