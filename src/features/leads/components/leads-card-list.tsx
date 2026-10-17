import Link from "next/link"
import { CalendarClock, Car } from "lucide-react"
import { ContactActions } from "@/components/contact-actions"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { FOLLOW_UP_TASK_TYPE_LABELS } from "../constants"
import type { FollowUpTaskType, LeadReadModel } from "../types"
import { LeadStatusBadge } from "./lead-status-badge"

interface LeadsCardListProps {
  leads: LeadReadModel[]
  vehicleLabels: Record<string, string>
}

/** Phone layout of the leads table: one tappable card per lead with a call shortcut. */
export function LeadsCardList({ leads, vehicleLabels }: LeadsCardListProps) {
  return (
    <ul className="space-y-2">
      {leads.map((lead) => {
        const vehicle = lead.vehicleId
          ? (vehicleLabels[lead.vehicleId] ?? "Linked vehicle")
          : lead.preferredVehicle
        return (
          <li
            key={lead.id}
            className="relative flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors active:bg-muted/60"
          >
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-accent text-sm font-semibold text-primary"
            >
              {lead.contactFullName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {/* Stretched link: the whole card opens the lead. */}
                <Link
                  href={`/leads/${lead.id}`}
                  className="truncate text-[15px] font-semibold text-foreground after:absolute after:inset-0 after:rounded-xl"
                >
                  {lead.contactFullName}
                </Link>
                <LeadStatusBadge status={lead.status} className="shrink-0" />
              </div>
              <p className="text-xs text-subtle-foreground">
                {lead.contactPhone}
                {lead.budget != null && (
                  <span className="font-mono-data"> · {formatCurrency(lead.budget)}</span>
                )}
              </p>
              {vehicle && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Car aria-hidden className="size-3.5 shrink-0 text-subtle-foreground" />
                  <span className="truncate">{vehicle}</span>
                </p>
              )}
              {lead.nextFollowUp && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <CalendarClock aria-hidden className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {FOLLOW_UP_TASK_TYPE_LABELS[lead.nextFollowUp.taskType as FollowUpTaskType] ??
                      lead.nextFollowUp.taskType}{" "}
                    · {formatDateTime(lead.nextFollowUp.scheduledAt)}
                  </span>
                </p>
              )}
            </div>
            <ContactActions compact phone={lead.contactPhone} name={lead.contactFullName} />
          </li>
        )
      })}
    </ul>
  )
}
