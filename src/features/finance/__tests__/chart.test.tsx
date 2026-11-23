import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { CashFlowChart, PnlChart } from "../components/reports/charts"
import { hasChartData } from "../logic/chart"
import type { CashFlowReport, PnlReport } from "../types"

describe("hasChartData", () => {
  it("is false for nothing or only zeros, true for any real value", () => {
    expect(hasChartData([])).toBe(false)
    expect(hasChartData([0, 0, -0])).toBe(false)
    expect(hasChartData([0, Number.NaN])).toBe(false)
    expect(hasChartData([0, -1200])).toBe(true)
  })
})

const zeroBuckets = [1, 2, 3].map((d) => ({ label: `2001-01-0${d}` }))

describe("empty-period charts", () => {
  it("shows a message instead of a ₹0 to ₹4 axis on the profit chart", () => {
    const report = { period: "day", buckets: zeroBuckets.map((b) => ({ ...b, netProfit: 0 })) } as unknown as PnlReport
    render(<PnlChart report={report} />)
    expect(screen.getByText("No profit or loss in this period")).toBeInTheDocument()
    expect(screen.queryByText(/₹4/)).not.toBeInTheDocument()
  })

  it("shows a message on the cash flow chart", () => {
    const report = {
      period: "day",
      buckets: zeroBuckets.map((b) => ({ ...b, in: 0, out: 0, cumulative: 0 })),
    } as unknown as CashFlowReport
    render(<CashFlowChart report={report} />)
    expect(screen.getByText("No money in or out in this period")).toBeInTheDocument()
  })
})
