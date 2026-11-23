/**
 * Notifications, seen by the run's salesperson: assigning them a lead is what
 * notifies them. One salesperson per run, so these run in order.
 */
import type { Page } from "@playwright/test"
import { test, expect, signIn } from "../fixtures"
import { register } from "../support/db"
import { createStaff, SALES_ROLE_ID } from "../support/provision"

test.describe.configure({ mode: "serial" })
test.use({ storageState: { cookies: [], origins: [] } })

const bell = (page: Page) => page.getByRole("button", { name: /^(\d+ unread notifications|Notifications)$/ })

async function unreadInDb(db: typeof import("../support/db"), userId: string): Promise<number> {
  return (await db.select("notifications", `user_id=eq.${userId}&is_read=eq.false`, "id")).length
}

test.describe("notifications", () => {
  test("@smoke NOTIF-01 assigning a lead notifies the salesperson; badge matches the DB", async ({ page, api, e2e, db }) => {
    const lead = await api.createLead(e2e.prefix)
    await api.ok("PUT", `/leads/${lead.id}/assignment`, { assignedTo: e2e.salesId })
    await expect.poll(() => unreadInDb(db, e2e.salesId)).toBeGreaterThan(0)

    await signIn(page, e2e.salesEmail, e2e.salesPassword)
    const unread = await unreadInDb(db, e2e.salesId)
    await expect(bell(page)).toHaveAccessibleName(`${unread} unread notifications`)
  })

  test("@smoke NOTIF-02 a notification opens its lead", async ({ page, api, e2e }) => {
    const lead = await api.createLead(e2e.prefix)
    await api.ok("PUT", `/leads/${lead.id}/assignment`, { assignedTo: e2e.salesId })
    await signIn(page, e2e.salesEmail, e2e.salesPassword)
    await bell(page).click()
    const drawer = page.getByRole("dialog", { name: "Notifications" })
    await expect(drawer).toBeVisible()
    // Newest first: expand the top item and follow its lead link.
    await drawer.getByRole("button").filter({ hasNotText: /Mark all read|Close/ }).first().click()
    const viewLead = drawer.locator(`a[href="/leads/${lead.id}"]`)
    await expect(viewLead).toBeVisible()
    await viewLead.click()
    await expect(page).toHaveURL(new RegExp(`/leads/${lead.id}$`))
  })

  test("@regression NOTIF-03 Mark all read clears the badge without a reload", async ({ page, e2e, db }) => {
    await signIn(page, e2e.salesEmail, e2e.salesPassword)
    test.skip((await unreadInDb(db, e2e.salesId)) === 0, "nothing unread to clear")
    await bell(page).click()
    const drawer = page.getByRole("dialog", { name: "Notifications" })
    await drawer.getByRole("button", { name: "Mark all read" }).click()
    await expect(drawer.getByRole("button", { name: "Mark all read" })).toBeHidden()
    await page.keyboard.press("Escape")
    await expect(bell(page)).toHaveAccessibleName("Notifications")
    await expect.poll(() => unreadInDb(db, e2e.salesId)).toBe(0)
  })

  // Its own salesperson: other tests notify the run's admin and salesperson,
  // so they almost never have an empty list.
  test("@regression NOTIF-05 a user with no notifications sees a friendly empty state", async ({ page, e2e, db }) => {
    const u = await createStaff(e2e.prefix, `n05-${Date.now().toString(36)}`, SALES_ROLE_ID)
    register("user", u.id)
    expect(await db.select("notifications", `user_id=eq.${u.id}`, "id")).toHaveLength(0)
    await signIn(page, u.email, u.password)
    await bell(page).click()
    await expect(page.getByRole("dialog", { name: "Notifications" }).getByText("No notifications yet")).toBeVisible()
  })
})
