import { cn } from "@/lib/utils"

interface PipelineCardProps {
  pipeline: {
    new: number
    not_now: number
    booking_confirmed: number
  }
}

const SEGMENTS = [
  {
    key: "new" as const,
    label: "New",
    color: "bg-[#3B82F6]",
    textColor: "text-[#1D4ED8]",
    dotColor: "bg-[#3B82F6]",
  },
  {
    key: "not_now" as const,
    label: "Not now",
    color: "bg-[#F59E0B]",
    textColor: "text-warning",
    dotColor: "bg-[#F59E0B]",
  },
  {
    key: "booking_confirmed" as const,
    label: "Booking confirmed",
    color: "bg-[#10B981]",
    textColor: "text-[#059669]",
    dotColor: "bg-[#10B981]",
  },
]

export function PipelineCard({ pipeline }: PipelineCardProps) {
  const total = pipeline.new + pipeline.not_now + pipeline.booking_confirmed

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">Pipeline</p>
        <span className="text-xs text-muted-foreground">{total} active</span>
      </div>

      {/* Stacked bar */}
      {total > 0 ? (
        <>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-muted">
            {SEGMENTS.map((seg) => {
              const pct = total > 0 ? (pipeline[seg.key] / total) * 100 : 0
              if (pct === 0) return null
              return (
                <div
                  key={seg.key}
                  className={cn("h-full transition-all", seg.color)}
                  style={{ width: `${pct}%` }}
                />
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-1.5 mt-3">
            {SEGMENTS.map((seg) => (
              <div key={seg.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", seg.dotColor)} />
                  <span className="text-xs text-muted-foreground">{seg.label}</span>
                </div>
                <span className={cn("text-xs font-semibold font-mono-data", seg.textColor)}>
                  {pipeline[seg.key]}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground/60 text-center py-3">No active leads</p>
      )}
    </div>
  )
}
