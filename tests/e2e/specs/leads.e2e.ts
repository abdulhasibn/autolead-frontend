import { test, expect } from "../fixtures"

test.describe("leads", () => {
  test("@smoke leads list renders the provisioned lead", async ({ page, e2e }) => {
    await page.goto("/leads")
    await expect(page.getByRole("heading", { name: "Leads", level: 1 })).toBeVisible()
    await expect(page.getByRole("link", { name: e2e.leadName })).toBeVisible()
  })

  test("@smoke opens a lead detail from the list", async ({ page, e2e }) => {
    await page.goto("/leads")
    await page.getByRole("link", { name: e2e.leadName }).click()
    await expect(page).toHaveURL(new RegExp(`/leads/${e2e.leadId}$`))
    await expect(page.getByRole("heading", { name: e2e.leadName, level: 1 })).toBeVisible()
  })
})
