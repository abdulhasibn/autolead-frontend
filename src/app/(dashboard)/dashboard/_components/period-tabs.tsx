"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    <Tabs value={activePeriod} className="max-sm:w-full">
      <TabsList variant="accent" aria-label="Dashboard period" className="max-sm:w-full">
        {PERIODS.map((period) => (
          <TabsTrigger
            key={period}
            value={period}
            nativeButton={false}
            render={<Link href={buildHref(period)} />}
            className="max-sm:flex-1 pointer-coarse:min-h-9"
          >
            {PERIOD_LABELS[period]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
