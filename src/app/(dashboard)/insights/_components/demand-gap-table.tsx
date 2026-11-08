import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/empty-state"
import { formatShare } from "@/features/insights/format"
import type { SegmentRow } from "@/features/insights/types"
import { cn } from "@/lib/utils"

const GAP_PILLS: Record<"under" | "over", { label: string; short: string; className: string }> = {
  under: { label: "Under-stocked", short: "Under", className: "bg-success-muted text-success" },
  over: { label: "Over-stocked", short: "Over", className: "bg-warning-muted text-warning" },
}

/** Segment demand against stock share: "under" means buyers want more than you hold. */
export function DemandGapTable({ segments }: { segments: SegmentRow[] }) {
  if (segments.length === 0) {
    return <EmptyState message="Not enough browsing to compare segments yet." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">Segment</TableHead>
          <TableHead className="text-right">Demand</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="pr-4 text-right">Gap</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {segments.map((row) => {
          const pill = row.gap ? GAP_PILLS[row.gap] : null
          return (
            <TableRow key={row.label}>
              <TableCell className="pl-4 font-medium text-foreground">{row.label}</TableCell>
              <TableCell className="font-mono-data text-right">{formatShare(row.demandShare)}</TableCell>
              <TableCell className="font-mono-data text-right text-muted-foreground">
                {formatShare(row.stockShare)}
              </TableCell>
              <TableCell className="pr-4 text-right">
                {pill ? (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                      pill.className
                    )}
                  >
                    <span className="sm:hidden">{pill.short}</span>
                    <span className="max-sm:hidden">{pill.label}</span>
                  </span>
                ) : (
                  <span className="text-xs text-subtle-foreground">Balanced</span>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
