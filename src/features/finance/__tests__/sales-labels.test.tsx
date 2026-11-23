import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { MonthComparisonTiles } from "../components/summary-tiles"
import { PnlTable, VehicleProfitTable } from "../components/reports/report-tables"
import type { FinanceSummary, PnlLine, PnlReport, SummaryWindow, VehicleProfitReport } from "../types"

const line: PnlLine = {
  sales: 560000,
  costOfSales: 547000,
  commissions: 28000,
  commissionSalesValue: 300000,
  grossProfit: 41000,
  laterCarCosts: 0,
  otherIncome: 0,
  businessExpenses: 0,
  netProfit: 41000,
  carsSold: 2,
  carsMissingPurchaseRate: 0,
  uncountedSales: 0,
}

const pnl: PnlReport = {
  period: "month",
  from: "2026-10-01",
  to: "2026-10-31",
  buckets: [{ start: "2026-10-01", end: "2026-10-31", label: "2026-10", ...line }],
  totals: line,
  truncated: false,
}

const window = (over: Partial<SummaryWindow> = {}): SummaryWindow => ({
  from: "2026-11-01",
  to: "2026-11-03",
  sales: 0,
  commissions: 0,
  commissionSalesValue: 0,
  netProfit: 0,
  businessExpenses: 0,
  cashIn: 0,
  cashOut: 0,
  carsMissingPurchaseRate: 0,
  uncountedSales: 0,
  ...over,
})

const summary = (thisMonth: SummaryWindow): FinanceSummary =>
  ({ thisMonth, lastMonth: window(), moneyInStock: 0, owedToSellers: 0, owedByBuyers: 0 }) as unknown as FinanceSummary

describe("Sales labels", () => {
  it("P&L names Sales as purchased cars and lists commission-car value apart", () => {
    render(<PnlTable report={pnl} />)
    expect(screen.getByText("Sales (purchased cars)")).toBeInTheDocument()
    expect(screen.getByText("Commission-car sales value (owners' cars)")).toBeInTheDocument()
    expect(screen.queryByText("Sales")).not.toBeInTheDocument()
  })

  it("the overview tile says purchased cars and adds the commission earned", () => {
    render(<MonthComparisonTiles summary={summary(window({ sales: 100000, commissions: 28000 }))} />)
    expect(screen.getByText("Sales (purchased cars)")).toBeInTheDocument()
    expect(screen.getByText(/commission earned/)).toBeInTheDocument()
  })

  it("the overview tile has no commission line when none was earned", () => {
    render(<MonthComparisonTiles summary={summary(window())} />)
    expect(screen.queryByText(/commission earned/)).not.toBeInTheDocument()
  })

  it("profit per car notes commission cars left out of the sale price total", () => {
    const report = {
      from: "2026-10-01",
      to: "2026-10-31",
      items: [
        { vehicle: { id: "v1", label: "Honda City KA01AB1234" }, soldOn: "2026-10-12", saleModel: "purchase", purchaseRate: 500000, commissionPercent: null, commission: null, costs: 32000, landingCost: 532000, finalisedPrice: 560000, profit: 28000 },
      ],
      totals: {
        cars: 2,
        sales: 560000,
        commissionSalesValue: 300000,
        landingCost: 0,
        commissions: 15000,
        profit: 28000,
        carsMissingPurchaseRate: 0,
        uncountedSales: 0,
      },
      truncated: false,
    } as VehicleProfitReport
    render(<VehicleProfitTable report={report} />)
    expect(screen.getByText(/counts purchased cars only/)).toBeInTheDocument()
  })

  it("profit per car shows no note without commission sales", () => {
    const report = {
      from: "",
      to: "",
      items: [
        { vehicle: { id: "v1", label: "Honda City KA01AB1234" }, soldOn: "2026-10-12", saleModel: "purchase", purchaseRate: 500000, commissionPercent: null, commission: null, costs: 32000, landingCost: 532000, finalisedPrice: 560000, profit: 28000 },
      ],
      totals: { cars: 0, sales: 0, commissionSalesValue: 0, landingCost: 0, commissions: 0, profit: 0, carsMissingPurchaseRate: 0, uncountedSales: 0 },
      truncated: false,
    } as VehicleProfitReport
    render(<VehicleProfitTable report={report} />)
    expect(screen.queryByText(/counts purchased cars only/)).not.toBeInTheDocument()
  })
})
