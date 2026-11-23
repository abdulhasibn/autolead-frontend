import { describe, expect, it } from "vitest"
import { indianPhoneFormSchema, normalizeIndianPhone, optionalIndianPhoneFormSchema } from "../phone"

describe("normalizeIndianPhone", () => {
  it.each(["9876543210", "98765 43210", "098765-43210", "919876543210", "+91 98765 43210", "+919876543210", " (98765) 43210 "])(
    "reads %s as +919876543210",
    (typed) => {
      expect(normalizeIndianPhone(typed)).toBe("+919876543210")
    }
  )

  it("accepts every first digit 6 to 9 and nothing lower", () => {
    for (const d of ["6", "7", "8", "9"]) expect(normalizeIndianPhone(`${d}000000000`)).toBe(`+91${d}000000000`)
    for (const d of ["0", "1", "2", "5"]) expect(normalizeIndianPhone(`${d}234500001`)).toBeNull()
  })

  it.each(["987654321", "98765432101", "98765abcde", "1234500001", "+447700900123", "+911234567890", "+0123", ""])(
    "rejects %s",
    (typed) => {
      expect(normalizeIndianPhone(typed)).toBeNull()
    }
  )

  it("accepts the E2E helper shape +9199 followed by 8 digits", () => {
    expect(normalizeIndianPhone("+919912345678")).toBe("+919912345678")
  })
})

describe("phone form schemas", () => {
  it("uses the 10-digit message for a non-mobile", () => {
    const result = indianPhoneFormSchema.safeParse("1234500001")
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("Enter a 10-digit mobile number")
  })

  it("optional phone: blank is none, a given value must be a mobile", () => {
    expect(optionalIndianPhoneFormSchema.parse("")).toBeNull()
    expect(optionalIndianPhoneFormSchema.parse(null)).toBeNull()
    expect(optionalIndianPhoneFormSchema.parse("98765 43210")).toBe("+919876543210")
    const bad = optionalIndianPhoneFormSchema.safeParse("1234500001")
    expect(bad.success).toBe(false)
    expect(bad.error?.issues[0]?.message).toBe("Enter a 10-digit mobile number")
  })
})
