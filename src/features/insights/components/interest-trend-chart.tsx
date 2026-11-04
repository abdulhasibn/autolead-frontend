"use client"

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { formatLakh, formatShortDate, istDateKey } from "../format"
import type { DailyPoint, PriceChange } from "../types"

const chartConfig = {
  views: { label: "Views", color: "var(--chart-1)" },
  leads: { label: "Leads", color: "var(--warning)" },
} satisfies ChartConfig

/** Daily views (area) and leads, with a dashed marker on each price change. */
export function InterestTrendChart({ daily, priceChanges }: { daily: DailyPoint[]; priceChanges: PriceChange[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-36 w-full">
      <AreaChart data={daily} margin={{ top: 18, left: 4, right: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="interest-views" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          minTickGap={24}
          fontSize={10}
          tickFormatter={(v: string) => formatShortDate(v)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent labelFormatter={(v) => formatShortDate(String(v))} />}
        />
        <Area
          dataKey="views"
          type="monotone"
          stroke="var(--color-views)"
          strokeWidth={2}
          fill="url(#interest-views)"
        />
        <Area dataKey="leads" type="step" stroke="var(--color-leads)" strokeWidth={1.5} fill="none" />
        {priceChanges.map((pc) => (
          <ReferenceLine
            key={pc.at}
            x={istDateKey(pc.at)}
            stroke="var(--foreground)"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
            label={{
              value: `${formatLakh(pc.from)} → ${formatLakh(pc.to)}`,
              position: "top",
              fontSize: 10,
              fill: "var(--muted-foreground)",
            }}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  )
}
