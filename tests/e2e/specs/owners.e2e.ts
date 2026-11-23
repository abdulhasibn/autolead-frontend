import type { Page } from "@playwright/test"
import { test, expect, bug } from "../fixtures"
import { randomPhone } from "../support/api"
import { toast } from "../support/ui"

const sheet = (page: Page, name: string) => page.getByRole("dialog", { name })

async function openAddOwner(page: Page) {
  await page.goto("/owners")
  await page.getByRole("button", { name: "Add owner" }).click()
  return sheet(page, "Add owner")
}

test.describe("owners", () => {
  test("@smoke OWN-01 create an owner with every field", async ({ page, e2e, db }) => {
    const name = `Owner ${e2e.prefix} Full`
    const phone = randomPhone()
    const s = await openAddOwner(page)
    await s.getByLabel(/^Full name/).fill(name)
    await s.getByLabel(/^Phone/).fill(phone.slice(3))
    await s.getByLabel("Email").fill(`${e2e.prefix}@example.com`)
    await s.getByLabel("Address").fill("12 MG Road")
    await s.getByLabel("City").fill("Bengaluru")
    await s.getByLabel(/ID/).first().fill("ID-123")
    await s.getByLabel("Notes").fill("prefers mornings")
    await s.getByRole("button", { name: "Create owner" }).click()
    await expect(toast(page, "Owner created")).toBeVisible()
    const row = await db.one("owners", `phone=eq.${encodeURIComponent(phone)}&deleted_at=is.null`, "full_name,email,city,address,notes")
    expect(row).toEqual({ full_name: name, email: `${e2e.prefix}@example.com`, city: "Bengaluru", address: "12 MG Road", notes: "prefers mornings" })
  })

  test("@smoke OWN-02 create with only name and phone", async ({ page, e2e, db }) => {
    const phone = randomPhone()
    const s = await openAddOwner(page)
    await s.getByLabel(/^Full name/).fill(`Owner ${e2e.prefix} Min`)
    await s.getByLabel(/^Phone/).fill(phone.slice(3))
    await s.getByRole("button", { name: "Create owner" }).click()
    await expect(toast(page, "Owner created")).toBeVisible()
    expect(await db.select("owners", `phone=eq.${encodeURIComponent(phone)}`, "id")).toHaveLength(1)
  })

  test("@regression OWN-03 name and phone are required", async ({ page }) => {
    const s = await openAddOwner(page)
    await s.getByRole("button", { name: "Create owner" }).click()
    await expect(s.getByText("Full name is required")).toBeVisible()
    await expect(s.getByText("Enter a 10-digit mobile number")).toBeVisible()
    await expect(s).toBeVisible()
  })

  test("@regression OWN-04 duplicate live phone gets a clear message", async ({ page, api, e2e }) => {
    bug("FN-12")
    const existing = await api.createOwner(e2e.prefix)
    const s = await openAddOwner(page)
    await s.getByLabel(/^Full name/).fill(`Owner ${e2e.prefix} Dup`)
    await s.getByLabel(/^Phone/).fill(existing.phone.slice(3))
    await s.getByRole("button", { name: "Create owner" }).click()
    await expect(page.getByText(/phone.*already|already.*phone/i).first()).toBeVisible()
  })

  const shapes: Array<[string, (d: string) => string]> = [
    ["98765 43210", (d) => `${d.slice(0, 5)} ${d.slice(5)}`],
    ["+91 98765-43210", (d) => `+91 ${d.slice(0, 5)}-${d.slice(5)}`],
    ["09876543210", (d) => `0${d}`],
  ]
  for (const [label, format] of shapes) {
    test(`@regression OWN-05 phone shaped "${label}" is normalised to E.164`, async ({ page, e2e, db }) => {
      const digits = randomPhone().slice(3)
      const s = await openAddOwner(page)
      await s.getByLabel(/^Full name/).fill(`Owner ${e2e.prefix} Ph`)
      await s.getByLabel(/^Phone/).fill(format(digits))
      await s.getByRole("button", { name: "Create owner" }).click()
      await expect(toast(page, "Owner created")).toBeVisible()
      expect(await db.select("owners", `phone=eq.${encodeURIComponent(`+91${digits}`)}`, "id")).toHaveLength(1)
    })
  }

  for (const bad of ["987654321", "98765abcde", "1234500001"]) {
    test(`@regression OWN-05 phone "${bad}" is rejected`, async ({ page }) => {
      if (bad === "1234500001") bug("VAL-1") // Indian mobiles start with 6-9
      const s = await openAddOwner(page)
      await s.getByLabel(/^Full name/).fill("Owner bad phone")
      await s.getByLabel(/^Phone/).fill(bad)
      await s.getByRole("button", { name: "Create owner" }).click()
      await expect(s.getByText("Enter a 10-digit mobile number")).toBeVisible()
    })
  }

  test("@regression OWN-06 invalid email rejected; Unicode name stored intact", async ({ page, e2e, db }) => {
    // The Unicode create goes first: the create form keeps an unsent draft
    // (IndexedDB), so a blocked submit with a bad email would be restored into
    // the next form and block that one too.
    const name = `Zoë 😀 ராஜ் ${e2e.prefix}`
    const phone = randomPhone()
    let s = await openAddOwner(page)
    await s.getByLabel(/^Full name/).fill(name)
    await s.getByLabel(/^Phone/).fill(phone.slice(3))
    await s.getByRole("button", { name: "Create owner" }).click()
    await expect(toast(page, "Owner created")).toBeVisible()
    expect((await db.one("owners", `phone=eq.${encodeURIComponent(phone)}`, "full_name")).full_name).toBe(name)
    await expect(s).toBeHidden()

    s = await openAddOwner(page)
    await s.getByLabel(/^Full name/).fill("Owner bad email")
    await s.getByLabel(/^Phone/).fill(randomPhone().slice(3))
    await s.getByLabel("Email").fill("not-an-email")
    await s.getByRole("button", { name: "Create owner" }).click()
    // type="email": the browser blocks the submit.
    expect(await s.getByLabel("Email").evaluate((el) => (el as HTMLInputElement).validity.valid)).toBe(false)
    await expect(s).toBeVisible()
  })

  test("@regression OWN-07 HTML in name and notes is shown as text", async ({ page, api, e2e }) => {
    const payload = `<img src=x onerror="window.__xss=1">${e2e.prefix}`
    const o = await api.createOwner(e2e.prefix, { fullName: payload, notes: payload })
    await page.goto(`/owners/${o.id}`)
    await expect(page.getByText(payload).first()).toBeVisible()
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined()
  })

  test("@smoke OWN-08 edit an owner; changes persist after reload", async ({ page, api, e2e, db }) => {
    const o = await api.createOwner(e2e.prefix)
    await page.goto(`/owners/${o.id}`)
    await page.getByRole("button", { name: /^Edit/ }).click()
    const s = sheet(page, "Edit owner")
    await s.getByLabel("City").fill("Mysuru")
    await s.getByRole("button", { name: "Save changes" }).click()
    await expect(toast(page, "Owner updated")).toBeVisible()
    await page.reload()
    await expect(page.getByText("Mysuru").first()).toBeVisible()
    expect((await db.one("owners", `id=eq.${o.id}`, "city")).city).toBe("Mysuru")
  })

  test("@regression OWN-09 search by part of name, phone and city, any case", async ({ page, api, e2e }) => {
    const o = await api.createOwner(e2e.prefix, { fullName: `Owner ${e2e.prefix} Searchme`, city: `Cty${e2e.prefix.slice(-4)}` })
    await page.goto("/owners")
    const search = page.getByRole("searchbox", { name: "Search owners" })
    for (const term of ["SEARCHME", o.phone.slice(-6), `cty${e2e.prefix.slice(-4)}`.toUpperCase()]) {
      await search.fill(term)
      await expect(page.getByRole("link", { name: `Owner ${e2e.prefix} Searchme` }).first()).toBeVisible()
    }
    await search.fill(`zz-no-match-${e2e.prefix}`)
    await expect(page.getByText("No owners found")).toBeVisible()
  })

  for (const term of ["%", "_", "(", '"']) {
    test(`@regression OWN-10 searching "${term}" does not break the page`, async ({ page }) => {
      bug("VAL-5")
      await page.goto("/owners")
      await page.getByRole("searchbox", { name: "Search owners" }).fill(term)
      await page.waitForTimeout(800) // debounce
      await expect(page.getByText(/Couldn.t load|temporarily unavailable/i)).toHaveCount(0)
    })
  }

  test("@regression OWN-11 owner with an unsold car cannot be deactivated", async ({ page, api, e2e }) => {
    const o = await api.createOwner(e2e.prefix)
    await api.createVehicle(e2e.prefix, { ownerId: o.id })
    await page.goto(`/owners/${o.id}`)
    await page.getByRole("button", { name: "Deactivate" }).click()
    await page.getByRole("dialog", { name: "Deactivate owner?" }).getByRole("button", { name: "Deactivate" }).click()
    await expect(page.getByText(/1 unsold car/).first()).toBeVisible()
  })

  test("@regression OWN-11b owner whose cars were all dropped can be deactivated", async ({ page, api, e2e }) => {
    bug("FN-5")
    const o = await api.createOwner(e2e.prefix)
    const v = await api.createVehicle(e2e.prefix, { ownerId: o.id })
    await api.setVehicleStatus(v.id, "dropped", "owner withdrew")
    await page.goto(`/owners/${o.id}`)
    await page.getByRole("button", { name: "Deactivate" }).click()
    await page.getByRole("dialog", { name: "Deactivate owner?" }).getByRole("button", { name: "Deactivate" }).click()
    await expect(toast(page, "Owner deactivated")).toBeVisible()
  })

  test("@smoke OWN-12 deactivate an owner with no cars", async ({ page, api, e2e }) => {
    const o = await api.createOwner(e2e.prefix)
    await page.goto(`/owners/${o.id}`)
    await page.getByRole("button", { name: "Deactivate" }).click()
    await page.getByRole("dialog", { name: "Deactivate owner?" }).getByRole("button", { name: "Deactivate" }).click()
    await expect(toast(page, "Owner deactivated")).toBeVisible()
    await expect(page).toHaveURL(/\/owners$/)
    expect((await api.call("GET", `/owners/${o.id}`)).status).toBe(404)
  })

  test("@regression OWN-13 a deactivated owner's phone can be reused", async ({ api, e2e }) => {
    const o = await api.createOwner(e2e.prefix)
    await api.ok("DELETE", `/owners/${o.id}`)
    const res = await api.call("POST", "/owners", { fullName: `Owner ${e2e.prefix} Reuse`, phone: o.phone })
    expect(res.status).toBe(201)
  })

  test("@regression OWN-14 pagination: page 2 has the rest, no overlap", async ({ page, api, e2e }) => {
    const tag = `Pg${e2e.prefix.slice(-5)}`
    test.setTimeout(120_000)
    await Promise.all(
      Array.from({ length: 27 }, (_, i) => api.createOwner(e2e.prefix, { fullName: `Owner ${tag} ${String(i).padStart(2, "0")}` }))
    )
    await page.goto(`/owners?q=${tag}`)
    const names = page.getByRole("link", { name: new RegExp(`Owner ${tag}`) })
    await expect(page.getByText("Page 1 of 2")).toBeVisible()
    const first = await names.allTextContents()
    await page.getByLabel("Go to next page").click()
    await expect(page.getByText("Page 2 of 2")).toBeVisible()
    await expect(names.first()).not.toHaveText(first[0]!)
    const second = await names.allTextContents()
    expect(first.length + second.length).toBe(27)
    expect(second.filter((n) => first.includes(n))).toEqual([])
  })

  test("@regression OWN-15 cancelling the add sheet resets the form", async ({ page }) => {
    bug("FN-17")
    const s = await openAddOwner(page)
    await s.getByLabel(/^Full name/).fill("Half typed")
    await s.getByRole("button", { name: "Cancel" }).click()
    await expect(s).toBeHidden()
    await page.getByRole("button", { name: "Add owner" }).click()
    await expect(s.getByLabel(/^Full name/)).toHaveValue("")
    await expect(s.getByText("Enter a 10-digit mobile number")).toHaveCount(0)
  })
})
