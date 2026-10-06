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

export function LeadsTable({ leads, vehicleLabels }: LeadsTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead className="text-right">Budget</TableHead>
            <TableHead>Next follow-up</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <Link
                  href={`/leads/${lead.id}`}
                  className="font-medium hover:underline"
                >
                  {lead.contactFullName}
                </Link>
                <div className="text-muted-foreground text-xs">
                  {lead.contactPhone}
                </div>
              </TableCell>
              <TableCell>
                <LeadStatusBadge status={lead.status} />
              </TableCell>
              <TableCell>{LEAD_SOURCE_LABELS[lead.source] ?? lead.source}</TableCell>
              <TableCell className="max-w-56 truncate">
                {lead.vehicleId
                  ? (vehicleLabels[lead.vehicleId] ?? "Linked vehicle")
                  : (lead.preferredVehicle ?? "—")}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(lead.budget)}
              </TableCell>
              <TableCell>
                {lead.nextFollowUp ? (
                  <>
                    <div>{formatDateTime(lead.nextFollowUp.scheduledAt)}</div>
                    <div className="text-muted-foreground text-xs">
                      {FOLLOW_UP_TASK_TYPE_LABELS[
                        lead.nextFollowUp.taskType as FollowUpTaskType
                      ] ?? lead.nextFollowUp.taskType}
                    </div>
                  </>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{formatDate(lead.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
