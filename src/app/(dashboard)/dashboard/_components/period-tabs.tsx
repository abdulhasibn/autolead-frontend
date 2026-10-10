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
    <Tabs value={activePeriod}>
      <TabsList variant="accent" aria-label="Dashboard period">
        {PERIODS.map((period) => (
          <TabsTrigger
            key={period}
            value={period}
            nativeButton={false}
            render={<Link href={buildHref(period)} />}
          >
            {PERIOD_LABELS[period]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
