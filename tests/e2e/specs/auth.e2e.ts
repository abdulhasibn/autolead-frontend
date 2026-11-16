import { test, expect } from "../fixtures"

test.describe("auth", () => {
  test.describe("signed out", () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test("@smoke logs in with valid credentials", async ({ page, e2e }) => {
      await page.goto("/login")
      await page.getByLabel("Email address").fill(e2e.email)
      await page.getByLabel("Password", { exact: true }).fill(e2e.password)
      await page.getByRole("button", { name: /sign in/i }).click()
      await expect(page).toHaveURL(/\/dashboard/)
    })

    test("@regression rejects invalid credentials", async ({ page, e2e }) => {
      await page.goto("/login")
      await page.getByLabel("Email address").fill(e2e.email)
      await page.getByLabel("Password", { exact: true }).fill("definitely-wrong-password")
      await page.getByRole("button", { name: /sign in/i }).click()
      await expect(page.getByText("Invalid email or password")).toBeVisible()
      await expect(page).toHaveURL(/\/login/)
    })

    test("@regression redirects protected routes to login with callbackUrl", async ({ page }) => {
      await page.goto("/leads")
      await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fleads/)
    })
  })

  test.describe("sign out", () => {
    // Signing out revokes the session on the API. Use a dedicated login so the
    // shared storageState session used by parallel tests is never revoked.
    test.use({ storageState: { cookies: [], origins: [] } })

    test("@regression signs out and returns to login", async ({ page, e2e }) => {
      await page.goto("/login")
      await page.getByLabel("Email address").fill(e2e.email)
      await page.getByLabel("Password", { exact: true }).fill(e2e.password)
      await page.getByRole("button", { name: /sign in/i }).click()
      await expect(page).toHaveURL(/\/dashboard/)

      await page.getByRole("button", { name: "User menu" }).click()
      await page.getByRole("menuitem", { name: "Sign out", exact: true }).click()
      await expect(page).toHaveURL(/\/login/)

      await page.goto("/leads")
      await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fleads/)
    })
  })
})
