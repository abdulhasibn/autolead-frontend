import { describe, expect, it } from "vitest"
import { defaultPurpose, isPurchaseTagName, nextPurpose, purposeForSave, purposeOptions } from "../logic/purpose"

describe("purpose defaults", () => {
  it("defaults by kind when a car is linked, general without one", () => {
    expect(defaultPurpose("expense", true)).toBe("cost")
    expect(defaultPurpose("income", true)).toBe("sale")
    expect(defaultPurpose("expense", false)).toBe("general")
    expect(defaultPurpose("income", false)).toBe("general")
  })

  it("offers options that fit the kind and car", () => {
    expect(purposeOptions("expense", true)).toEqual(["cost", "purchase"])
    expect(purposeOptions("income", true)).toEqual(["sale", "other"])
    expect(purposeOptions("expense", false)).toEqual(["general"])
  })
})

describe("nextPurpose", () => {
  it("is always general without a car", () => {
    expect(nextPurpose({ kind: "expense", hasCar: false, current: "purchase", userPicked: true, carChanged: true })).toBe("general")
  })

  it("resets to the default when a car is linked", () => {
    expect(nextPurpose({ kind: "expense", hasCar: true, current: "general", userPicked: false, carChanged: true })).toBe("cost")
    expect(nextPurpose({ kind: "income", hasCar: true, current: "general", userPicked: false, carChanged: true })).toBe("sale")
  })

  it("resets on moving to another car unless the admin picked one", () => {
    expect(nextPurpose({ kind: "expense", hasCar: true, current: "purchase", userPicked: false, carChanged: true })).toBe("cost")
    expect(nextPurpose({ kind: "expense", hasCar: true, current: "purchase", userPicked: true, carChanged: true })).toBe("purchase")
  })

  it("drops a hand-picked purpose that no longer fits", () => {
    expect(nextPurpose({ kind: "income", hasCar: true, current: "purchase", userPicked: true })).toBe("sale")
  })

  it("preselects purchase when the Purchase tag is added to a car-linked expense", () => {
    expect(nextPurpose({ kind: "expense", hasCar: true, current: "cost", userPicked: false, purchaseTagAdded: true })).toBe("purchase")
  })

  it("leaves a hand-picked purpose alone when the Purchase tag is added", () => {
    expect(nextPurpose({ kind: "expense", hasCar: true, current: "cost", userPicked: true, purchaseTagAdded: true })).toBe("cost")
  })

  it("ignores the Purchase tag on income and on entries without a car", () => {
    expect(nextPurpose({ kind: "income", hasCar: true, current: "sale", userPicked: false, purchaseTagAdded: true })).toBe("sale")
    expect(nextPurpose({ kind: "expense", hasCar: false, current: "general", userPicked: false, purchaseTagAdded: true })).toBe("general")
  })

  it("matches the Purchase tag ignoring case and spaces", () => {
    expect(isPurchaseTagName(" purchase ")).toBe(true)
    expect(isPurchaseTagName("Purchase")).toBe(true)
    expect(isPurchaseTagName("Purchase tax")).toBe(false)
  })

  it("sends no purpose for business entries", () => {
    expect(purposeForSave("general", false)).toBeNull()
    expect(purposeForSave("purchase", true)).toBe("purchase")
  })
})
