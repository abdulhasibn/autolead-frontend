import { cn } from "@/lib/utils"
import { trendDelta } from "@/features/dashboard/format"

interface KpiCardProps {
  label: string
  value: number | null
  display?: string // Override formatted display (e.g. "18%")
  previous?: number | null
  showTrend?: boolean
  className?: string
}

export function KpiCard({
  label,
  value,
  display,
  previous,
  showTrend = false,
  className,
}: KpiCardProps) {
  const delta =
    showTrend && previous !== undefined
      ? trendDelta(value ?? null, previous ?? null)
      : null

  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border p-4 flex flex-col gap-3",
        className
      )}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        <span className="font-mono-data text-3xl font-bold text-foreground leading-none">
          {display ?? (value ?? "—")}
        </span>
        {delta && delta.direction !== "neutral" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
              delta.direction === "up"
                ? "bg-success-muted text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {delta.direction === "up" ? "▲" : "▼"}
            {delta.label}
          </span>
        )}
        {delta && delta.direction === "neutral" && (
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-subtle-foreground">
            —
          </span>
        )}
      </div>
      {showTrend && previous !== undefined && (
        <p className="text-[11px] text-subtle-foreground">
          vs {display !== undefined ? (previous !== null ? `${Math.round((previous ?? 0) * 100)}%` : "—") : (previous ?? "—")} last period
        </p>
      )}
    </div>
  )
}
