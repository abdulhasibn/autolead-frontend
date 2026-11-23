import Link from "next/link"
import { ArrowDown, ArrowUp } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format"
import { FOLLOW_UP_TASK_TYPE_LABELS, LEAD_SOURCE_LABELS } from "../constants"
import type { FollowUpTaskType, LeadReadModel } from "../types"
import { buildLeadsHref, nextSort, type LeadsSearchParams } from "../search-params"
import { DEFAULT_LEAD_SORT } from "../constants"
import { LeadStatusBadge } from "./lead-status-badge"

interface LeadsTableProps {
  leads: LeadReadModel[]
  vehicleLabels: Record<string, string>
  /** The current list state; without it the headers are plain labels. */
  params?: LeadsSearchParams
}

const HEAD = "h-10 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
const CELL = "px-4 py-3"
const EMPTY = <span className="text-subtle-foreground">—</span>

function SortHead({
  column,
  label,
  params,
  className,
}: {
  column: "created" | "budget"
  label: string
  params?: LeadsSearchParams
  className: string
}) {
  if (!params) return <TableHead className={className}>{label}</TableHead>
  const current = params.sort ?? DEFAULT_LEAD_SORT
  const active = current === column || current === `-${column}`
  const Icon = current === column ? ArrowUp : ArrowDown
  return (
    <TableHead
      className={className}
      aria-sort={active ? (current === column ? "ascending" : "descending") : "none"}
    >
      <Link
        href={buildLeadsHref({ ...params, sort: nextSort(params.sort, column), page: 1 })}
        className={`inline-flex items-center gap-1 hover:text-foreground ${active ? "text-foreground" : ""}`}
      >
        {label}
        {active && <Icon aria-hidden className="size-3" />}
      </Link>
    </TableHead>
  )
}

export function LeadsTable({ leads, vehicleLabels, params }: LeadsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader className="bg-card/50">
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className={HEAD}>Contact</TableHead>
            <TableHead className={HEAD}>Status</TableHead>
            <TableHead className={HEAD}>Source</TableHead>
            <TableHead className={HEAD}>Assigned to</TableHead>
            <TableHead className={HEAD}>Vehicle</TableHead>
            <SortHead column="budget" label="Budget" params={params} className={`${HEAD} text-right`} />
            <TableHead className={HEAD}>Next follow-up</TableHead>
            <SortHead column="created" label="Created" params={params} className={HEAD} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              className="border-border/50 hover:bg-card/50"
            >
              <TableCell className={CELL}>
                <div className="flex items-center gap-3">
                  <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-accent text-xs font-semibold text-primary">
                    {lead.contactFullName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-sm font-medium text-foreground hover:text-primary"
                    >
                      {lead.contactFullName}
                    </Link>
                    <div className="text-xs text-subtle-foreground">
                      {lead.contactPhone}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className={CELL}>
                <LeadStatusBadge status={lead.status} />
              </TableCell>
              <TableCell className={`${CELL} text-foreground`}>
                {LEAD_SOURCE_LABELS[lead.source] ?? lead.source}
              </TableCell>
              <TableCell className={`${CELL} text-foreground`}>
                {lead.assignedToName ?? <span className="text-subtle-foreground">Unassigned</span>}
              </TableCell>
              <TableCell className={`${CELL} max-w-56 truncate text-foreground`}>
                {lead.vehicleId
                  ? (vehicleLabels[lead.vehicleId] ?? "Linked vehicle")
                  : (lead.preferredVehicle ?? EMPTY)}
              </TableCell>
              <TableCell className={`${CELL} font-mono-data text-right text-foreground`}>
                {lead.budget == null ? EMPTY : formatCurrency(lead.budget)}
              </TableCell>
              <TableCell className={CELL}>
                {lead.nextFollowUp ? (
                  <>
                    <div className="text-foreground">
                      {formatDateTime(lead.nextFollowUp.scheduledAt)}
                    </div>
                    <div className="text-xs text-subtle-foreground">
                      {FOLLOW_UP_TASK_TYPE_LABELS[
                        lead.nextFollowUp.taskType as FollowUpTaskType
                      ] ?? lead.nextFollowUp.taskType}
                    </div>
                  </>
                ) : (
                  EMPTY
                )}
              </TableCell>
              <TableCell className={`${CELL} text-muted-foreground`}>
                {formatDate(lead.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
