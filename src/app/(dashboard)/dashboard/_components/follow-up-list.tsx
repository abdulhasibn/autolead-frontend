import Link from "next/link"
import { CompleteFollowUpDialog } from "@/features/leads/components/complete-follow-up-dialog"
import type { FollowUpCard } from "@/features/dashboard/types"
import { TASK_TYPE_LABELS, formatTime, relativeTime } from "@/features/dashboard/format"
import { Check } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"

const TASK_ICONS: Record<string, React.ReactNode> = {
  call: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  whatsapp: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  meeting: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  test_drive: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11l5-5 5 5" />
    </svg>
  ),
  send_quotation: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
}

const DEFAULT_ICON = (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

interface FollowUpListProps {
  items: FollowUpCard[]
  variant?: "today" | "overdue"
  emptyMessage?: string
}

export function FollowUpList({
  items,
  variant = "today",
  emptyMessage = "All caught up!",
}: FollowUpListProps) {
  if (items.length === 0) {
    return <EmptyState message={emptyMessage} icon={Check} className="py-8" />
  }

  return (
    <ul className="divide-y divide-[#F3F4F6]">
      {items.map((item) => {
        const icon = TASK_ICONS[item.taskType] ?? DEFAULT_ICON
        const timeLabel =
          variant === "overdue"
            ? relativeTime(item.scheduledAt)
            : formatTime(item.scheduledAt)

        return (
          <li
            key={item.followUpId}
            className="flex items-center gap-2 pr-3 hover:bg-card/50 transition-colors"
          >
            <Link
              href={`/leads/${item.leadId}`}
              className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3 group"
            >
              {/* Task type icon */}
              <div
                className={cn(
                  "mt-0.5 shrink-0 w-7 h-7 rounded-lg flex items-center justify-center",
                  variant === "overdue"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-accent text-primary"
                )}
              >
                {icon}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.contactName}
                  </p>
                  <span
                    className={cn(
                      "text-[11px] font-semibold shrink-0",
                      variant === "overdue" ? "text-destructive" : "text-primary"
                    )}
                  >
                    {timeLabel}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {TASK_TYPE_LABELS[item.taskType] ?? item.taskType}
                  {item.contactPhone && ` · ${item.contactPhone}`}
                </p>
                {item.vehicleLabel && (
                  <p className="text-[11px] text-subtle-foreground truncate mt-0.5">
                    {item.vehicleLabel}
                  </p>
                )}
              </div>
            </Link>
            <CompleteFollowUpDialog leadId={item.leadId} followUpId={item.followUpId} compact />
          </li>
        )
      })}
    </ul>
  )
}
