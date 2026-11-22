import { writeFileSync } from "node:fs"
import type { Page } from "@playwright/test"
import { test, expect, bug } from "../fixtures"
import { randomPlate, type Api } from "../support/api"
import { dialog, pick, toast } from "../support/ui"

const plate = (reg: string) => reg.replace(/^([A-Z]{2})(\d{2})([A-Z]{1,3})(\d{4})$/, "$1 $2 $3 $4")

// 1x1 PNG and minimal PDF for uploads.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
)
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n")

function file(name: string, body: Buffer | string): string {
  const p = test.info().outputPath(name)
  writeFileSync(p, body)
  return p
}

/** Fill step 1 (car) of the Add vehicle sheet. */
async function fillCarStep(page: Page, api: Api, reg: string, over: { year?: string; km?: string; owners?: string } = {}) {
  const cat = await api.catalog()
  const s = page.getByRole("dialog", { name: "Add vehicle" })
  await pick(s, "Make *", cat.make.name)
  await pick(s, "Model *", cat.model.name)
  await pick(s, "Variant *", cat.variant.name)
  await s.getByLabel("Registration number *").fill(reg)
  await s.getByLabel("Year *").fill(over.year ?? "2019")
  await pick(s, "Fuel *", "Petrol")
  await pick(s, "Transmission *", "Manual")
  await s.getByLabel("Km driven *").fill(over.km ?? "42000")
  await s.getByLabel("Previous owners *").fill(over.owners ?? "1")
  await s.getByRole("button", { name: "White", exact: true }).click()
  return s
}

async function openAddVehicle(page: Page) {
  await page.goto("/vehicles")
  await page.getByRole("button", { name: "Add vehicle" }).click()
  return page.getByRole("dialog", { name: "Add vehicle" })
}

async function uploadPhoto(page: Page, slot: string, path: string) {
  const chooser = page.waitForEvent("filechooser")
  await page.getByRole("button", { name: new RegExp(`^${slot}`) }).first().click()
  await (await chooser).setFiles(path)
}

test.describe("vehicles", () => {
  test("@smoke VEH-01 add a vehicle through the wizard: saved as open", async ({ page, api, e2e, db }) => {
    test.setTimeout(120_000)
    const owner = await api.createOwner(e2e.prefix)
    const reg = randomPlate()
    await openAddVehicle(page)
    const s = await fillCarStep(page, api, reg)
    await s.getByRole("button", { name: "Continue" }).click() // condition
    await s.getByRole("button", { name: "Continue" }).click() // owner
    await s.getByLabel("Search owners").fill(owner.fullName)
    await page.getByRole("option", { name: new RegExp(owner.fullName) }).first().click()
    await s.getByRole("button", { name: "Commission sale" }).click()
    await s.getByRole("button", { name: "Add vehicle" }).click()
    await expect(toast(page, "Vehicle added. Now add its photos.")).toBeVisible({ timeout: 30_000 })
    const row = await db.one("vehicles", `registration_number=eq.${reg}`, "status,owner_id")
    expect(row).toEqual({ status: "open", owner_id: owner.id })
  })

  test("@regression VEH-02 required fields are enforced", async ({ page }) => {
    const s = await openAddVehicle(page)
    await s.getByRole("button", { name: "Continue" }).click()
    for (const f of ["Make *", "Registration number *", "Year *", "Km driven *"]) {
      await expect(s.getByLabel(f)).toHaveAttribute("aria-invalid", "true")
    }
  })

  test("@regression VEH-03 duplicate live registration gets a clear message on the right step", async ({ page, api, e2e }) => {
    bug("FN-12")
    const existing = await api.createVehicle(e2e.prefix)
    await openAddVehicle(page)
    const s = await fillCarStep(page, api, existing.registrationNumber)
    await s.getByRole("button", { name: "Continue" }).click()
    await s.getByRole("button", { name: "Continue" }).click()
    await s.getByLabel("Search owners").fill(e2e.prefix)
    await page.getByRole("option").first().click()
    await s.getByRole("button", { name: "Commission sale" }).click()
    await s.getByRole("button", { name: "Add vehicle" }).click()
    await expect(toast(page, "A vehicle with this registration number already exists.")).toBeVisible()
    // The plate field (step 1) should be where the user lands.
    await expect(s.getByLabel("Registration number *")).toBeVisible()
  })

  test("@regression VEH-04 plates are normalised; dash variants are the same car", async ({ api, e2e, db }) => {
    bug("DI-1")
    const owner = await api.createOwner(e2e.prefix)
    const cat = await api.catalog()
    const base = randomPlate()
    const spaced = `${base.slice(0, 2).toLowerCase()} ${base.slice(2, 4)}-${base.slice(4, -4).toLowerCase()} ${base.slice(-4)}`
    const body = (registrationNumber: string) => ({
      ownerId: owner.id, variantId: cat.variant.id, year: 2019, registrationNumber, fuelType: "petrol",
      transmission: "manual", kmDriven: 1000, numPreviousOwners: 1, colour: "White", accidentHistory: false, acquisitionType: "consignment",
    })
    const first = await api.call("POST", "/vehicles", body(spaced))
    expect(first.status).toBe(201)
    expect(first.body.registrationNumber).toBe(base)
    const dup = await api.call("POST", "/vehicles", body(base))
    expect(dup.status).toBe(409)
    expect((await api.call("POST", "/vehicles", body("KA01AB12345678901"))).status).toBe(422)
    expect((await api.call("POST", "/vehicles", body("KA01@B1234"))).status).toBe(422)
    void db
  })

  for (const [field, value] of [["Year *", "1899"], ["Year *", "2101"], ["Km driven *", "-5"], ["Km driven *", "12.5"], ["Previous owners *", "33000"]] as const) {
    test(`@regression VEH-05 ${field.replace(" *", "")} ${value} is rejected`, async ({ page, api }) => {
      await openAddVehicle(page)
      const s = await fillCarStep(page, api, randomPlate(), {
        year: field === "Year *" ? value : undefined,
        km: field === "Km driven *" ? value : undefined,
        owners: field === "Previous owners *" ? value : undefined,
      })
      await s.getByRole("button", { name: "Continue" }).click()
      await expect(s.getByLabel(field)).toHaveAttribute("aria-invalid", "true")
    })
  }

  test("@regression VEH-06 changing make resets model and variant", async ({ page, api }) => {
    bug("DI-8") // fuel / transmission are also kept from the old variant
    const s = await openAddVehicle(page)
    const cat = await api.catalog()
    await pick(s, "Make *", cat.make.name)
    await pick(s, "Model *", cat.model.name)
    await pick(s, "Variant *", cat.variant.name)
    await pick(s, "Fuel *", "Diesel")
    const makes = (await api.ok("GET", "/catalog/makes?limit=100")).items as { id: string; name: string }[]
    const other = makes.find((m) => m.id !== cat.make.id)!
    await pick(s, "Make *", other.name)
    await expect(s.getByRole("combobox", { name: "Model *" }).or(s.getByRole("button", { name: "Model *" })).first()).toContainText(/Select model/)
    await expect(s.getByRole("combobox", { name: "Variant *" }).or(s.getByRole("button", { name: "Variant *" })).first()).toContainText(/Pick a model first|Select variant/)
    await expect(s.getByRole("combobox", { name: "Fuel *" })).toContainText("Select fuel")
  })

  test("@smoke VEH-07 edit vehicle details; persisted after reload", async ({ page, api, e2e, db }) => {
    const v = await api.createVehicle(e2e.prefix)
    await page.goto(`/vehicles/${v.id}`)
    await page.getByRole("button", { name: "Edit details" }).click()
    const s = page.getByRole("dialog", { name: /^Edit / })
    await s.getByLabel("Km driven *").fill("55555")
    for (let i = 0; i < 3 && (await s.getByRole("button", { name: "Continue" }).count()); i++) {
      await s.getByRole("button", { name: "Continue" }).click()
    }
    await s.getByRole("button", { name: "Save changes" }).click()
    await expect(toast(page, "Vehicle updated.")).toBeVisible()
    await page.reload()
    expect((await db.one("vehicles", `id=eq.${v.id}`, "km_driven")).km_driven).toBe(55555)
  })

  test("@regression VEH-08 change acquisition type on an unsold car", async ({ api, e2e, db }) => {
    const v = await api.createVehicle(e2e.prefix)
    const cur = await api.ok("GET", `/vehicles/${v.id}`)
    await api.ok("PATCH", `/vehicles/${v.id}`, { ...pickUpdatable(cur), acquisitionType: "dealership_purchase" })
    expect((await db.one("vehicles", `id=eq.${v.id}`, "acquisition_type")).acquisition_type).toBe("dealership_purchase")
  })

  test("@smoke VEH-09 upload a photo as Front; it becomes the list cover", async ({ page, api, e2e }) => {
    const v = await api.createVehicle(e2e.prefix)
    await page.goto(`/vehicles/${v.id}?tab=photos`)
    await uploadPhoto(page, "Front", file("front.png", PNG))
    await expect(page.getByRole("button", { name: /Open Front/ })).toBeVisible({ timeout: 30_000 })
    await expect.poll(async () => (await api.ok("GET", `/vehicles/${v.id}`)).frontImageUrl).toBeTruthy()
  })

  test("@regression VEH-10 a text file renamed .png is rejected", async ({ page, api, e2e }) => {
    bug("VAL-3")
    const v = await api.createVehicle(e2e.prefix)
    await page.goto(`/vehicles/${v.id}?tab=photos`)
    await uploadPhoto(page, "Right side", file("fake.png", "this is not an image"))
    await expect(page.getByRole("button", { name: /Open Right side/ })).toHaveCount(0)
    await expect(page.getByText(/not an image|unsupported|can.t use/i).first()).toBeVisible()
  })

  test("@regression VEH-10b GIF and over-10 MB photos are rejected", async ({ page, api, e2e }) => {
    const v = await api.createVehicle(e2e.prefix)
    await page.goto(`/vehicles/${v.id}?tab=photos`)
    await uploadPhoto(page, "Rear", file("anim.gif", Buffer.from("GIF89a")))
    await expect(page.getByRole("button", { name: /Open Rear/ })).toHaveCount(0)
    await uploadPhoto(page, "Rear", file("huge.jpg", Buffer.alloc(11 * 1024 * 1024, 1)))
    await expect(page.getByRole("button", { name: /Open Rear/ })).toHaveCount(0)
  })

  test("@regression VEH-11 upload, list and delete a PDF document", async ({ page, api, e2e }) => {
    const v = await api.createVehicle(e2e.prefix)
    await page.goto(`/vehicles/${v.id}?tab=documents`)
    await page.locator('input[type="file"]').first().setInputFiles(file("rc-copy.pdf", PDF))
    await expect(toast(page, /uploaded\./)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText("rc-copy.pdf").first()).toBeVisible()
    await page.getByRole("button", { name: /Delete rc-copy\.pdf/ }).click()
    await page.getByRole("button", { name: "Delete document" }).click()
    await expect(toast(page, "Document deleted.")).toBeVisible()
  })

  test("@regression VEH-12 document over 15 MB is rejected", async ({ page, api, e2e }) => {
    const v = await api.createVehicle(e2e.prefix)
    await page.goto(`/vehicles/${v.id}?tab=documents`)
    await page.locator('input[type="file"]').first().setInputFiles(file("big.pdf", Buffer.alloc(16 * 1024 * 1024, 1)))
    await expect(toast(page, /uploaded\./)).toHaveCount(0)
    await expect(page.getByText(/15 ?MB|too large/i).first()).toBeVisible()
  })

  test("@smoke VEH-13 set and clear the listed price; public site shows price on request", async ({ page, api, e2e }) => {
    const v = await api.createVehicle(e2e.prefix)
    await page.goto(`/vehicles/${v.id}`)
    const panel = page.locator("section[aria-label='Listed price']")
    await panel.getByRole("button").first().click()
    const d = dialog(page, "Listed price")
    await d.getByLabel("Price (₹)").fill("650000")
    await d.getByRole("button", { name: /save/i }).click()
    await expect(toast(page, "Listed price saved.")).toBeVisible()
    expect((await api.ok("GET", `/public/vehicles/${v.id}`)).listedPrice ?? (await api.ok("GET", `/vehicles/${v.id}`)).listedPrice).toBe(650000)
    await panel.getByRole("button").first().click()
    await d.getByLabel("Price (₹)").fill("")
    await d.getByRole("button", { name: /save/i }).click()
    await expect(toast(page, "Listed price cleared.")).toBeVisible()
    expect((await api.ok("GET", `/public/vehicles/${v.id}`)).listedPrice ?? null).toBeNull()
  })

  test("@smoke VEH-14 drop an open car with a reason, then re-list it", async ({ page, api, e2e, db }) => {
    const v = await api.createVehicle(e2e.prefix)
    await page.goto(`/vehicles/${v.id}`)
    await page.getByRole("button", { name: "Drop", exact: true }).click()
    await page.getByLabel(/Reason/).fill("owner withdrew")
    await page.getByRole("button", { name: "Drop vehicle" }).click()
    await expect.poll(async () => (await db.one("vehicles", `id=eq.${v.id}`, "status")).status).toBe("dropped")
    await page.getByRole("button", { name: "Re-list", exact: true }).click()
    await page.getByRole("button", { name: "Re-list vehicle" }).click()
    await expect.poll(async () => (await db.one("vehicles", `id=eq.${v.id}`, "status")).status).toBe("open")
    const hist = await db.select("vehicle_status_history", `vehicle_id=eq.${v.id}&order=changed_at.asc`, "to_status,reason,changed_by")
    expect(hist.map((h) => h.to_status)).toEqual(expect.arrayContaining(["dropped", "open"]))
    expect(hist.find((h) => h.to_status === "dropped")).toMatchObject({ reason: "owner withdrew", changed_by: e2e.userId })
  })

  test("@smoke VEH-15 dropping a linked car warns and unlinks its leads", async ({ page, api, e2e, db }) => {
    const v = await api.createVehicle(e2e.prefix)
    const lead = await api.createLead(e2e.prefix, { vehicleId: v.id })
    await page.goto(`/vehicles/${v.id}`)
    await page.getByRole("button", { name: "Drop", exact: true }).click()
    await expect(page.getByText(/1 (active )?lead/).first()).toBeVisible()
    await page.getByRole("button", { name: /Drop vehicle|unlink/i }).last().click()
    await expect.poll(async () => (await db.one("vehicles", `id=eq.${v.id}`, "status")).status).toBe("dropped")
    // DATA-03
    expect((await db.one("leads", `id=eq.${lead.id}`, "vehicle_id")).vehicle_id).toBeNull()
  })

  test("@regression VEH-16 a sold car cannot be re-listed or change acquisition", async ({ page, api, e2e }) => {
    const v = await api.createVehicle(e2e.prefix)
    const lead = await api.createLead(e2e.prefix, { vehicleId: v.id })
    await api.convert(lead.id)
    await page.goto(`/vehicles/${v.id}`)
    await expect(page.getByRole("button", { name: "Re-list", exact: true })).toHaveCount(0)
    expect((await api.setVehicleStatus(v.id, "open")).status).toBe(422)
    const cur = await api.ok("GET", `/vehicles/${v.id}`)
    const res = await api.call("PATCH", `/vehicles/${v.id}`, { ...pickUpdatable(cur), acquisitionType: "dealership_purchase" })
    expect(res.status).toBe(422)
  })

  test("@regression VEH-17 filters (status, year, km) narrow the list", async ({ page, api, e2e }) => {
    const tag = e2e.prefix
    const a = await api.createVehicle(tag, { year: 2015, kmDriven: 90000 })
    const b = await api.createVehicle(tag, { year: 2022, kmDriven: 10000 })
    await page.goto(`/vehicles?q=${b.registrationNumber}&yearMin=2020&kmMax=20000`)
    await expect(page.getByText(plate(b.registrationNumber)).first()).toBeVisible()
    await page.goto(`/vehicles?q=${a.registrationNumber}&yearMin=2020`)
    await expect(page.getByText(plate(a.registrationNumber))).toHaveCount(0)
  })

  test("@regression VEH-17b vehicles can be filtered by price", async ({ page }) => {
    bug("MF-9")
    await page.goto("/vehicles")
    await page.getByRole("button", { name: /Filters/ }).click()
    await expect(page.getByLabel(/price/i).first()).toBeVisible()
  })

  test("@regression VEH-18 min greater than max is handled (swapped), not an empty crash", async ({ page, api, e2e }) => {
    const v = await api.createVehicle(e2e.prefix, { year: 2019 })
    await page.goto(`/vehicles?q=${v.registrationNumber}&yearMin=2021&yearMax=2017`)
    await expect(page.getByText(plate(v.registrationNumber)).first()).toBeVisible()
  })

  test("@regression VEH-19 multi-word search matches every word", async ({ page, api, e2e }) => {
    const cat = await api.catalog()
    const v = await api.createVehicle(e2e.prefix)
    await page.goto("/vehicles")
    await page.getByRole("searchbox", { name: "Search vehicles" }).fill(`${cat.model.name.split(" ")[0]} ${v.registrationNumber.slice(0, 6)}`)
    await expect(page.getByText(plate(v.registrationNumber)).first()).toBeVisible()
  })

  test("@regression VEH-20 vehicle detail lists linked and suggested leads with match %", async ({ page, api, e2e }) => {
    const cat = await api.catalog()
    const v = await api.createVehicle(e2e.prefix)
    const linked = await api.createLead(e2e.prefix, { vehicleId: v.id })
    const fan = await api.createLead(e2e.prefix)
    await api.ok("PUT", `/leads/${fan.id}/preference`, { preferredMakeId: cat.make.id, preferredModelId: cat.model.id, preferredFuelTypes: ["petrol"], preferredYearMin: 2015 })
    await page.goto(`/vehicles/${v.id}?tab=leads`)
    await expect(page.getByText(linked.fullName).first()).toBeVisible()
    await expect(page.getByText(fan.fullName).first()).toBeVisible()
    await expect(page.getByText(/\d+%/).first()).toBeVisible()
  })

  test("@regression VEH-21 a car with no photos shows a placeholder", async ({ page, api, e2e }) => {
    const v = await api.createVehicle(e2e.prefix)
    await page.goto(`/vehicles/${v.id}`)
    await expect(page.getByText("No photos yet").first()).toBeVisible()
    const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length)
    expect(broken).toBe(0)
  })
})

/** Update body = create body minus showroom/owner/variant; accidentHistory required. */
function pickUpdatable(v: any) {
  return {
    year: v.year, registrationNumber: v.registrationNumber, fuelType: v.fuelType, transmission: v.transmission,
    kmDriven: v.kmDriven, numPreviousOwners: v.numPreviousOwners, colour: v.colour, accidentHistory: v.accidentHistory ?? false,
  }
}
