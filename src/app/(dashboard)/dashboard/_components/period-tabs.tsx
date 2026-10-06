"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import type { DashboardPeriodKey } from "@/features/dashboard/types"
import { PERIOD_LABELS } from "@/features/dashboard/format"

const PERIODS: DashboardPeriodKey[] = ["today", "week", "month", "quarter"]

export function PeriodTabs({ activePeriod }: { activePeriod: DashboardPeriodKey }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function buildHref(period: DashboardPeriodKey) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", period)
    return `${pathname}?${params.toString()}`
  }

  return (
    <div
      role="tablist"
      aria-label="Dashboard period"
      className="inline-flex items-center gap-0.5 rounded-lg bg-[#F0FDFA] p-1 border border-[#CCFBF1]"
    >
      {PERIODS.map((period) => {
        const active = activePeriod === period
        return (
          <Link
            key={period}
            href={buildHref(period)}
            role="tab"
            aria-selected={active}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              active
                ? "bg-white text-[#0D9488] shadow-sm border border-[#CCFBF1]"
                : "text-[#6B7280] hover:text-[#0D9488] hover:bg-white/60"
            )}
          >
            {PERIOD_LABELS[period]}
          </Link>
        )
      })}
    </div>
  )
}
