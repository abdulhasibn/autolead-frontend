import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { formatDateRange } from "@/features/dashboard/format"
import type { DashboardPeriodKey } from "@/features/dashboard/types"
import { getDemandInsights, getTrafficInsights, getVehicleInsights } from "@/features/insights/api"
import {
  formatCount,
  formatRate,
  formatShare,
  isInsightsTab,
  isInstagramChannel,
  shareOf,
  type InsightsTab,
} from "@/features/insights/format"
import type { InsightsPeriod } from "@/features/insights/types"
import { KpiCard } from "../dashboard/_components/kpi-card"
import { PeriodTabs } from "../dashboard/_components/period-tabs"
import { SectionCard } from "../dashboard/_components/section-card"
import { AdFunnelChart } from "./_components/ad-funnel-chart"
import { BudgetBandsChart } from "./_components/budget-bands-chart"
import { CampaignTable } from "./_components/campaign-table"
import { ChannelTable } from "./_components/channel-table"
import { DemandGapTable } from "./_components/demand-gap-table"
import { InsightsTabs } from "./_components/insights-tabs"
import { VehicleSignalTable } from "./_components/vehicle-signal-table"

export const metadata: Metadata = { title: "Insights" }

const VALID_PERIODS: DashboardPeriodKey[] = ["today", "week", "month", "quarter"]

function isPeriodKey(v: unknown): v is DashboardPeriodKey {
  return typeof v === "string" && VALID_PERIODS.includes(v as DashboardPeriodKey)
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; period?: string }>
}) {
  const session = await auth()
  const isAdmin = session?.user?.roles?.includes("admin")
  if (!isAdmin) redirect("/leads")

  const { tab: rawTab, period: rawPeriod } = await searchParams
  const tab: InsightsTab = isInsightsTab(rawTab) ? rawTab : "traffic"
  const period: DashboardPeriodKey = isPeriodKey(rawPeriod) ? rawPeriod : "month"

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Suspense>
        <InsightsHeader tab={tab} period={period} />
      </Suspense>
      {tab === "traffic" && <TrafficTab period={period} />}
      {tab === "cars" && <CarsTab period={period} />}
      {tab === "demand" && <DemandTab period={period} />}
    </div>
  )
}

function InsightsHeader({ tab, period }: { tab: InsightsTab; period: DashboardPeriodKey }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Insights</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Website traffic, ads and buyer demand
          </p>
        </div>
        <PeriodTabs activePeriod={period} />
      </div>
      <InsightsTabs activeTab={tab} />
    </div>
  )
}

function PeriodNote({ period }: { period: InsightsPeriod }) {
  return (
    <p className="pb-2 text-right text-[11px] text-subtle-foreground">
      {formatDateRange(period.from, period.to)} · website data only
    </p>
  )
}

async function TrafficTab({ period }: { period: DashboardPeriodKey }) {
  const data = await getTrafficInsights({ period })
  const instagramVisitors = data.channels
    .filter((c) => isInstagramChannel(c.channel))
    .reduce((sum, c) => sum + c.visitors, 0)
  const adsRow = data.channels.find((c) => c.channel === "instagram_ads")
  const totalDevices = data.devices.mobile + data.devices.desktop

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* KpiCard formats `previous` as a percent whenever `display` is set, so counts pass raw values. */}
        <KpiCard label="Visitors" value={data.visitors} previous={data.previous.visitors} showTrend />
        <KpiCard
          label="From Instagram"
          value={shareOf(instagramVisitors, data.visitors)}
          display={formatShare(shareOf(instagramVisitors, data.visitors))}
        />
        <KpiCard label="Leads" value={data.leads} previous={data.previous.leads} showTrend />
        <KpiCard
          label="Visitor → lead"
          value={data.visitorToLeadRate}
          display={formatRate(data.visitorToLeadRate)}
        />
      </div>

      <SectionCard title="Where visitors come from">
        <ChannelTable channels={data.channels} />
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Instagram ad funnel">
          <AdFunnelChart row={adsRow} />
        </SectionCard>
        <div className="space-y-4">
          <SectionCard title="Top ads" total={data.campaigns.length}>
            <CampaignTable campaigns={data.campaigns} />
          </SectionCard>
          <SectionCard title="Audience">
            <div className="space-y-3 p-4">
              <p className="text-sm text-muted-foreground">
                <b className="font-mono-data text-foreground">
                  {formatShare(shareOf(data.devices.mobile, totalDevices))}
                </b>{" "}
                of visitors browse on a phone.
              </p>
              <ul className="flex flex-wrap gap-1.5" aria-label="Top cities">
                {data.cities.map((c) => (
                  <li
                    key={c.city}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {c.city}
                    <span className="font-mono-data font-semibold text-foreground">{formatCount(c.visitors)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SectionCard>
        </div>
      </div>
      <PeriodNote period={data.period} />
    </>
  )
}

async function CarsTab({ period }: { period: DashboardPeriodKey }) {
  const data = await getVehicleInsights({ period })
  return (
    <>
      <SectionCard title="Demand by car" total={data.items.length}>
        <VehicleSignalTable items={data.items} />
      </SectionCard>
      <p className="text-xs text-muted-foreground">
        Signals compare each car with the medians of your listed stock. A car needs at least 30 views
        before it gets one. They use website demand only, not cost or margin.
      </p>
      <PeriodNote period={data.period} />
    </>
  )
}

async function DemandTab({ period }: { period: DashboardPeriodKey }) {
  const data = await getDemandInsights({ period })
  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <SectionCard title="Buyer budgets vs your stock" className="xl:col-span-3">
          <BudgetBandsChart bands={data.budgetBands} />
        </SectionCard>
        <SectionCard title="Segment demand vs stock" className="xl:col-span-2">
          <DemandGapTable segments={data.segments} />
        </SectionCard>
      </div>
      <SectionCard title="Searches with no results" total={data.zeroResultSearches.count}>
        {data.zeroResultSearches.top.length > 0 ? (
          <ul className="divide-y divide-muted">
            {data.zeroResultSearches.top.map((s) => (
              <li key={s.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-foreground">{s.label}</span>
                <span className="font-mono-data text-muted-foreground">{formatCount(s.count)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-center text-xs text-subtle-foreground">
            Every search found at least one car.
          </p>
        )}
      </SectionCard>
      <PeriodNote period={data.period} />
    </>
  )
}
