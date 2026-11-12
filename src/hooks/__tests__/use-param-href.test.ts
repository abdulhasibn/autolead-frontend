import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

let search = ""

vi.mock("next/navigation", () => ({
  usePathname: () => "/insights",
  useSearchParams: () => new URLSearchParams(search),
}))

import { useParamHref } from "../use-param-href"

describe("useParamHref", () => {
  it("sets the param and keeps the others", () => {
    search = "period=month&tab=traffic"
    const { result } = renderHook(() => useParamHref("tab"))
    expect(result.current("cars")).toBe("/insights?period=month&tab=cars")
  })

  it("adds the param when the URL has none", () => {
    search = ""
    const { result } = renderHook(() => useParamHref("period"))
    expect(result.current("week")).toBe("/insights?period=week")
  })
})
