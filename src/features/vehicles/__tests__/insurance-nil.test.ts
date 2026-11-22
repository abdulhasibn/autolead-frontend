import { describe, expect, it } from "vitest"
import { toVehicleDetails, type VehicleFormOutput } from "../schemas"
import { paperworkHealth } from "../utils"

const base = {
  year: 2020,
  registrationNumber: "KA01AB1234",
  fuelType: "petrol",
  transmission: "manual",
  kmDriven: 1000,
  numPreviousOwners: 1,
  colour: "White",
  insuranceValidUntil: "2027-01-01",
  insuranceNil: false,
  rcStatus: null,
  serviceHistory: null,
  accidentHistory: false,
  location: null,
  description: null,
  acquisitionType: "",
} as unknown as VehicleFormOutput

describe("insurance Nil", () => {
  it("sends Nil without a date", () => {
    expect(toVehicleDetails({ ...base, insuranceNil: true })).toMatchObject({
      insuranceNil: true,
      insuranceValidUntil: null,
    })
  })

  it("keeps the date when not Nil", () => {
    expect(toVehicleDetails(base)).toMatchObject({ insuranceNil: false, insuranceValidUntil: "2027-01-01" })
  })

  it("shows Nil apart from not recorded", () => {
    const row = { insuranceValidUntil: null, rcStatus: null, serviceHistory: null, accidentHistory: false }
    expect(paperworkHealth({ ...row, insuranceNil: true })[0]).toMatchObject({ value: "Nil", tone: "bad" })
    expect(paperworkHealth({ ...row, insuranceNil: false })[0]).toMatchObject({ value: "Not recorded" })
  })
})
