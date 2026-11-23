import { beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError } from "@/lib/api-error"

const api = vi.hoisted(() => ({
  getLead: vi.fn(),
  getLeadFollowUps: vi.fn(),
  getLeadStatusHistory: vi.fn(),
  getLeadVehicleMatches: vi.fn(),
}))

vi.mock("@/lib/env", () => ({ env: { API_BASE_URL: "http://api.test" } }))
vi.mock("@/lib/auth",() => ({ auth: vi.fn().mockResolvedValue(null) }))
vi.mock("@/features/leads/api", () => api)
vi.mock("@/features/leads/vehicle-options", () => ({ getVehicleOptions: vi.fn().mockResolvedValue([]) }))
vi.mock("@/features/catalog/api", () => ({ getMakes: vi.fn().mockResolvedValue({ items: [] }) }))
vi.mock("@/features/insights/api", () => ({ getLeadJourney: vi.fn().mockResolvedValue(null) }))

import LeadDetailPage from "@/app/(dashboard)/leads/[id]/page"

const notFoundError = (status: number) => new ApiError(status, "NOT_FOUND", "missing")

describe("lead detail page for an unknown lead", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Every call about an unknown lead answers 404. The page must still end in
  // notFound() even when a sibling call rejects before getLead does.
  it.each([404, 422])("shows not-found when getLead is %i and a sibling call rejects first", async (status) => {
    api.getLead.mockImplementation(() => new Promise((_, reject) => setTimeout(() => reject(notFoundError(status)), 20)))
    api.getLeadFollowUps.mockRejectedValue(notFoundError(404))
    api.getLeadStatusHistory.mockRejectedValue(notFoundError(404))
    api.getLeadVehicleMatches.mockRejectedValue(notFoundError(404))

    const result = await LeadDetailPage({ params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000000" }) }).catch(
      (err: unknown) => err
    )

    expect(result).toBeInstanceOf(Error)
    expect(String((result as { digest?: string }).digest)).toContain("404")
  })

  it("rethrows other lead errors", async () => {
    api.getLead.mockRejectedValue(new ApiError(500, "INTERNAL_ERROR", "boom"))
    api.getLeadFollowUps.mockResolvedValue({ items: [] })

    await expect(LeadDetailPage({ params: Promise.resolve({ id: "x" }) })).rejects.toMatchObject({ status: 500 })
  })
})
