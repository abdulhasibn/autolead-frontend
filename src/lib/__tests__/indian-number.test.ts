import { describe, expect, it } from "vitest"

import { formatIndianNumberText, groupIndian, reformatWithCaret, stripGrouping } from "../indian-number"

describe("groupIndian", () => {
  it.each([
    ["", ""],
    ["7", "7"],
    ["999", "999"],
    ["1000", "1,000"],
    ["42150", "42,150"],
    ["100000", "1,00,000"],
    ["1234567", "12,34,567"],
    ["123456789", "12,34,56,789"],
    ["000450", "450"],
    ["0", "0"],
  ])("%s → %s", (input, expected) => {
    expect(groupIndian(input)).toBe(expected)
  })
})

describe("formatIndianNumberText", () => {
  it("cleans pasted money text", () => {
    expect(formatIndianNumberText("₹5,45,000/-")).toBe("5,45,000")
    expect(formatIndianNumberText("Rs. 6 50 000")).toBe("6,50,000")
  })

  it("drops decimals unless allowed", () => {
    expect(formatIndianNumberText("1250.50")).toBe("1,25,050")
    expect(formatIndianNumberText("1250.50", { allowDecimal: true })).toBe("1,250.50")
    expect(formatIndianNumberText("1250.567", { allowDecimal: true })).toBe("1,250.56")
    expect(formatIndianNumberText(".5", { allowDecimal: true })).toBe("0.5")
    expect(formatIndianNumberText("12.3.4", { allowDecimal: true })).toBe("12.34")
  })

  it("round-trips through stripGrouping", () => {
    expect(Number(stripGrouping(formatIndianNumberText("650000")))).toBe(650000)
  })
})

describe("reformatWithCaret", () => {
  it("keeps the caret at the end while typing", () => {
    // "6,5000" was "65,000" + typed "0" at the end → 6,50,000, caret at end.
    expect(reformatWithCaret("65,0000", 7)).toEqual({ value: "6,50,000", caret: 8 })
  })

  it("keeps the caret after an inserted middle digit", () => {
    // "12,34,567" → type "9" after "12," → "12,934,567"
    const r = reformatWithCaret("12,934,567", 4)
    expect(r.value).toBe("1,29,34,567")
    // Three digits (1,2,9) sit before the caret.
    expect(r.value.slice(0, r.caret).replace(/,/g, "")).toBe("129")
  })

  it("keeps the caret after deleting a middle digit", () => {
    // "12,34,567" → backspace the "3" → "12,4,567", caret was after "12,"
    const r = reformatWithCaret("12,4,567", 3)
    expect(r.value).toBe("1,24,567")
    expect(r.value.slice(0, r.caret).replace(/,/g, "")).toBe("12")
  })

  it("handles leading zeros", () => {
    expect(reformatWithCaret("05", 2)).toEqual({ value: "5", caret: 1 })
  })
})
