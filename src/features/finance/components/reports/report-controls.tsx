"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OptionSelect } from "@/components/option-select"
import { SegmentedChoice } from "@/features/leads/components/segmented-choice"
import type { ReportFilters, ReportTab } from "../../search-params"
import { REPORT_TABS } from "../../search-params"
import type { ReportPeriod, ShowroomOption } from "../../types"
import { DateRangeField } from "../date-range-field"
import { useQueryState } from "../use-query-state"

export const REPORT_TAB_LABELS: Record<ReportTab, string> = {
  pnl: "Profit & loss",
  "cash-flow": "Cash flow",
  "vehicle-profit": "Profit per car",
  dues: "Dues",
  stock: "Stock",
}

const PERIOD_OPTIONS: Array<{ value: ReportPeriod; label: string }> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
]

export function ReportControls({ filters, showrooms }: { filters: ReportFilters; showrooms: ShowroomOption[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { update } = useQueryState()

  function tabHref(tab: ReportTab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    return `${pathname}?${params.toString()}`
  }

  const ranged = filters.tab === "pnl" || filters.tab === "cash-flow" || filters.tab === "vehicle-profit"
  const bucketed = filters.tab === "pnl" || filters.tab === "cash-flow"

  return (
    <div className="space-y-3">
      <div className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
        <Tabs value={filters.tab}>
          <TabsList variant="line" aria-label="Report">
            {REPORT_TABS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                nativeButton={false}
                render={<Link href={tabHref(tab)} scroll={false} />}
                className="px-3 whitespace-nowrap pointer-coarse:min-h-9"
              >
                {REPORT_TAB_LABELS[tab]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className="flex flex-wrap items-start gap-3">
        {ranged && (
          <DateRangeField
            value={{ from: filters.from, to: filters.to }}
            onChange={(r) => update({ from: r.from, to: r.to })}
            error={filters.rangeError}
          />
        )}
        {bucketed && (
          <div className="w-64">
            <SegmentedChoice
              aria-label="Period"
              value={filters.period}
              onValueChange={(p) => update({ period: p === "month" ? undefined : p })}
              options={PERIOD_OPTIONS}
            />
          </div>
        )}
        {showrooms.length > 1 && (
          <OptionSelect
            aria-label="Showroom"
            value={filters.showroomId ?? ""}
            onValueChange={(v) => update({ showroomId: v || undefined })}
            className="w-48"
            options={[{ value: "", label: "All showrooms" }, ...showrooms.map((s) => ({ value: s.id, label: s.name }))]}
          />
        )}
      </div>
    </div>
  )
}

export function ProfitSortSelect({ value }: { value: string }) {
  const { update } = useQueryState()
  return (
    <OptionSelect
      aria-label="Sort cars"
      value={value}
      onValueChange={(v) => update({ sort: v === "profit" ? undefined : v })}
      className="w-44"
      options={[
        { value: "profit", label: "Biggest profit" },
        { value: "-profit", label: "Biggest loss" },
        { value: "date", label: "Newest sale" },
        { value: "-date", label: "Oldest sale" },
      ]}
    />
  )
}
