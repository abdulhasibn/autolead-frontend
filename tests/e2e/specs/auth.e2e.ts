import { test, expect, bug, missingUi, signIn } from "../fixtures"
import { Api } from "../support/api"

const INVALID = "Invalid email or password. Please try again."

async function fillLogin(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel("Email address").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
}

test.describe("auth", () => {
  test.describe("signed out", () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test("@smoke AUTH-01 logs in with valid credentials", async ({ page, e2e, consoleErrors }) => {
      await signIn(page, e2e.email, e2e.password)
      await expect(page.getByRole("button", { name: "User menu" })).toBeVisible()
      expect(consoleErrors).toEqual([])
    })

    test("@regression AUTH-02 rejects a wrong password without leaking it", async ({ page, e2e }) => {
      await fillLogin(page, e2e.email, "definitely-wrong-password")
      await page.getByRole("button", { name: /sign in/i }).click()
      await expect(page.getByText(INVALID)).toBeVisible()
      await expect(page).toHaveURL(/\/login/)
      expect(page.url()).not.toContain("definitely-wrong-password")
    })

    test("@regression AUTH-03 unknown email gets the same generic error", async ({ page, e2e }) => {
      await fillLogin(page, `nobody-${e2e.prefix}@example.com`, "whatever-123")
      await page.getByRole("button", { name: /sign in/i }).click()
      await expect(page.getByText(INVALID)).toBeVisible()
    })

    test("@regression AUTH-04 empty fields show inline validation", async ({ page }) => {
      await page.goto("/login")
      await page.getByRole("button", { name: /sign in/i }).click()
      await expect(page.getByText("Enter a valid email address")).toBeVisible()
      await expect(page.getByText("Password is required")).toBeVisible()
      await expect(page).toHaveURL(/\/login/)
    })

    test("@regression AUTH-05 trims and lowercases the email", async ({ page, e2e }) => {
      await fillLogin(page, `  ${e2e.email.toUpperCase()} `, e2e.password)
      await page.getByRole("button", { name: /sign in/i }).click()
      await expect(page).toHaveURL(/\/dashboard/)
    })

    for (const bad of ["admin@", "admin.example.com"]) {
      test(`@regression AUTH-06 malformed email "${bad}" is rejected`, async ({ page }) => {
        await fillLogin(page, bad, "whatever-123")
        await page.getByRole("button", { name: /sign in/i }).click()
        await expect(page.getByText("Enter a valid email address")).toBeVisible()
      })
    }

    test("@regression AUTH-07 double-clicking sign in logs in once", async ({ page, e2e, consoleErrors }) => {
      await fillLogin(page, e2e.email, e2e.password)
      await page.getByRole("button", { name: /sign in/i }).dblclick()
      await expect(page).toHaveURL(/\/dashboard/)
      await expect(page.getByText(INVALID)).toHaveCount(0)
      expect(consoleErrors.filter((e) => !/Failed to load resource/.test(e))).toEqual([])
    })

    for (const path of ["/dashboard", "/leads/LEAD", "/finance"]) {
      test(`@regression AUTH-08 ${path} redirects to login and back`, async ({ page, e2e }) => {
        const target = path.replace("LEAD", e2e.leadId)
        await page.goto(target)
        await expect(page).toHaveURL(new RegExp(`/login\\?callbackUrl=${encodeURIComponent(target)}`))
        await page.getByLabel("Email address").fill(e2e.email)
        await page.getByLabel("Password", { exact: true }).fill(e2e.password)
        await page.getByRole("button", { name: /sign in/i }).click()
        await expect(page).toHaveURL(new RegExp(`${target}$`))
      })
    }

    test("@regression AUTH-12 forgot password leads to a reset form", async ({ page }) => {
      // The link exists but is href="#"; the flow is only in the API.
      bug("MF-3")
      await page.goto("/login")
      await page.getByRole("link", { name: "Forgot password?" }).click()
      await expect(page.getByRole("heading", { name: /reset|forgot/i })).toBeVisible()
    })
    test("@regression AUTH-13 reset with a wrong code (no UI yet)", async () => {
      missingUi("MF-3")
    })
    test("@regression AUTH-14 change password rules (no UI yet)", async () => {
      missingUi("MF-3")
    })
  })

  // Signing out revokes the session on the API. These use their own login so
  // the shared storageState session used by parallel tests stays valid.
  test.describe("own session", () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test("@regression AUTH-09 signs out; Back does not show protected data", async ({ page, e2e }) => {
      await signIn(page, e2e.email, e2e.password)
      await page.goto("/leads")
      await expect(page.getByRole("heading", { name: "Leads", level: 1 })).toBeVisible()
      await page.getByRole("button", { name: "User menu" }).click()
      await page.getByRole("menuitem", { name: "Sign out", exact: true }).click()
      await expect(page).toHaveURL(/\/login/)
      await page.goBack()
      await expect(page).toHaveURL(/\/login/)
      await page.goto("/leads")
      await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fleads/)
    })

    test("@regression AUTH-10 session survives a reload", async ({ page, e2e }) => {
      await signIn(page, e2e.email, e2e.password)
      await page.reload()
      await expect(page).toHaveURL(/\/dashboard/)
      await expect(page.getByRole("button", { name: "User menu" })).toBeVisible()
    })

    test("@regression AUTH-11 signing out in one tab sends the other to login", async ({ page, e2e }) => {
      await signIn(page, e2e.email, e2e.password)
      const other = await page.context().newPage()
      await other.goto("/leads")
      await expect(other.getByRole("heading", { name: "Leads", level: 1 })).toBeVisible()
      await page.getByRole("button", { name: "User menu" }).click()
      await page.getByRole("menuitem", { name: "Sign out", exact: true }).click()
      await expect(page).toHaveURL(/\/login/)
      await other.getByRole("link", { name: "Owners" }).click()
      await expect(other).toHaveURL(/\/login/)
    })

    test("@regression AUTH-15 a tampered session cookie is not accepted", async ({ page, e2e }) => {
      // API side: garbage and expired-looking tokens get 401.
      const garbage = await new Api("garbage.token.x").call("GET", "/auth/me")
      expect(garbage.status).toBe(401)
      // UI side: corrupt the session cookie, next navigation goes to login.
      await signIn(page, e2e.email, e2e.password)
      const cookies = await page.context().cookies()
      const session = cookies.find((c) => /session-token/.test(c.name))
      expect(session, "auth.js session cookie").toBeTruthy()
      await page.context().addCookies([{ ...session!, value: `${session!.value.slice(0, -10)}tampered00` }])
      await page.goto("/leads")
      await expect(page).toHaveURL(/\/login/)
    })
  })
})
