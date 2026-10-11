import { cn } from "@/lib/utils"

interface InventoryCardProps {
  inventory: {
    open: number
    linked: number
  }
}

export function InventoryCard({ inventory }: InventoryCardProps) {
  const total = inventory.open + inventory.linked

  const segments = [
    {
      key: "open" as const,
      label: "Available",
      color: "bg-primary",
      textColor: "text-primary",
      dotColor: "bg-primary",
    },
    {
      key: "linked" as const,
      label: "Linked to lead",
      color: "bg-[#6366F1]",
      textColor: "text-[#6366F1] dark:text-indigo-400",
      dotColor: "bg-[#6366F1]",
    },
  ]

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">Inventory</p>
        <span className="text-xs text-muted-foreground">{total} in stock</span>
      </div>

      {total > 0 ? (
        <>
          {/* Stacked bar */}
          <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-muted">
            {segments.map((seg) => {
              const pct = total > 0 ? (inventory[seg.key] / total) * 100 : 0
              if (pct === 0) return null
              return (
                <div
                  key={seg.key}
                  className={cn("h-full", seg.color)}
                  style={{ width: `${pct}%` }}
                />
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-1.5 mt-3">
            {segments.map((seg) => (
              <div key={seg.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", seg.dotColor)} />
                  <span className="text-xs text-muted-foreground">{seg.label}</span>
                </div>
                <span className={cn("text-xs font-semibold font-mono-data", seg.textColor)}>
                  {inventory[seg.key]}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground/60 text-center py-3">No vehicles in stock</p>
      )}
    </div>
  )
}
