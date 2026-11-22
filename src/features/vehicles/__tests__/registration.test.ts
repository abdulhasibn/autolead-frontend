import { describe, expect, it } from "vitest"
import { normalizeRegistration, updateVehicleSchema, vehicleFormSchema } from "../schemas"

const plate = (registrationNumber: string) =>
  vehicleFormSchema.shape.registrationNumber.safeParse(registrationNumber)

describe("registration number (same rule as the API, #30)", () => {
  it.each(["QA-01-AB-0001", "qa 01-ab 0001", "QA.01/AB0001", "QA01AB0001"])(
    "turns %j into one canonical plate",
    (input) => {
      expect(normalizeRegistration(input)).toBe("QA01AB0001")
      expect(plate(input)).toMatchObject({ success: true, data: "QA01AB0001" })
    }
  )

  it("rejects other symbols", () => {
    expect(plate("KA01@1234").success).toBe(false)
  })

  it("requires a value and caps it at 16 characters", () => {
    expect(plate(" - ").success).toBe(false)
    expect(plate("AB-CD-EF-GH-IJ-KL-MN-OP")).toMatchObject({ success: true, data: "ABCDEFGHIJKLMNOP" })
    expect(plate("ABCDEFGHIJKLMNOPQ").success).toBe(false)
  })

  it("normalises the Server Action payload too", () => {
    const parsed = updateVehicleSchema.shape.registrationNumber.safeParse("ka-01-ab-1234")
    expect(parsed).toMatchObject({ success: true, data: "KA01AB1234" })
  })
})
