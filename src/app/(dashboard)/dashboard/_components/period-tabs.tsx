"use client"

import { PendingLink } from "@/components/pending-link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DashboardPeriodKey } from "@/features/dashboard/types"
import { PERIOD_LABELS } from "@/features/dashboard/format"
import { useParamHref } from "@/hooks/use-param-href"

const PERIODS: DashboardPeriodKey[] = ["today", "week", "month", "quarter"]

export function PeriodTabs({ activePeriod }: { activePeriod: DashboardPeriodKey }) {
  const buildHref = useParamHref("period")

  return (
    <Tabs value={activePeriod} className="max-sm:w-full">
      <TabsList variant="accent" aria-label="Dashboard period" className="max-sm:w-full">
        {PERIODS.map((period) => (
          <TabsTrigger
            key={period}
            value={period}
            nativeButton={false}
            render={<PendingLink href={buildHref(period)} spinner={false} />}
            className="max-sm:flex-1 pointer-coarse:min-h-9"
          >
            {PERIOD_LABELS[period]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
