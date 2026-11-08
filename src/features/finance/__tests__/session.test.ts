import { afterEach, describe, expect, it, vi } from "vitest"

const cookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() }
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }))

const { setFinanceSession, clearFinanceSession, safeNextPath, FINANCE_COOKIE } = await import("../session")

describe("finance session cookie", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it("is httpOnly, strict, site-wide and lives at most 8 hours", async () => {
    await setFinanceSession("tok")
    expect(cookieStore.set).toHaveBeenCalledWith(FINANCE_COOKIE, "tok", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/",
      maxAge: 28800,
    })
  })

  it("is secure in production", async () => {
    vi.stubEnv("NODE_ENV", "production")
    await setFinanceSession("tok")
    expect(cookieStore.set.mock.calls[0]?.[2]).toMatchObject({ secure: true })
  })

  it("is deleted by name and path", async () => {
    await clearFinanceSession()
    expect(cookieStore.delete).toHaveBeenCalledWith({ name: FINANCE_COOKIE, path: "/" })
  })

  it.each([
    ["/vehicles/1?tab=money", "/vehicles/1?tab=money"],
    ["//evil.example", "/finance"],
    ["/\\evil.example", "/finance"],
    ["https://evil.example", "/finance"],
    ["/api/finance/locked", "/finance"],
    ["/finance/unlock?next=/x", "/finance"],
    [undefined, "/finance"],
  ])("safeNextPath(%j) → %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected)
  })
})
