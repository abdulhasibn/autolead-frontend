import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PositionTiles } from "../components/summary-tiles"
import { StockTable } from "../components/reports/report-tables"
import type { FinanceSummary, StockReport, StockRow } from "../types"

const row = (over: Partial<StockRow>): StockRow => ({
  vehicle: { id: "v1", label: "Honda City KA01AB1234" },
  status: "open",
  saleModel: "purchase",
  purchaseRate: 500000,
  commissionPercent: null,
  costs: 20000,
  landingCost: 520000,
  paidToSeller: 300000,
  moneyInStock: 320000,
  currentQuote: null,
  listedPrice: null,
  ...over,
})

const report = (items: StockRow[]): StockReport => ({
  items,
  totals: { cars: items.length, moneyInStock: items.reduce((n, r) => n + r.moneyInStock, 0) },
  truncated: false,
})

describe("Stock report shows cash paid out", () => {
  it("shows paid out per car (not the agreed rate) and the footer equals the column sum", () => {
    render(<StockTable report={report([row({}), row({ vehicle: { id: "v2", label: "Swift KA02" }, paidToSeller: 0, costs: 0, moneyInStock: 0 })])} />)
    expect(screen.getByRole("columnheader", { name: "Paid out" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Paid to seller" })).toBeInTheDocument()
    expect(screen.queryByRole("columnheader", { name: "Landing cost" })).not.toBeInTheDocument()
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent)
    expect(headers.slice(0, 3)).toEqual(["Car", "Status", "Paid out"])
    const first = screen.getByText("Honda City KA01AB1234").closest("tr") as HTMLElement
    expect(within(first).getAllByText(/3,20,000/)).toHaveLength(1)
    expect(within(first).queryByText(/5,20,000/)).not.toBeInTheDocument()
    const footer = screen.getByText(/Paid out on unsold cars · 2 cars/).closest("tr") as HTMLElement
    expect(within(footer).getByText(/3,20,000/)).toBeInTheDocument()
  })

  it("empty state talks about cash paid out", () => {
    render(<StockTable report={report([])} />)
    expect(screen.getByText("No cash paid out on unsold cars.")).toBeInTheDocument()
  })

  it("the position tile footer says cash paid out", () => {
    render(<PositionTiles summary={{ moneyInStock: 320000, owedToSellers: 0, owedByBuyers: 0 } as unknown as FinanceSummary} />)
    expect(screen.getByText("Paid out on unsold cars")).toBeInTheDocument()
    expect(screen.getByText("Cash paid out on unsold cars")).toBeInTheDocument()
    expect(screen.queryByText("Money in stock")).not.toBeInTheDocument()
    expect(screen.queryByText(/Landing cost of unsold cars/)).not.toBeInTheDocument()
  })
})
