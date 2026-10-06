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
        "bg-white rounded-xl border border-[#E5E7EB] p-4 flex flex-col gap-3",
        className
      )}
    >
      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        <span className="font-mono-data text-3xl font-bold text-[#111827] leading-none">
          {display ?? (value ?? "—")}
        </span>
        {delta && delta.direction !== "neutral" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
              delta.direction === "up"
                ? "bg-[#DCFCE7] text-[#16A34A]"
                : "bg-[#FEE2E2] text-[#DC2626]"
            )}
          >
            {delta.direction === "up" ? "▲" : "▼"}
            {delta.label}
          </span>
        )}
        {delta && delta.direction === "neutral" && (
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#9CA3AF]">
            —
          </span>
        )}
      </div>
      {showTrend && previous !== undefined && (
        <p className="text-[11px] text-[#9CA3AF]">
          vs {display !== undefined ? (previous !== null ? `${Math.round((previous ?? 0) * 100)}%` : "—") : (previous ?? "—")} last period
        </p>
      )}
    </div>
  )
}
