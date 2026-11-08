import { describe, expect, it } from "vitest"
import { formatMoney, formatMoneyInput, formatSignedMoney, MINUS, parseMoneyInput } from "../logic/money"

describe("formatMoney", () => {
  it("uses Indian grouping", () => {
    expect(formatMoney(545000)).toBe("₹5,45,000")
    expect(formatMoney(12500000)).toBe("₹1,25,00,000")
    expect(formatMoney(0)).toBe("₹0")
  })

  it("keeps up to two decimals", () => {
    expect(formatMoney(1250.5)).toBe("₹1,250.5")
    expect(formatMoney(1250.25)).toBe("₹1,250.25")
  })

  it("shows losses with a real minus sign", () => {
    expect(formatMoney(-15000)).toBe(`${MINUS}₹15,000`)
    expect(formatSignedMoney(15000)).toBe("+₹15,000")
    expect(formatSignedMoney(-15000)).toBe(`${MINUS}₹15,000`)
  })

  it("shows unknown values as a dash, never ₹0", () => {
    expect(formatMoney(null)).toBe("—")
    expect(formatMoney(undefined)).toBe("—")
    expect(formatSignedMoney(null)).toBe("—")
  })

  it("matches the client's example: 5,00,000 + 45,000 landing, sold at 5,60,000", () => {
    const landing = 500000 + 45000
    expect(formatMoney(landing)).toBe("₹5,45,000")
    expect(formatMoney(560000 - landing)).toBe("₹15,000")
  })
})

describe("parseMoneyInput", () => {
  it.each([
    ["5,45,000", 545000],
    ["545000", 545000],
    ["₹ 5 45 000", 545000],
    ["Rs. 5,45,000/-", 545000],
    ["1250.5", 1250.5],
    ["1,250.25", 1250.25],
    [" 45000 ", 45000],
  ])("%s → %d", (raw, expected) => {
    expect(parseMoneyInput(raw)).toBe(expected)
  })

  it.each(["", "abc", "12.345", "5,45,000.0.0", "1e5"])("rejects %j", (raw) => {
    expect(parseMoneyInput(raw)).toBeNull()
  })

  it("round-trips through the input formatter", () => {
    expect(formatMoneyInput(545000)).toBe("5,45,000")
    expect(parseMoneyInput(formatMoneyInput(545000.5))).toBe(545000.5)
    expect(formatMoneyInput(null)).toBe("")
  })
})
