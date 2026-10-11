import { History } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  FOLLOW_UP_OUTCOME_LABELS,
  FOLLOW_UP_TASK_TYPE_LABELS,
  LEAD_STATUS_LABELS,
} from "../constants"
import type {
  FollowUpReadModel,
  FollowUpTaskType,
  LeadStatusHistoryItem,
} from "../types"

interface TimelineEntry {
  key: string
  at: string
  dot: string
  title: string
  actor: string | null
  detail: string | null
  notes: string | null
}

function fromStatus(item: LeadStatusHistoryItem): TimelineEntry {
  const to = LEAD_STATUS_LABELS[item.toStatus] ?? item.toStatus
  return {
    key: `status-${item.id}`,
    at: item.changedAt,
    dot: "bg-[#3B82F6]",
    title:
      item.fromStatus === null
        ? `Lead created as ${to}`
        : `${LEAD_STATUS_LABELS[item.fromStatus] ?? item.fromStatus} → ${to}`,
    actor: item.changedByName,
    detail: null,
    notes: item.notes,
  }
}

function fromFollowUp(item: FollowUpReadModel): TimelineEntry | null {
  const task = FOLLOW_UP_TASK_TYPE_LABELS[item.taskType as FollowUpTaskType] ?? item.taskType
  const due = `Due ${formatDateTime(item.scheduledAt)}`
  if (item.status === "completed" && item.completedAt) {
    return {
      key: `follow-up-${item.id}`,
      at: item.completedAt,
      dot: "bg-primary",
      title:
        item.outcome && item.outcome !== "done"
          ? `${task} done · ${FOLLOW_UP_OUTCOME_LABELS[item.outcome]}`
          : `${task} done`,
      actor: item.completedByName,
      detail: due,
      notes: item.completionNotes,
    }
  }
  if (item.status === "cancelled" && item.cancelledAt) {
    return {
      key: `follow-up-${item.id}`,
      at: item.cancelledAt,
      dot: "bg-border",
      title: `${task} cancelled`,
      actor: item.cancelledByName,
      detail: due,
      notes: item.notes,
    }
  }
  return null
}

/** Status changes and closed follow-ups, newest first. */
export function LeadHistoryTimeline({
  statusHistory,
  closedFollowUps,
}: {
  statusHistory: LeadStatusHistoryItem[]
  closedFollowUps: FollowUpReadModel[]
}) {
  const entries = [
    ...statusHistory.map(fromStatus),
    ...closedFollowUps.flatMap((item) => fromFollowUp(item) ?? []),
  ].sort((a, b) => b.at.localeCompare(a.at))

  if (entries.length === 0) {
    return <EmptyState message="No history yet." icon={History} />
  }

  return (
    <ol className="relative ml-1 space-y-5 border-l border-border pl-5 text-sm">
      {entries.map((entry) => (
        <li key={entry.key} className="relative">
          <span
            aria-hidden
            className={cn(
              "absolute top-1 -left-[25px] size-2.5 rounded-full ring-4 ring-white",
              entry.dot
            )}
          />
          <p className="font-semibold text-foreground">{entry.title}</p>
          <p className="text-xs text-subtle-foreground">
            {entry.actor ?? "System"} · {formatDateTime(entry.at)}
            {entry.detail && ` · ${entry.detail}`}
          </p>
          {entry.notes && (
            <p className="mt-1 rounded-lg bg-card/50 px-3 py-2 text-xs whitespace-pre-wrap text-muted-foreground">
              {entry.notes}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}
