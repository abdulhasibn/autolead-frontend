import { describe, expect, it } from "vitest"
import { changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from "../schemas"

const paths = (r: { error?: { issues: { path: PropertyKey[] }[] } }) =>
  r.error?.issues.map((i) => i.path[0]) ?? []

describe("password schemas (#22)", () => {
  it("trims the reset email and rejects a bad one", () => {
    expect(forgotPasswordSchema.parse({ email: " a@b.co " }).email).toBe("a@b.co")
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false)
  })

  it("needs a 6-digit code, 8+ characters and matching passwords to reset", () => {
    const ok = { email: "a@b.co", code: "123456", newPassword: "secret-12", confirmPassword: "secret-12" }
    expect(resetPasswordSchema.safeParse(ok).success).toBe(true)
    expect(paths(resetPasswordSchema.safeParse({ ...ok, code: "12a456" }))).toContain("code")
    expect(paths(resetPasswordSchema.safeParse({ ...ok, newPassword: "short", confirmPassword: "short" }))).toContain(
      "newPassword"
    )
    expect(paths(resetPasswordSchema.safeParse({ ...ok, confirmPassword: "other-123" }))).toContain(
      "confirmPassword"
    )
  })

  it("refuses a new password equal to the current one", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "secret-12",
      newPassword: "secret-12",
      confirmPassword: "secret-12",
    })
    expect(paths(result)).toContain("newPassword")
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "secret-12",
        newPassword: "secret-34",
        confirmPassword: "secret-34",
      }).success
    ).toBe(true)
  })
})
