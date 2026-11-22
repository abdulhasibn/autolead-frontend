import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApiError } from "@/lib/api-error"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "u1" } })) }))
vi.mock("@/lib/env", () => ({ env: {} }))
vi.mock("../api", () => ({
  sellVehicleToLead: vi.fn(),
  associateVehicle: vi.fn(),
  changeLeadStatus: vi.fn(),
}))

const api = await import("../api")
const { markVehicleSoldAction } = await import("../actions")

const VEHICLE = "11111111-1111-4111-8111-111111111111"
const LEAD = "22222222-2222-4222-8222-222222222222"

describe("markVehicleSoldAction (#33)", () => {
  beforeEach(() => vi.clearAllMocks())

  it("sells in one API call and never walks the steps itself", async () => {
    vi.mocked(api.sellVehicleToLead).mockResolvedValue({ status: "converted", vehicleSold: true })

    const result = await markVehicleSoldAction({ vehicleId: VEHICLE, leadId: LEAD, notes: "  " })

    expect(result.ok).toBe(true)
    expect(api.sellVehicleToLead).toHaveBeenCalledExactlyOnceWith(LEAD, {
      vehicleId: VEHICLE,
      notes: null,
    })
    expect(api.associateVehicle).not.toHaveBeenCalled()
    expect(api.changeLeadStatus).not.toHaveBeenCalled()
  })

  it("returns the API's error", async () => {
    vi.mocked(api.sellVehicleToLead).mockRejectedValue(
      new ApiError(422, "VEHICLE_NOT_LINKABLE", "Only open or linked vehicles can be linked")
    )

    const result = await markVehicleSoldAction({ vehicleId: VEHICLE, leadId: LEAD })

    expect(result).toMatchObject({ ok: false, error: { code: "VEHICLE_NOT_LINKABLE" } })
  })

  it("rejects bad input without calling the API", async () => {
    const result = await markVehicleSoldAction({ vehicleId: "nope", leadId: LEAD })
    expect(result.ok).toBe(false)
    expect(api.sellVehicleToLead).not.toHaveBeenCalled()
  })
})
