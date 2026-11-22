import { test as setup, expect } from "./fixtures"
import { AUTH_FILE } from "./paths"

setup("authenticate", async ({ page, e2e }) => {
  await page.goto("/login")
  await page.getByLabel("Email address").fill(e2e.email)
  await page.getByLabel("Password", { exact: true }).fill(e2e.password)
  await page.getByRole("button", { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await page.context().storageState({ path: AUTH_FILE })
})
