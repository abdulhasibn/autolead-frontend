import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { getDashboard } from "@/features/dashboard/api"
import { formatPercent, formatDateRange, greeting } from "@/features/dashboard/format"
import type { DashboardPeriodKey } from "@/features/dashboard/types"
import { KpiCard } from "./_components/kpi-card"
import { PeriodTabs } from "./_components/period-tabs"
import { SectionCard } from "./_components/section-card"
import { FollowUpList } from "./_components/follow-up-list"
import { LeadList } from "./_components/lead-list"
import { AgedStockList } from "./_components/aged-stock-list"
import { PipelineCard } from "./_components/pipeline-card"
import { InventoryCard } from "./_components/inventory-card"

export const metadata: Metadata = { title: "Dashboard" }

const VALID_PERIODS: DashboardPeriodKey[] = ["today", "week", "month", "quarter"]

function isPeriodKey(v: unknown): v is DashboardPeriodKey {
  return typeof v === "string" && VALID_PERIODS.includes(v as DashboardPeriodKey)
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const session = await auth()
  const isAdmin = session?.user?.roles?.includes("admin")
  if (!isAdmin) redirect("/leads")

  const { period: rawPeriod } = await searchParams
  const period: DashboardPeriodKey = isPeriodKey(rawPeriod) ? rawPeriod : "month"

  const data = await getDashboard({ period })

  const firstName = session?.user?.name?.split(" ")[0] ?? "there"

  const conversionValue = data.kpis.conversionRate.value
  const conversionPrev = data.kpis.conversionRate.previous

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatDateRange(data.period.from, data.period.to)}&nbsp;·&nbsp;
            {data.period.timezone}
          </p>
        </div>
        <Suspense>
          <PeriodTabs activePeriod={period} />
        </Suspense>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Cars sold"
          value={data.kpis.carsSold.value}
          previous={data.kpis.carsSold.previous}
          showTrend
        />
        <KpiCard
          label="New leads"
          value={data.kpis.newLeads.value}
          previous={data.kpis.newLeads.previous}
          showTrend
        />
        <KpiCard
          label="Conversion rate"
          value={conversionValue}
          display={formatPercent(conversionValue)}
          previous={conversionPrev}
          showTrend
        />
        <KpiCard
          label="In stock"
          value={data.kpis.inStock.value}
        />
      </div>

      {/* Main two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: attention + today */}
        <div className="lg:col-span-2 space-y-4">
          {/* Today's follow-ups */}
          <SectionCard
            title="Today's follow-ups"
            total={data.today.total}
            seeAllHref="/leads"
          >
            <FollowUpList
              items={data.today.items}
              variant="today"
              emptyMessage="Nothing scheduled for today — great work!"
            />
          </SectionCard>

          {/* Needs attention */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SectionCard
              title="Overdue follow-ups"
              total={data.attention.overdueFollowUps.total}
              seeAllHref="/leads"
              accent="red"
            >
              <FollowUpList
                items={data.attention.overdueFollowUps.items}
                variant="overdue"
                emptyMessage="No overdue follow-ups."
              />
            </SectionCard>

            <SectionCard
              title="No follow-up scheduled"
              total={data.attention.leadsWithoutFollowUp.total}
              seeAllHref="/leads"
              accent="amber"
            >
              <LeadList
                items={data.attention.leadsWithoutFollowUp.items}
                emptyMessage="Every active lead has a follow-up!"
              />
            </SectionCard>
          </div>
        </div>

        {/* Right: pipeline, inventory, aged stock */}
        <div className="space-y-4">
          <PipelineCard pipeline={data.pipeline} />
          <InventoryCard inventory={data.inventory} />
          <SectionCard
            title="Aged stock"
            total={data.attention.agedStock.total}
            seeAllHref="/vehicles"
            seeAllLabel="See all vehicles"
            accent="amber"
          >
            <AgedStockList
              items={data.attention.agedStock.items}
              emptyMessage="No vehicles older than 45 days."
            />
          </SectionCard>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[11px] text-subtle-foreground text-right pb-2">
        Updated {new Date(data.generatedAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </p>
    </div>
  )
}
