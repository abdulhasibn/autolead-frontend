import { Badge } from "@/components/ui/badge"
import { LEAD_STATUS_BADGE_VARIANTS, LEAD_STATUS_LABELS } from "../constants"
import type { LeadStatus } from "../types"

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant={LEAD_STATUS_BADGE_VARIANTS[status] ?? "outline"}>
      {LEAD_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
