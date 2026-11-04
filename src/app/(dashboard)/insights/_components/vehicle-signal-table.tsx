"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/empty-state"
import { SignalPill } from "@/features/insights/components/signal-pill"
import { channelLabel, formatCount, formatLakh, formatRate } from "@/features/insights/format"
import type { VehicleInsightRow } from "@/features/insights/types"
import { cn } from "@/lib/utils"

type SortKey = "listedPrice" | "daysInStock" | "views" | "repeatViewers" | "testDriveOpens" | "leads" | "leadRate"

const COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: "listedPrice", label: "Price" },
  { key: "daysInStock", label: "Days" },
  { key: "views", label: "Views" },
  { key: "repeatViewers", label: "Repeat" },
  { key: "testDriveOpens", label: "TD opens" },
  { key: "leads", label: "Leads" },
  { key: "leadRate", label: "Lead rate" },
]

export function sortVehicleRows(
  rows: VehicleInsightRow[],
  key: SortKey,
  dir: "asc" | "desc"
): VehicleInsightRow[] {
  const sign = dir === "asc" ? 1 : -1
  // Nulls (unpriced cars, no rate) always sink to the bottom.
  return [...rows].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av == null) return bv == null ? 0 : 1
    if (bv == null) return -1
    return (av - bv) * sign
  })
}

/** Per-car demand, sortable by any metric, with the signal and its advice on every row. */
export function VehicleSignalTable({ items }: { items: VehicleInsightRow[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "views", dir: "desc" })

  if (items.length === 0) {
    return <EmptyState message="No listed cars had website views in this period." />
  }

  const rows = sortVehicleRows(items, sort.key, sort.dir)

  function toggle(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }))
  }

  return (
    <>
      <Table className="max-md:hidden">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Car</TableHead>
            {COLUMNS.map((col) => {
              const active = sort.key === col.key
              return (
                <TableHead
                  key={col.key}
                  className="text-right"
                  aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                >
                  <button
                    type="button"
                    onClick={() => toggle(col.key)}
                    className={cn(
                      "inline-flex items-center gap-0.5 hover:text-foreground",
                      active && "text-primary"
                    )}
                  >
                    {col.label}
                    {active &&
                      (sort.dir === "desc" ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}
                  </button>
                </TableHead>
              )
            })}
            <TableHead className="w-[28%] min-w-56 pr-4">Signal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.vehicleId} className="align-top">
              <TableCell className="min-w-48 pl-4 whitespace-normal">
                <Link
                  href={`/vehicles/${row.vehicleId}`}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {row.title}
                </Link>
                <p className="text-xs text-subtle-foreground">Top source: {channelLabel(row.topChannel)}</p>
              </TableCell>
              <TableCell className="font-mono-data text-right">{formatLakh(row.listedPrice)}</TableCell>
              <TableCell className={cn("font-mono-data text-right", row.daysInStock > 45 && "text-warning")}>
                {row.daysInStock}
              </TableCell>
              <TableCell className="font-mono-data text-right">{formatCount(row.views)}</TableCell>
              <TableCell className="font-mono-data text-right">{formatCount(row.repeatViewers)}</TableCell>
              <TableCell className="font-mono-data text-right">{formatCount(row.testDriveOpens)}</TableCell>
              <TableCell className="font-mono-data text-right font-semibold">{formatCount(row.leads)}</TableCell>
              <TableCell className="font-mono-data text-right text-muted-foreground">
                {formatRate(row.leadRate)}
              </TableCell>
              <TableCell className="pr-4 whitespace-normal">
                <SignalPill signal={row.signal} withReason />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ul className="divide-y divide-muted md:hidden">
        {rows.map((row) => (
          <li key={row.vehicleId} className="space-y-2 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/vehicles/${row.vehicleId}`}
                className="min-w-0 text-sm font-medium text-foreground hover:text-primary"
              >
                {row.title}
              </Link>
              <span className="font-mono-data shrink-0 text-sm font-semibold">{formatLakh(row.listedPrice)}</span>
            </div>
            <p className="font-mono-data text-xs text-muted-foreground">
              {formatCount(row.views)} views · {formatCount(row.leads)} {row.leads === 1 ? "lead" : "leads"} · {formatRate(row.leadRate)} ·{" "}
              <span className={cn(row.daysInStock > 45 && "text-warning")}>{row.daysInStock}d in stock</span>
            </p>
            <SignalPill signal={row.signal} withReason />
          </li>
        ))}
      </ul>
    </>
  )
}
