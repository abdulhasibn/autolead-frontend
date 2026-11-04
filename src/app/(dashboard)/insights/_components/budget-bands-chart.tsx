"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { EmptyState } from "@/components/empty-state"
import { BUDGET_BAND_LABELS } from "@/features/insights/format"
import type { BudgetBandRow } from "@/features/insights/types"

const chartConfig = {
  searchShare: { label: "Buyer searches", color: "var(--chart-1)" },
  stockShare: { label: "Your stock", color: "var(--subtle-foreground)" },
} satisfies ChartConfig

/** Where buyers' price filters land compared with how the stock is priced. */
export function BudgetBandsChart({ bands }: { bands: BudgetBandRow[] }) {
  if (bands.length === 0) {
    return <EmptyState message="No price-filtered searches in this period." />
  }

  const data = bands.map((b) => ({ ...b, label: BUDGET_BAND_LABELS[b.band] ?? b.band }))

  return (
    <div className="px-2 pt-4 pb-2">
      <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
        <BarChart data={data} margin={{ left: 0, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} width={36} tickFormatter={(v: number) => `${v}%`} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                    </span>
                    <span className="font-mono-data font-medium text-foreground">{value}%</span>
                  </div>
                )}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="searchShare" fill="var(--color-searchShare)" radius={4} />
          <Bar dataKey="stockShare" fill="var(--color-stockShare)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
