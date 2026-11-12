"use client"

import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { INSIGHTS_TAB_LABELS, INSIGHTS_TABS, type InsightsTab } from "@/features/insights/format"
import { useParamHref } from "@/hooks/use-param-href"

/** Traffic / Cars / Demand as links, keeping the selected period. */
export function InsightsTabs({ activeTab }: { activeTab: InsightsTab }) {
  const buildHref = useParamHref("tab")

  return (
    <Tabs value={activeTab} className="max-sm:w-full">
      <TabsList variant="line" aria-label="Insights section" className="max-sm:w-full">
        {INSIGHTS_TABS.map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            nativeButton={false}
            render={<Link href={buildHref(tab)} scroll={false} />}
            className="px-3 max-sm:flex-1 pointer-coarse:min-h-9"
          >
            {INSIGHTS_TAB_LABELS[tab]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
