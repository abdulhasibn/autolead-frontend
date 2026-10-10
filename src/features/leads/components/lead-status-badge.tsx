import { Badge } from "@/components/ui/badge"
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
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full px-2 text-[11px] font-semibold",
        LEAD_STATUS_BADGE_CLASSES[status] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {LEAD_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
