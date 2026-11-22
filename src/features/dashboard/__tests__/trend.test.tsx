import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { KpiCard } from "@/app/(dashboard)/dashboard/_components/kpi-card"
import { trendDelta } from "../format"

describe("trendDelta", () => {
  it("shows counts as an absolute difference, even between 0 and 1", () => {
    expect(trendDelta(1, 0)).toEqual({ direction: "up", label: "+1" })
    expect(trendDelta(0, 1)).toEqual({ direction: "down", label: "-1" })
    expect(trendDelta(9, 0)).toEqual({ direction: "up", label: "+9" })
  })

  it("shows rates in percentage points", () => {
    expect(trendDelta(0.15, 0.1, "rate")).toEqual({ direction: "up", label: "+5pp" })
    expect(trendDelta(0.1, 0.15, "rate")).toEqual({ direction: "down", label: "-5pp" })
  })

  it("is neutral when unchanged or missing", () => {
    expect(trendDelta(3, 3).direction).toBe("neutral")
    expect(trendDelta(null, 2).direction).toBe("neutral")
    expect(trendDelta(2, null, "rate").direction).toBe("neutral")
  })
})

describe("KpiCard trend", () => {
  it("formats a count trend as a count", () => {
    render(<KpiCard label="Visitors" value={1} previous={0} showTrend />)
    expect(screen.getByText("+1", { exact: false })).toBeInTheDocument()
    expect(screen.getByText("vs 0 last period")).toBeInTheDocument()
    expect(screen.queryByText(/pp/)).not.toBeInTheDocument()
  })

  it("formats a rate trend in percent and pp", () => {
    render(<KpiCard label="Conversion" value={0.15} display="15%" previous={0.1} kind="rate" showTrend />)
    expect(screen.getByText("+5pp", { exact: false })).toBeInTheDocument()
    expect(screen.getByText("vs 10% last period")).toBeInTheDocument()
  })
})
