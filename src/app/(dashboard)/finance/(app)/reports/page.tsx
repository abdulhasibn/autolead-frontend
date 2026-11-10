import type { Metadata } from "next"
import { Suspense } from "react"
import { SectionCard } from "@/app/(dashboard)/dashboard/_components/section-card"
import { ApiError } from "@/lib/api-error"
import { getCashFlow, getDues, getPnl, getShowrooms, getStock, getVehicleProfit } from "@/features/finance/api"
import { Notice, TruncatedBanner, UncountedSalesWarning } from "@/features/finance/components/notices"
import { CashFlowChart, PnlChart } from "@/features/finance/components/reports/charts"
import { ProfitSortSelect, ReportControls } from "@/features/finance/components/reports/report-controls"
import {
  CashFlowTable,
  DuesTable,
  PnlTable,
  StockTable,
  VehicleProfitTable,
} from "@/features/finance/components/reports/report-tables"
import { Tile } from "@/features/finance/components/summary-tiles"
import { Money } from "@/features/finance/components/money"
import { financeErrorMessage } from "@/features/finance/logic/errors"
import { formatMoney } from "@/features/finance/logic/money"
import { parseReportSearchParams, type RawSearchParams, type ReportFilters } from "@/features/finance/search-params"

export const metadata: Metadata = { title: "Finance reports" }

const RANGE_CODES = new Set(["DATE_RANGE_TOO_LONG", "DATE_RANGE_REQUIRED", "INVALID_DATE_RANGE"])

export default async function ReportsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const filters = parseReportSearchParams(await searchParams)
  const showrooms = await getShowrooms()
  const ranged = filters.tab === "pnl" || filters.tab === "cash-flow" || filters.tab === "vehicle-profit"

  let rangeError = ranged ? filters.rangeError : null
  let body: React.ReactNode = null
  if (!rangeError) {
    try {
      body = await ReportBody({ filters })
    } catch (err) {
      if (ApiError.isApiError(err) && RANGE_CODES.has(err.code)) rangeError = financeErrorMessage(err)
      else throw err
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Suspense>
        <ReportControls filters={{ ...filters, rangeError }} showrooms={showrooms} />
      </Suspense>
      {body}
    </div>
  )
}

async function ReportBody({ filters }: { filters: ReportFilters }) {
  const range = { from: filters.from, to: filters.to, showroomId: filters.showroomId }
  switch (filters.tab) {
    case "pnl": {
      const report = await getPnl({ ...range, period: filters.period })
      return (
        <>
          <TruncatedBanner truncated={report.truncated} />
          <UncountedSalesWarning
            uncountedSales={report.totals.uncountedSales}
            carsMissingPurchaseRate={report.totals.carsMissingPurchaseRate}
            href={`/finance/reports?tab=vehicle-profit&from=${report.from}&to=${report.to}&sort=-profit`}
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Tile label="Sales"><Money value={report.totals.sales} /></Tile>
            <Tile label="Gross profit" footer={report.totals.commissions ? `Includes ${formatMoney(report.totals.commissions)} commission` : undefined}>
              <Money value={report.totals.grossProfit} tone />
            </Tile>
            <Tile label="Net profit"><Money value={report.totals.netProfit} tone /></Tile>
            <Tile label="Cars sold" footer={report.totals.carsMissingPurchaseRate ? `${report.totals.carsMissingPurchaseRate} missing a rate or %` : undefined}>
              <span className="font-mono-data">{report.totals.carsSold}</span>
            </Tile>
          </div>
          <SectionCard title="Net profit by period">
            <div className="px-2 pt-4 pb-2"><PnlChart report={report} /></div>
          </SectionCard>
          <SectionCard title="Profit & loss"><PnlTable report={report} /></SectionCard>
          <p className="text-xs text-muted-foreground">
            A car counts in the period it was sold. Payments to sellers and from buyers aren’t in profit & loss, and costs of
            unsold cars are in Stock.
          </p>
        </>
      )
    }
    case "cash-flow": {
      const report = await getCashFlow({ ...range, period: filters.period })
      return (
        <>
          <TruncatedBanner truncated={report.truncated} />
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <Tile label="Money in"><Money value={report.totals.in} /></Tile>
            <Tile label="Money out"><Money value={report.totals.out} /></Tile>
            <Tile label="Net"><Money value={report.totals.net} tone signed /></Tile>
          </div>
          <SectionCard title="In vs out">
            <div className="px-2 pt-4 pb-2"><CashFlowChart report={report} /></div>
          </SectionCard>
          <SectionCard title="Breakdown"><CashFlowTable report={report} /></SectionCard>
        </>
      )
    }
    case "vehicle-profit": {
      const report = await getVehicleProfit({ ...range, sort: filters.sort })
      return (
        <>
          <TruncatedBanner truncated={report.truncated} />
          {report.totals.uncountedSales > 0 && (
            <Notice tone="warning">
              {report.totals.carsMissingPurchaseRate} {report.totals.carsMissingPurchaseRate === 1 ? "car has" : "cars have"} no
              purchase rate or commission %, so <Money value={report.totals.uncountedSales} /> of sales isn’t in the totals. Open the car to
              enter it.
            </Notice>
          )}
          <SectionCard title="Cars sold" total={report.totals.cars}>
            <div className="flex justify-end border-b border-muted px-4 py-2">
              <Suspense><ProfitSortSelect value={filters.sort} /></Suspense>
            </div>
            <VehicleProfitTable report={report} />
          </SectionCard>
        </>
      )
    }
    case "dues": {
      const report = await getDues({ showroomId: filters.showroomId })
      return (
        <>
          <TruncatedBanner truncated={report.truncated} />
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Tile label="Owed to sellers"><Money value={report.totals.owedToSellers} /></Tile>
            <Tile label="Owed by buyers"><Money value={report.totals.owedByBuyers} /></Tile>
          </div>
          <SectionCard title="Who owes whom" total={report.items.length}><DuesTable report={report} /></SectionCard>
        </>
      )
    }
    case "stock": {
      const report = await getStock({ showroomId: filters.showroomId })
      return (
        <>
          <TruncatedBanner truncated={report.truncated} />
          <Tile label="Money in stock" footer={`${report.totals.cars} unsold ${report.totals.cars === 1 ? "car" : "cars"}`}>
            <Money value={report.totals.moneyInStock} />
          </Tile>
          <SectionCard title="Unsold cars" total={report.items.length}><StockTable report={report} /></SectionCard>
        </>
      )
    }
  }
}
