import Link from "next/link"
import type { VehicleCard } from "@/features/dashboard/types"
import { Check } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"

interface AgedStockListProps {
  items: VehicleCard[]
  emptyMessage?: string
}

export function AgedStockList({
  items,
  emptyMessage = "No aged stock.",
}: AgedStockListProps) {
  if (items.length === 0) {
    return <EmptyState message={emptyMessage} icon={Check} className="py-8" />
  }

  return (
    <ul className="divide-y divide-[#F3F4F6]">
      {items.map((item) => (
        <li key={item.vehicleId}>
          <Link
            href={`/vehicles/${item.vehicleId}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-card/50 transition-colors"
          >
            {/* Car icon */}
            <div className="shrink-0 w-7 h-7 rounded-lg bg-warning-muted border border-[#FDE68A] flex items-center justify-center text-warning mt-0">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 6l4-3 4 3"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {item.vehicleLabel}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    item.daysListed > 60 ? "text-destructive" : "text-warning"
                  )}
                >
                  {item.daysListed}d listed
                </span>
                {item.activeLeads > 0 && (
                  <>
                    <span className="text-[10px] text-subtle-foreground">·</span>
                    <span className="text-[11px] text-muted-foreground">
                      {item.activeLeads} active {item.activeLeads === 1 ? "lead" : "leads"}
                    </span>
                  </>
                )}
              </div>
            </div>

            <svg
              className="w-3.5 h-3.5 text-subtle-foreground shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </li>
      ))}
    </ul>
  )
}
