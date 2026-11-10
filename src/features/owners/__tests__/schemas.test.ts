import { describe, expect, it } from "vitest"
import { createOwnerSchema } from "../schemas"

const base = { fullName: "Ravi Kumar", phone: "9876543210" }

describe("createOwnerSchema", () => {
  it("accepts a 10-digit phone and sends E.164", () => {
    expect(createOwnerSchema.parse(base).phone).toBe("+919876543210")
  })

  it("treats a blank or null alt phone as none", () => {
    expect(createOwnerSchema.parse({ ...base, altPhone: "" }).altPhone).toBeNull()
    expect(createOwnerSchema.parse({ ...base, altPhone: null }).altPhone).toBeNull()
  })

  it("normalises the alt phone too", () => {
    expect(createOwnerSchema.parse({ ...base, altPhone: "098765 43211" }).altPhone).toBe(
      "+919876543211"
    )
  })

  it("rejects a short phone", () => {
    expect(createOwnerSchema.safeParse({ ...base, phone: "98765" }).success).toBe(false)
    expect(createOwnerSchema.safeParse({ ...base, altPhone: "123" }).success).toBe(false)
  })

  it("re-parses its own output (actions validate again)", () => {
    const once = createOwnerSchema.parse({ ...base, altPhone: "" })
    expect(createOwnerSchema.parse(once)).toEqual(once)
  })
})
