import Link from "next/link"
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
import { LeadStatusBadge } from "./lead-status-badge"

interface LeadsTableProps {
  leads: LeadReadModel[]
  vehicleLabels: Record<string, string>
}

const HEAD = "h-10 px-4 text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]"
const CELL = "px-4 py-3"
const EMPTY = <span className="text-[#D1D5DB]">—</span>

export function LeadsTable({ leads, vehicleLabels }: LeadsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
      <Table>
        <TableHeader className="bg-[#F9FAFB]">
          <TableRow className="border-[#F3F4F6] hover:bg-transparent">
            <TableHead className={HEAD}>Contact</TableHead>
            <TableHead className={HEAD}>Status</TableHead>
            <TableHead className={HEAD}>Source</TableHead>
            <TableHead className={HEAD}>Vehicle</TableHead>
            <TableHead className={`${HEAD} text-right`}>Budget</TableHead>
            <TableHead className={HEAD}>Next follow-up</TableHead>
            <TableHead className={HEAD}>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              className="border-[#F3F4F6] hover:bg-[#F9FAFB]"
            >
              <TableCell className={CELL}>
                <div className="flex items-center gap-3">
                  <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#CCFBF1] bg-[#F0FDFA] text-xs font-semibold text-[#0D9488]">
                    {lead.contactFullName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-sm font-medium text-[#111827] hover:text-[#0D9488]"
                    >
                      {lead.contactFullName}
                    </Link>
                    <div className="text-xs text-[#9CA3AF]">
                      {lead.contactPhone}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className={CELL}>
                <LeadStatusBadge status={lead.status} />
              </TableCell>
              <TableCell className={`${CELL} text-[#374151]`}>
                {LEAD_SOURCE_LABELS[lead.source] ?? lead.source}
              </TableCell>
              <TableCell className={`${CELL} max-w-56 truncate text-[#374151]`}>
                {lead.vehicleId
                  ? (vehicleLabels[lead.vehicleId] ?? "Linked vehicle")
                  : (lead.preferredVehicle ?? EMPTY)}
              </TableCell>
              <TableCell className={`${CELL} font-mono-data text-right text-[#111827]`}>
                {lead.budget == null ? EMPTY : formatCurrency(lead.budget)}
              </TableCell>
              <TableCell className={CELL}>
                {lead.nextFollowUp ? (
                  <>
                    <div className="text-[#374151]">
                      {formatDateTime(lead.nextFollowUp.scheduledAt)}
                    </div>
                    <div className="text-xs text-[#9CA3AF]">
                      {FOLLOW_UP_TASK_TYPE_LABELS[
                        lead.nextFollowUp.taskType as FollowUpTaskType
                      ] ?? lead.nextFollowUp.taskType}
                    </div>
                  </>
                ) : (
                  EMPTY
                )}
              </TableCell>
              <TableCell className={`${CELL} text-[#6B7280]`}>
                {formatDate(lead.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
