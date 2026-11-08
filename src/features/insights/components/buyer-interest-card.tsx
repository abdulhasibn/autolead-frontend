import { Eye } from "lucide-react"
import { InfoCard } from "@/components/info-card"
import {
  formatChange,
  formatCount,
  formatLakh,
  formatPerDay,
  formatRate,
  formatShare,
  formatShortDate,
} from "../format"
import type { VehicleInsightDetail } from "../types"
import { InterestTrendChart } from "./interest-trend-chart"
import { SignalPill } from "./signal-pill"

/** Website demand for one car: signal, daily trend with price-change markers, and the effect of each change. */
export function BuyerInterestCard({ insight }: { insight: VehicleInsightDetail }) {
  const stats = [
    { label: "Views", value: formatCount(insight.views) },
    { label: "Repeat", value: formatCount(insight.repeatViewers) },
    { label: "TD opens", value: formatCount(insight.testDriveOpens) },
    { label: "Leads", value: formatCount(insight.leads) },
  ]

  return (
    <InfoCard title="Buyer interest" icon={Eye}>
      <div className="space-y-4">
        <SignalPill signal={insight.signal} withReason />

        <dl className="grid grid-cols-4 gap-1.5 text-center">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-muted/50 px-1 py-1.5">
              <dt className="text-[10px] font-medium tracking-wide text-subtle-foreground uppercase">{s.label}</dt>
              <dd className="font-mono-data text-sm font-semibold text-foreground">{s.value}</dd>
            </div>
          ))}
        </dl>

        {insight.daily.length > 0 && (
          <InterestTrendChart daily={insight.daily} priceChanges={insight.priceChanges} />
        )}

        {insight.priceChanges.length > 0 && (
          <ul className="space-y-2" aria-label="Price changes">
            {insight.priceChanges.map((pc) => (
              <li key={pc.at} className="rounded-lg border border-border px-3 py-2 text-xs">
                <p className="font-medium text-foreground">
                  {formatShortDate(pc.at)} ·{" "}
                  <span className="font-mono-data">
                    {formatLakh(pc.from)} → {formatLakh(pc.to)}
                  </span>
                </p>
                <p className="font-mono-data mt-0.5 text-muted-foreground">
                  Views/day {formatPerDay(pc.before.viewsPerDay)} → {formatPerDay(pc.after.viewsPerDay)} (
                  {formatChange(pc.before.viewsPerDay, pc.after.viewsPerDay)}) · Leads/day{" "}
                  {formatPerDay(pc.before.leadsPerDay)} → {formatPerDay(pc.after.leadsPerDay)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-muted-foreground">
          {insight.budgetContext.shareBelowPrice != null && (
            <>
              <b className="font-mono-data text-foreground">{formatShare(insight.budgetContext.shareBelowPrice)}</b>{" "}
              of {insight.budgetContext.segment} buyers filter below this price.{" "}
            </>
          )}
          Lead rate <span className="font-mono-data">{formatRate(insight.leadRate)}</span> ·{" "}
          {insight.daysInStock} days in stock.
        </p>
      </div>
    </InfoCard>
  )
}
