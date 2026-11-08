import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { MobileActionBar } from "@/components/mobile-action-bar"
import { SectionCard } from "@/app/(dashboard)/dashboard/_components/section-card"
import { getAwaitingSalePrice, getShowrooms, getSummary, getTags } from "@/features/finance/api"
import { AddEntryButtons } from "@/features/finance/components/ledger/entries-panel"
import { TruncatedBanner, UncountedSalesWarning } from "@/features/finance/components/notices"
import { MonthComparisonTiles, PositionTiles } from "@/features/finance/components/summary-tiles"
import { formatYmd } from "@/features/finance/logic/dates"

export const metadata: Metadata = { title: "Finance" }

export default async function FinanceHomePage() {
  const [summary, awaiting, tags, showrooms] = await Promise.all([
    getSummary(),
    getAwaitingSalePrice(),
    getTags(),
    getShowrooms(),
  ])

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          This month ({formatYmd(summary.thisMonth.from)} – {formatYmd(summary.thisMonth.to)}) vs the same days last
          month
        </p>
        <MobileActionBar>
          <AddEntryButtons tags={tags} showrooms={showrooms} />
        </MobileActionBar>
      </div>

      <TruncatedBanner truncated={summary.truncated} />
      <UncountedSalesWarning
        uncountedSales={summary.thisMonth.uncountedSales}
        carsMissingPurchaseRate={summary.thisMonth.carsMissingPurchaseRate}
        href={`/finance/reports?tab=vehicle-profit&from=${summary.thisMonth.from}&to=${summary.thisMonth.to}`}
      />

      <MonthComparisonTiles summary={summary} />
      <PositionTiles summary={summary} />

      <div id="awaiting-sale-price" className="scroll-mt-20">
        <SectionCard title="To do: record sale price" total={awaiting.length} accent={awaiting.length ? "amber" : "default"}>
          {awaiting.length === 0 ? (
            <p className="flex items-center justify-center gap-2 px-4 py-6 text-xs text-subtle-foreground">
              <CheckCircle2 className="size-4 text-success" /> Every sold car has its sale price.
            </p>
          ) : (
            <ul className="divide-y divide-muted">
              {awaiting.map((car) => (
                <li key={car.vehicleId} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{car.label}</p>
                    {car.soldLeadId && (
                      <Link href={`/leads/${car.soldLeadId}`} className="text-xs text-muted-foreground hover:text-primary">
                        View buyer lead →
                      </Link>
                    )}
                  </div>
                  <Link
                    href={`/vehicles/${car.vehicleId}?tab=money#vehicle-tabs`}
                    className="inline-flex h-9 shrink-0 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium hover:border-primary pointer-coarse:h-11"
                  >
                    Record sale
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
