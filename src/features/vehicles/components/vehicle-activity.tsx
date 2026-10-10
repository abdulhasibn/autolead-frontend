import Link from "next/link"
import { ChevronRight, Users2 } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { LEAD_SOURCE_LABELS } from "@/features/leads/constants"
import { LeadStatusBadge } from "@/features/leads/components/lead-status-badge"
import type { LeadReadModel } from "@/features/leads/types"
import { formatDate, formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { VEHICLE_STATUS_LABELS, VEHICLE_STATUS_STYLES } from "../constants"
import type { VehicleStatusHistoryItem } from "../types"

const ACTIVE_LEAD = new Set(["new", "not_now", "booking_confirmed"])

/** Leads pointing at this vehicle, active ones first. */
export function VehicleLeadsList({ leads }: { leads: LeadReadModel[] }) {
  if (leads.length === 0) {
    return <EmptyState message="No leads are linked to this vehicle yet." icon={Users2} className="py-8" />
  }
  const sorted = [...leads].sort(
    (a, b) =>
      Number(ACTIVE_LEAD.has(b.status)) - Number(ACTIVE_LEAD.has(a.status)) ||
      b.updatedAt.localeCompare(a.updatedAt)
  )
  return (
    <ul className="divide-y divide-[#F3F4F6] rounded-lg border border-[#F3F4F6] text-sm">
      {sorted.map((lead) => (
        <li key={lead.id}>
          <Link href={`/leads/${lead.id}`} className="flex items-center gap-3 px-3 py-3 hover:bg-[#F9FAFB]">
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F0FDFA] font-semibold text-[#0D9488]"
            >
              {lead.contactFullName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[#111827]">{lead.contactFullName}</p>
              <p className="truncate text-xs text-[#9CA3AF]">
                {LEAD_SOURCE_LABELS[lead.source] ?? lead.source} ·{" "}
                {lead.nextFollowUp
                  ? `next follow-up ${formatDateTime(lead.nextFollowUp.scheduledAt)}`
                  : `updated ${formatDate(lead.updatedAt)}`}
              </p>
            </div>
            <LeadStatusBadge status={lead.status} />
            <ChevronRight aria-hidden className="size-4 shrink-0 text-[#D1D5DB]" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** Status changes, newest first, ending with the vehicle being added. */
export function VehicleHistory({
  items,
  createdAt,
}: {
  items: VehicleStatusHistoryItem[]
  createdAt: string
}) {
  // The initial `open` row (no from-status) doubles as the "added" entry.
  const changes = items.filter((i) => i.fromStatus !== null)
  const creation = items.find((i) => i.fromStatus === null)

  return (
    <ol className="relative space-y-5 border-l border-[#E5E7EB] pl-5 text-sm">
      {changes.map((item) => (
        <li key={item.id} className="relative">
          <span
            aria-hidden
            className={cn(
              "absolute top-1 -left-[25px] size-2.5 rounded-full ring-4 ring-white",
              VEHICLE_STATUS_STYLES[item.toStatus]?.dot ?? "bg-[#9CA3AF]"
            )}
          />
          <p className="font-semibold text-[#111827]">
            {VEHICLE_STATUS_LABELS[item.fromStatus!] ?? item.fromStatus} →{" "}
            {VEHICLE_STATUS_LABELS[item.toStatus] ?? item.toStatus}
          </p>
          <p className="text-xs text-[#9CA3AF]">
            {item.changedByName ?? "System"} · {formatDateTime(item.changedAt)}
          </p>
          {item.reason && (
            <p className="mt-1 rounded-lg bg-[#F9FAFB] px-3 py-2 text-xs whitespace-pre-wrap text-[#4B5563]">
              {item.reason}
            </p>
          )}
        </li>
      ))}
      <li className="relative">
        <span aria-hidden className="absolute top-1 -left-[25px] size-2.5 rounded-full bg-[#0D9488] ring-4 ring-white" />
        <p className="font-semibold text-[#111827]">Added to inventory</p>
        <p className="text-xs text-[#9CA3AF]">
          {creation?.changedByName ? `${creation.changedByName} · ` : ""}
          {formatDateTime(creation?.changedAt ?? createdAt)}
        </p>
      </li>
    </ol>
  )
}
