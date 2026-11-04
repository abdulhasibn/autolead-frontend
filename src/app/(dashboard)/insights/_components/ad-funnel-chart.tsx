"use client"

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { EmptyState } from "@/components/empty-state"
import { formatCount, formatShare, shareOf } from "@/features/insights/format"
import type { ChannelRow } from "@/features/insights/types"

const chartConfig = {
  count: { label: "Buyers", color: "var(--chart-1)" },
} satisfies ChartConfig

/** Visit → sale funnel for one channel; each bar is labelled with its count and the step conversion. */
export function AdFunnelChart({ row }: { row: ChannelRow | undefined }) {
  if (!row || row.visitors === 0) {
    return <EmptyState message="No Instagram ad visits in this period." />
  }

  const steps = [
    { stage: "Visits", count: row.visitors },
    { stage: "Car views", count: row.carViews },
    { stage: "Test-drive opens", count: row.testDriveOpens },
    { stage: "Leads", count: row.leads },
    { stage: "Bookings", count: row.bookings },
    { stage: "Sold", count: row.sold },
  ]
  const data = steps.map((step, i) => {
    const prev = steps[i - 1]
    return {
      ...step,
      label: prev
        ? `${formatCount(step.count)} · ${formatShare(shareOf(step.count, prev.count))}`
        : formatCount(step.count),
    }
  })

  return (
    <div className="px-2 pt-3 pb-2">
      <ChartContainer config={chartConfig} className="aspect-auto h-60 w-full">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 72 }} barCategoryGap={6}>
          <YAxis
            dataKey="stage"
            type="category"
            tickLine={false}
            axisLine={false}
            width={112}
            tick={{ fontSize: 12 }}
          />
          <XAxis type="number" dataKey="count" hide scale="sqrt" />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={4} minPointSize={3}>
            <LabelList
              dataKey="label"
              position="right"
              className="fill-foreground font-mono-data"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className="px-2 text-[11px] text-subtle-foreground">
        % is conversion from the step above. Bars use a square-root scale so small steps stay visible.
      </p>
    </div>
  )
}
