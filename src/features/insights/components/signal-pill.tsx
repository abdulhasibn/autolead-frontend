import { cn } from "@/lib/utils"
import { signalPill } from "../format"
import type { VehicleSignal } from "../types"

/** Demand signal as a pill; `withReason` adds the one-line advice underneath. */
export function SignalPill({
  signal,
  withReason = false,
  className,
}: {
  signal: VehicleSignal
  withReason?: boolean
  className?: string
}) {
  const pill = signalPill(signal.code)
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
          pill.className
        )}
        title={withReason ? undefined : signal.reason}
      >
        {pill.label}
      </span>
      {withReason && <p className="text-xs text-muted-foreground">{signal.reason}</p>}
    </div>
  )
}
