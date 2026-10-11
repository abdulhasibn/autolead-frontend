import { CalendarClock } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { FOLLOW_UP_TASK_TYPE_LABELS } from "../constants"
import type { FollowUpReadModel, FollowUpTaskType } from "../types"
import { CancelFollowUpButton } from "./cancel-follow-up-button"
import { CompleteFollowUpDialog } from "./complete-follow-up-dialog"

function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now()
}

/** Open follow-ups, earliest first; overdue ones are flagged. */
export function FollowUpActionItems({
  leadId,
  items,
}: {
  leadId: string
  items: FollowUpReadModel[]
}) {
  if (items.length === 0) {
    return <EmptyState message="Nothing scheduled." icon={CalendarClock} />
  }

  return (
    <ul className="-my-2 divide-y divide-[#F3F4F6]">
      {items.map((item) => {
        const overdue = isPast(item.scheduledAt)
        return (
          <li key={item.id} className="space-y-2 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-primary">
                {FOLLOW_UP_TASK_TYPE_LABELS[item.taskType as FollowUpTaskType] ??
                  item.taskType}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  overdue ? "text-destructive" : "text-foreground"
                )}
              >
                {formatDateTime(item.scheduledAt)}
              </span>
              {overdue && (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                  Overdue
                </span>
              )}
            </div>
            {item.notes && (
              <p className="text-xs whitespace-pre-wrap text-muted-foreground">{item.notes}</p>
            )}
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[11px] text-subtle-foreground">
                {item.assignedToName ? `For ${item.assignedToName}` : ""}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <CancelFollowUpButton leadId={leadId} followUpId={item.id} />
                <CompleteFollowUpDialog leadId={leadId} followUpId={item.id} />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
