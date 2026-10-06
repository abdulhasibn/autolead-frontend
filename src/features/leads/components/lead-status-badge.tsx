import { cn } from "@/lib/utils"
import { LEAD_STATUS_BADGE_CLASSES, LEAD_STATUS_LABELS } from "../constants"
import type { LeadStatus } from "../types"

export function LeadStatusBadge({
  status,
  className,
}: {
  status: LeadStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        LEAD_STATUS_BADGE_CLASSES[status] ?? "bg-[#F3F4F6] text-[#6B7280]",
        className
      )}
    >
      {LEAD_STATUS_LABELS[status] ?? status}
    </span>
  )
}
