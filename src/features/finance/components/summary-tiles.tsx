import Link from "next/link"
import { cn } from "@/lib/utils"
import type { FinanceSummary, SummaryWindow } from "../types"
import { Money } from "./money"

type WindowKey = keyof Pick<SummaryWindow, "sales" | "netProfit" | "businessExpenses" | "cashIn" | "cashOut">

const COMPARE: Array<{ key: WindowKey; label: string; lowerIsBetter?: boolean; tone?: boolean }> = [
  { key: "sales", label: "Sales" },
  { key: "netProfit", label: "Net profit", tone: true },
  { key: "businessExpenses", label: "Business expenses", lowerIsBetter: true },
  { key: "cashIn", label: "Cash in" },
  { key: "cashOut", label: "Cash out", lowerIsBetter: true },
]

function Delta({ now, before, lowerIsBetter }: { now: number; before: number; lowerIsBetter?: boolean }) {
  const diff = now - before
  if (diff === 0) return <span className="text-[11px] text-subtle-foreground">same as last month</span>
  const good = lowerIsBetter ? diff < 0 : diff > 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        good ? "bg-success-muted text-success" : "bg-destructive/10 text-destructive"
      )}
    >
      {diff > 0 ? "▲" : "▼"} <Money value={Math.abs(diff)} />
    </span>
  )
}

export function Tile({
  label,
  children,
  footer,
  href,
  className,
}: {
  label: string
  children: React.ReactNode
  footer?: React.ReactNode
  href?: string
  className?: string
}) {
  const body = (
    <>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="text-xl leading-none font-bold text-foreground sm:text-2xl">{children}</div>
      {footer && <div className="text-[11px] text-subtle-foreground">{footer}</div>}
    </>
  )
  const cls = cn("flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:p-4", className)
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-primary")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

/** This month to date vs the same span last month. */
export function MonthComparisonTiles({ summary, compact = false }: { summary: FinanceSummary; compact?: boolean }) {
  const items = compact ? COMPARE.filter((c) => c.key === "sales" || c.key === "netProfit") : COMPARE
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4", compact ? "" : "lg:grid-cols-5")}>
      {items.map((c) => (
        <Tile
          key={c.key}
          label={c.label}
          footer={
            <span className="flex flex-wrap items-center gap-1.5">
              <Delta now={summary.thisMonth[c.key]} before={summary.lastMonth[c.key]} lowerIsBetter={c.lowerIsBetter} />
              <span>
                vs <Money value={summary.lastMonth[c.key]} />
              </span>
            </span>
          }
        >
          <Money value={summary.thisMonth[c.key]} tone={c.tone} />
        </Tile>
      ))}
    </div>
  )
}

export function PositionTiles({ summary }: { summary: FinanceSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Tile label="Money in stock" href="/finance/reports?tab=stock" footer="Landing cost of unsold cars">
        <Money value={summary.moneyInStock} />
      </Tile>
      <Tile label="Owed to sellers" href="/finance/reports?tab=dues" footer="Still to pay sellers and owners">
        <Money value={summary.owedToSellers} />
      </Tile>
      <Tile label="Owed by buyers" href="/finance/reports?tab=dues" footer="Sale price still to collect">
        <Money value={summary.owedByBuyers} />
      </Tile>
      <Tile
        label="Awaiting sale price"
        href="#awaiting-sale-price"
        footer="Sold cars without a finalised price"
        className={summary.awaitingSalePrice > 0 ? "border-warning/40" : undefined}
      >
        <span className={cn("font-mono-data", summary.awaitingSalePrice > 0 && "text-warning")}>
          {summary.awaitingSalePrice}
        </span>
      </Tile>
    </div>
  )
}
