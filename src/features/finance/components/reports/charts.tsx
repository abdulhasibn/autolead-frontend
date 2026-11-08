"use client"

import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatBucketLabel } from "../../logic/dates"
import { formatMoney } from "../../logic/money"
import type { CashFlowReport, PnlReport } from "../../types"

/** Short axis ticks: ₹5.4L, ₹1.2Cr, −₹45K. */
function compactRupees(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? "−" : ""
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(abs >= 1e8 ? 0 : 1)}Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(abs >= 1e6 ? 0 : 1)}L`
  if (abs >= 1e3) return `${sign}₹${Math.round(abs / 1e3)}K`
  return `${sign}₹${abs}`
}

function moneyTooltip(config: ChartConfig) {
  return (
    <ChartTooltipContent
      formatter={(value, name) => (
        <div className="flex w-full items-center justify-between gap-3">
          <span className="text-muted-foreground">{config[name as keyof typeof config]?.label ?? name}</span>
          <span className="font-mono-data font-medium text-foreground">{formatMoney(Number(value))}</span>
        </div>
      )}
    />
  )
}

const pnlConfig = {
  netProfit: { label: "Net profit", color: "var(--chart-1)" },
} satisfies ChartConfig

export function PnlChart({ report }: { report: PnlReport }) {
  const data = report.buckets.map((b) => ({ label: formatBucketLabel(b.label, report.period), netProfit: b.netProfit }))
  return (
    <ChartContainer config={pnlConfig} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ left: 4, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} minTickGap={8} />
        <YAxis tickLine={false} axisLine={false} width={56} fontSize={11} tickFormatter={compactRupees} />
        <ReferenceLine y={0} stroke="var(--border)" />
        <ChartTooltip cursor={false} content={moneyTooltip(pnlConfig)} />
        <Bar dataKey="netProfit" radius={4}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.netProfit < 0 ? "var(--destructive)" : "var(--color-netProfit)"} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

const cashConfig = {
  in: { label: "Money in", color: "var(--chart-1)" },
  out: { label: "Money out", color: "var(--subtle-foreground)" },
  cumulative: { label: "Running net", color: "var(--foreground)" },
} satisfies ChartConfig

export function CashFlowChart({ report }: { report: CashFlowReport }) {
  const data = report.buckets.map((b) => ({
    label: formatBucketLabel(b.label, report.period),
    in: b.in,
    out: b.out,
    cumulative: b.cumulative,
  }))
  return (
    <ChartContainer config={cashConfig} className="aspect-auto h-72 w-full">
      <ComposedChart data={data} margin={{ left: 4, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} minTickGap={8} />
        <YAxis tickLine={false} axisLine={false} width={56} fontSize={11} tickFormatter={compactRupees} />
        <ReferenceLine y={0} stroke="var(--border)" />
        <ChartTooltip cursor={false} content={moneyTooltip(cashConfig)} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="in" fill="var(--color-in)" radius={4} />
        <Bar dataKey="out" fill="var(--color-out)" radius={4} />
        <Line dataKey="cumulative" type="monotone" stroke="var(--color-cumulative)" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ChartContainer>
  )
}
