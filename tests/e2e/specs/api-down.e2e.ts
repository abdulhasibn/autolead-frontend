import { test, expect, bug } from "../fixtures"

// Runs against a second CRM server whose API_BASE_URL is unreachable
// (project "api-down" in playwright.config.ts).
test.use({ storageState: { cookies: [], origins: [] } })

test("@regression AUTH-16 sign in while the API is down shows a server error, not 'wrong password'", async ({ page }) => {
  bug("FN-3")
  await page.goto("/login")
  await page.getByLabel("Email address").fill("someone@example.com")
  await page.getByLabel("Password", { exact: true }).fill("any-password-1")
  await page.getByRole("button", { name: /sign in/i }).click()
  await expect(page.getByRole("alert").filter({ hasText: /server|reach|unavailable|try again later/i })).toBeVisible()
  await expect(page.getByText(/Invalid email or password/)).toHaveCount(0)
})
