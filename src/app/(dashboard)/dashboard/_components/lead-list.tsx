import Link from "next/link"
import type { LeadCard } from "@/features/dashboard/types"
import {
  LEAD_STATUS_LABELS,
  SOURCE_LABELS,
  relativeTime,
} from "@/features/dashboard/format"
import { Check } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"

const STATUS_COLORS: Record<string, string> = {
  new: "bg-[#DBEAFE] text-[#1D4ED8]",
  not_now: "bg-[#FEF3C7] text-[#D97706]",
  booking_confirmed: "bg-[#DCFCE7] text-[#16A34A]",
  converted: "bg-[#F0FDF4] text-[#15803D]",
  lost: "bg-[#FEE2E2] text-[#DC2626]",
  vehicle_unavailable: "bg-[#F3F4F6] text-[#6B7280]",
}

interface LeadListProps {
  items: LeadCard[]
  emptyMessage?: string
}

export function LeadList({
  items,
  emptyMessage = "No leads to show.",
}: LeadListProps) {
  if (items.length === 0) {
    return <EmptyState message={emptyMessage} icon={Check} className="py-8" />
  }

  return (
    <ul className="divide-y divide-[#F3F4F6]">
      {items.map((item) => (
        <li key={item.leadId}>
          <Link
            href={`/leads/${item.leadId}`}
            className="flex items-start gap-3 px-4 py-3 hover:bg-[#F9FAFB] transition-colors"
          >
            {/* Avatar placeholder */}
            <div className="shrink-0 w-7 h-7 rounded-full bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center text-[#0D9488] text-xs font-semibold mt-0.5">
              {item.contactName.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-[#111827] truncate">
                  {item.contactName}
                </p>
                <span className="text-[11px] text-[#9CA3AF] shrink-0">
                  {relativeTime(item.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold",
                    STATUS_COLORS[item.status] ?? "bg-[#F3F4F6] text-[#6B7280]"
                  )}
                >
                  {LEAD_STATUS_LABELS[item.status] ?? item.status}
                </span>
                <span className="text-[10px] text-[#9CA3AF]">·</span>
                <span className="text-[11px] text-[#9CA3AF]">
                  {SOURCE_LABELS[item.source] ?? item.source}
                </span>
              </div>
              {item.vehicleLabel && (
                <p className="text-[11px] text-[#9CA3AF] truncate mt-0.5">
                  {item.vehicleLabel}
                </p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
