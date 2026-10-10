import { cn } from "@/lib/utils"
import { VEHICLE_STATUS_LABELS, VEHICLE_STATUS_STYLES } from "../constants"
import type { VehicleStatus } from "../types"

/**
 * `overlay` sits on top of photos (opaque white so it reads on any image);
 * `soft` is the tinted version for white surfaces.
 */
export function VehicleStatusBadge({
  status,
  variant = "soft",
  className,
}: {
  status: VehicleStatus
  variant?: "soft" | "overlay"
  className?: string
}) {
  const style = VEHICLE_STATUS_STYLES[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        style.text,
        variant === "overlay" ? "bg-white/95 shadow-sm" : style.soft,
        className
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", style.dot)} />
      {VEHICLE_STATUS_LABELS[status]}
    </span>
  )
}
