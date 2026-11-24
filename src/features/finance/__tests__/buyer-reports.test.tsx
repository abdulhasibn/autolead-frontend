import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { CashFlowReport, DuesReport, FinanceSummary } from "../types"

vi.mock("next/link", () => ({ default: (p: React.ComponentProps<"a">) => <a {...p} /> }))
vi.mock("recharts", async (orig) => ({ ...(await orig<object>()) }))

import { PositionTiles } from "../components/summary-tiles"
import { CashFlowTable, RefundsOwedTable } from "../components/reports/report-tables"

const dues = (over: Partial<DuesReport> = {}): DuesReport => ({
  items: [],
  refundsOwed: [
    { vehicle: { id: "v1", label: "Swift" }, lead: { id: "a", name: "Asha", phone: null }, paid: 50000, refunded: 0, owed: 50000 },
    { vehicle: { id: "v2", label: "Baleno" }, lead: null, paid: 5000, refunded: 0, owed: 5000 },
  ],
  totals: { owedToSellers: 0, owedByBuyers: 0, owedBackToBuyers: 55000 },
  truncated: false,
  ...over,
})

describe("Dues: Owed back to buyers", () => {
  it("lists each car and buyer with the amount owed back, and the total", () => {
    render(<RefundsOwedTable report={dues()} />)
    const rows = screen.getAllByRole("row")
    expect(within(rows[1]!).getByText("Swift")).toBeInTheDocument()
    expect(within(rows[1]!).getByText("Asha")).toBeInTheDocument()
    expect(within(rows[1]!).getAllByText("₹50,000").length).toBeGreaterThan(0)
    expect(within(rows[2]!).getByText(/Unassigned/)).toBeInTheDocument()
    expect(within(rows[3]!).getByText("₹55,000")).toBeInTheDocument()
  })

  it("says so when nobody is owed", () => {
    render(<RefundsOwedTable report={dues({ refundsOwed: [] })} />)
    expect(screen.getByText("No buyer is owed money back.")).toBeInTheDocument()
  })
})

describe("summary tile", () => {
  const summary = (owedBack: number) =>
    ({ moneyInStock: 0, owedToSellers: 0, owedByBuyers: 1000, owedBackToBuyers: owedBack, awaitingSalePrice: 0 }) as FinanceSummary

  it("adds an 'Owed back to buyers' line under Owed by buyers", () => {
    render(<PositionTiles summary={summary(50000)} />)
    expect(screen.getByTestId("owed-back-to-buyers")).toHaveTextContent("Owed back to buyers ₹50,000")
  })

  it("leaves it out when nothing is owed back", () => {
    render(<PositionTiles summary={summary(0)} />)
    expect(screen.queryByTestId("owed-back-to-buyers")).toBeNull()
  })
})

describe("cash flow table", () => {
  it("has a Refunds to buyers column with the bucket", () => {
    const line = { in: 0, out: 50000, net: -50000, inFromBuyers: 0, inOther: 0, outToSellers: 0, outCarCosts: 0, outBusiness: 0, outRefundsToBuyers: 50000 }
    const report = {
      period: "month",
      from: "2026-11-01",
      to: "2026-11-30",
      buckets: [{ start: "2026-11-01", end: "2026-11-30", label: "2026-11", cumulative: -50000, ...line }],
      totals: line,
      truncated: false,
    } as CashFlowReport
    render(<CashFlowTable report={report} />)
    expect(screen.getByRole("columnheader", { name: "Refunds to buyers" })).toBeInTheDocument()
    expect(screen.getAllByText("₹50,000").length).toBeGreaterThanOrEqual(2)
  })
})
