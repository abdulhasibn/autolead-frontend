/** Staff management (admin) and what a salesperson is allowed to reach. */
import { randomBytes } from "node:crypto"
import type { Page } from "@playwright/test"
import { test, expect } from "../fixtures"
import { Api, randomPhone } from "../support/api"
import { register } from "../support/db"
import { ADMIN_ROLE_ID, SALES_ROLE_ID } from "../support/provision"
import { toast } from "../support/ui"

const sheet = (page: Page, name: string | RegExp) => page.getByRole("dialog", { name })

async function openAddStaff(page: Page) {
  await page.goto("/users")
  await page.getByRole("button", { name: "Add staff" }).click()
  const s = sheet(page, "Add staff")
  await expect(s).toBeVisible()
  return s
}

function newStaff(prefix: string, label: string) {
  return {
    fullName: `E2E ${label} ${prefix}`,
    email: `${prefix}-${label}@example.com`.toLowerCase(),
    phone: randomPhone().slice(3),
    password: `Pw-${randomBytes(9).toString("base64url")}`,
  }
}

/** A salesperson created the way the CRM does it (POST /users), registered for cleanup. */
async function addSalesperson(api: Api, prefix: string, label: string) {
  const u = newStaff(prefix, label)
  const created = await api.ok<{ id: string }>("POST", "/users", { ...u, roles: ["salesperson"], showroomId: null })
  register("user", created.id)
  return { ...u, id: created.id }
}

async function roleIds(db: typeof import("../support/db"), userId: string): Promise<string[]> {
  return (await db.select("user_roles", `user_id=eq.${userId}`, "role_id")).map((r: { role_id: string }) => r.role_id)
}

test.describe("users", () => {
  test("@smoke USER-01 add a salesperson; they can sign in", async ({ page, e2e, db }) => {
    const u = newStaff(e2e.prefix, "u01")
    const s = await openAddStaff(page)
    await s.getByLabel("Full name *").fill(u.fullName)
    await s.getByLabel("Phone *").fill(u.phone)
    await s.getByLabel("Email (sign-in) *").fill(u.email)
    await s.getByLabel("First password *").fill(u.password)
    await s.getByRole("checkbox", { name: /Salesperson/ }).check()
    await s.getByRole("button", { name: "Add staff" }).click()
    await expect(toast(page, `${u.fullName} can now sign in.`)).toBeVisible()
    const row = await db.one("users", `email=eq.${u.email}`, "id")
    register("user", row.id)
    expect(await roleIds(db, row.id)).toEqual([SALES_ROLE_ID])
    await expect(page.getByRole("table").getByText(u.fullName)).toBeVisible()
    await Api.login(u.email, u.password) // throws if sign-in fails
  })

  test("@regression USER-02 a duplicate email is refused with a clear message", async ({ page, e2e }) => {
    const u = newStaff(e2e.prefix, "u02")
    const s = await openAddStaff(page)
    await s.getByLabel("Full name *").fill(u.fullName)
    await s.getByLabel("Phone *").fill(u.phone)
    await s.getByLabel("Email (sign-in) *").fill(e2e.salesEmail)
    await s.getByLabel("First password *").fill(u.password)
    await s.getByRole("checkbox", { name: /Salesperson/ }).check()
    await s.getByRole("button", { name: "Add staff" }).click()
    await expect(page.getByText(/already/i).first()).toBeVisible()
    await expect(s).toBeVisible()
  })

  test("@regression USER-03 required fields, short password and no role are caught", async ({ page }) => {
    const s = await openAddStaff(page)
    // Salesperson comes ticked; untick it to leave no role.
    await s.getByRole("checkbox", { name: /Salesperson/ }).uncheck()
    await s.getByRole("button", { name: "Add staff" }).click()
    await expect(s.getByText("Pick at least one role")).toBeVisible()
    await expect(s.getByLabel("Full name *")).toHaveAttribute("aria-invalid", "true")
    await s.getByLabel("Email (sign-in) *").fill("not-an-email")
    await s.getByLabel("First password *").fill("short")
    await s.getByRole("button", { name: "Add staff" }).click()
    await expect(s.getByLabel("Email (sign-in) *")).toHaveAttribute("aria-invalid", "true")
    await expect(s.getByLabel("First password *")).toHaveAttribute("aria-invalid", "true")
    await expect(s).toBeVisible()
  })

  test("@smoke USER-04 promote a salesperson to admin and back", async ({ page, api, e2e, db }) => {
    const staff = await addSalesperson(api, e2e.prefix, "u04")
    await page.goto("/users")
    await page.getByRole("button", { name: `Edit ${staff.fullName}` }).click()
    let s = sheet(page, `Edit ${staff.fullName}`)
    await s.getByRole("checkbox", { name: /Admin/ }).check()
    await s.getByRole("button", { name: "Save" }).click()
    await expect(toast(page, `${staff.fullName} updated.`)).toBeVisible()
    await expect.poll(async () => (await roleIds(db, staff.id)).sort()).toEqual([ADMIN_ROLE_ID, SALES_ROLE_ID].sort())

    await page.getByRole("button", { name: `Edit ${staff.fullName}` }).click()
    s = sheet(page, `Edit ${staff.fullName}`)
    await s.getByRole("checkbox", { name: /Admin/ }).uncheck()
    await s.getByRole("button", { name: "Save" }).click()
    await expect(toast(page, `${staff.fullName} updated.`)).toBeVisible()
    await expect.poll(async () => roleIds(db, staff.id)).toEqual([SALES_ROLE_ID])
  })

  test("@regression USER-05 you can't deactivate yourself", async ({ api, e2e }) => {
    const res = await api.call("DELETE", `/users/${e2e.userId}`)
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)
  })

  test("@smoke USER-07 deactivate a salesperson; they can no longer sign in", async ({ page, api, e2e }) => {
    const staff = await addSalesperson(api, e2e.prefix, "u07")
    await Api.login(staff.email, staff.password)
    await page.goto("/users")
    await page.getByRole("button", { name: `Deactivate ${staff.fullName}` }).click()
    await sheet(page, `Deactivate ${staff.fullName}?`).getByRole("button", { name: "Deactivate" }).click()
    await expect(toast(page, `${staff.fullName} can no longer sign in.`)).toBeVisible()
    await expect(page.getByRole("table").getByText(staff.fullName)).toBeHidden()
    await expect(Api.login(staff.email, staff.password)).rejects.toThrow()
  })

  test("@regression USER-08 a salesperson gets 403 on admin-only APIs", async ({ salesApi, e2e }) => {
    const checks: [string, string, unknown?][] = [
      ["GET", "/users"],
      ["GET", "/insights/traffic"],
      ["GET", "/insights/demand"],
      ["GET", "/finance/vault"],
      ["PUT", `/leads/${e2e.leadId}/assignment`, { assignedTo: e2e.salesId }],
    ]
    for (const [method, path, body] of checks) {
      const res = await salesApi.call(method, path, body)
      expect(res.status, `${method} ${path}`).toBe(403)
    }
  })

  test("@regression USER-09 a salesperson can't read a lead that isn't theirs", async ({ api, salesApi, e2e }) => {
    const lead = await api.createLead(e2e.prefix)
    const res = await salesApi.call("GET", `/leads/${lead.id}`)
    expect(res.status).toBe(404)
  })

  test("@regression USER-10 the users page is admin only in the CRM", async ({ browser, e2e }) => {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await ctx.newPage()
    try {
      const { signIn } = await import("../fixtures")
      await signIn(page, e2e.salesEmail, e2e.salesPassword)
      await expect(page.getByRole("link", { name: "Staff" })).toHaveCount(0)
      await page.goto("/users")
      await expect(page.getByRole("button", { name: "Add staff" })).toHaveCount(0)
    } finally {
      await ctx.close()
    }
  })
})
