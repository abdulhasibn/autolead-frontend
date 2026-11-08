import { beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError } from "@/lib/api-error"

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}
const headerStore = new Map<string, string>()
const redirect = vi.fn((url: string) => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT;${url}` })
})
const client = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), del: vi.fn() }

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
  headers: async () => ({ get: (k: string) => headerStore.get(k) ?? null }),
}))
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }))
vi.mock("@/lib/api-client.server", () => ({ serverApiClient: client }))

const { getEntries, getSummarySoft, loadVehicleMoney } = await import("../api")

const LOCKED = new ApiError(423, "FINANCE_LOCKED", "Finance is locked")

describe("finance API wrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    headerStore.clear()
    cookieStore.get.mockReturnValue({ value: "tok-123" })
    cookieStore.delete.mockImplementation(() => undefined)
  })

  it("sends the session header and never caches", async () => {
    client.get.mockResolvedValue({ items: [] })
    await getEntries({ from: "2026-11-01", to: "2026-11-08" })
    expect(client.get).toHaveBeenCalledWith(
      "/finance/entries?from=2026-11-01&to=2026-11-08",
      expect.objectContaining({ cache: "no-store", headers: { "X-Finance-Session": "tok-123" } })
    )
    const options = client.get.mock.calls[0]?.[1]
    expect(options).not.toHaveProperty("revalidate")
    expect(options).not.toHaveProperty("tags")
  })

  it("on 423 in a Server Function: deletes the cookie and redirects to unlock with next", async () => {
    headerStore.set("x-pathname", "/finance/entries?kind=income")
    client.get.mockRejectedValue(LOCKED)
    await expect(getEntries({})).rejects.toThrow("NEXT_REDIRECT")
    expect(cookieStore.delete).toHaveBeenCalledWith({ name: "af_fin", path: "/" })
    expect(redirect).toHaveBeenCalledWith("/finance/unlock?next=%2Ffinance%2Fentries%3Fkind%3Dincome")
  })

  it("on 423 during render (cookies read-only): goes through the clearing route", async () => {
    headerStore.set("x-pathname", "/finance/reports")
    cookieStore.delete.mockImplementation(() => {
      throw new Error("Cookies can only be modified in a Server Action or Route Handler")
    })
    client.get.mockRejectedValue(LOCKED)
    await expect(getEntries({})).rejects.toThrow("NEXT_REDIRECT")
    expect(redirect).toHaveBeenCalledWith("/api/finance/locked?next=%2Ffinance%2Freports")
  })

  it("falls back to the referer, and refuses off-site next targets", async () => {
    headerStore.set("referer", "https://app.example/vehicles/abc?tab=money")
    client.get.mockRejectedValue(LOCKED)
    await expect(getEntries({})).rejects.toThrow("NEXT_REDIRECT")
    expect(redirect).toHaveBeenLastCalledWith("/finance/unlock?next=%2Fvehicles%2Fabc%3Ftab%3Dmoney")

    headerStore.clear()
    headerStore.set("x-pathname", "//evil.example/steal")
    await expect(getEntries({})).rejects.toThrow("NEXT_REDIRECT")
    expect(redirect).toHaveBeenLastCalledWith("/finance/unlock?next=%2Ffinance")
  })

  it("passes other errors through untouched", async () => {
    client.get.mockRejectedValue(new ApiError(422, "DATE_RANGE_TOO_LONG", "too long"))
    await expect(getEntries({})).rejects.toMatchObject({ code: "DATE_RANGE_TOO_LONG" })
    expect(redirect).not.toHaveBeenCalled()
    expect(cookieStore.delete).not.toHaveBeenCalled()
  })

  it("soft mode returns null on 423/403 instead of redirecting", async () => {
    client.get.mockRejectedValue(LOCKED)
    await expect(getSummarySoft()).resolves.toBeNull()
    client.get.mockRejectedValue(new ApiError(403, "FORBIDDEN", "no"))
    await expect(getSummarySoft()).resolves.toBeNull()
    expect(redirect).not.toHaveBeenCalled()
  })

  it("makes no finance call at all without a cookie (vehicle Money tab)", async () => {
    cookieStore.get.mockReturnValue(undefined)
    await expect(loadVehicleMoney("6f1c9a2e-1111-4a6b-9c3d-123456789abc")).resolves.toBeNull()
    expect(client.get).not.toHaveBeenCalled()
  })
})

describe("GET /api/finance/locked", () => {
  it("deletes the cookie and redirects to unlock with a safe next", async () => {
    const { GET } = await import("@/app/api/finance/locked/route")
    const { NextRequest } = await import("next/server")

    const res = GET(new NextRequest("http://localhost:3000/api/finance/locked?next=%2Fvehicles%2F1%3Ftab%3Dmoney"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe("http://localhost:3000/finance/unlock?next=%2Fvehicles%2F1%3Ftab%3Dmoney")
    expect(res.headers.get("set-cookie")).toMatch(/af_fin=;.*Path=\//i)

    const evil = GET(new NextRequest("http://localhost:3000/api/finance/locked?next=https%3A%2F%2Fevil.example"))
    expect(evil.headers.get("location")).toBe("http://localhost:3000/finance/unlock?next=%2Ffinance")
  })
})
