import Link from "next/link"
import { cn } from "@/lib/utils"
import { VEHICLE_STATUSES, VEHICLE_STATUS_LABELS, VEHICLE_STATUS_STYLES } from "../constants"
import { buildVehiclesHref, type VehiclesSearchParams } from "../search-params"
import type { VehicleStatus } from "../types"

interface VehicleStatusTabsProps {
  params: VehiclesSearchParams
  /** Matches per status under the current filters; null when a count failed. */
  counts: Record<VehicleStatus | "all", number | null>
}

export function VehicleStatusTabs({ params, counts }: VehicleStatusTabsProps) {
  const tabs: Array<{ value?: VehicleStatus; label: string; dot?: string }> = [
    { label: "All" },
    ...VEHICLE_STATUSES.map((s) => ({
      value: s,
      label: VEHICLE_STATUS_LABELS[s],
      dot: VEHICLE_STATUS_STYLES[s].dot,
    })),
  ]

  return (
    <nav aria-label="Filter by status" className="-mx-1 overflow-x-auto px-1">
      <div className="inline-flex rounded-lg bg-muted/70 p-1 text-sm font-medium text-muted-foreground">
        {tabs.map((tab) => {
          const active = params.status === tab.value
          const count = counts[tab.value ?? "all"]
          return (
            <Link
              key={tab.label}
              href={buildVehiclesHref({ ...params, status: tab.value, page: 1 })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 whitespace-nowrap transition-colors",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "hover:text-foreground"
              )}
            >
              {tab.dot && <span aria-hidden className={cn("size-1.5 rounded-full", tab.dot)} />}
              {tab.label}
              {count !== null && (
                <span className="font-mono-data text-xs text-subtle-foreground">{count}</span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
