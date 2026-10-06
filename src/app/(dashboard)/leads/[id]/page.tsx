import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getLead } from "@/features/leads/api"
import {
  FOLLOW_UP_TASK_TYPE_LABELS,
  isLeadClosed,
  LEAD_SOURCE_LABELS,
} from "@/features/leads/constants"
import { getVehicleOptions } from "@/features/leads/vehicle-options"
import { ChangeStatusDialog } from "@/features/leads/components/change-status-dialog"
import { LeadStatusBadge } from "@/features/leads/components/lead-status-badge"
import { LinkVehicleDialog } from "@/features/leads/components/link-vehicle-dialog"
import { ScheduleFollowUpDialog } from "@/features/leads/components/schedule-follow-up-dialog"
import type { FollowUpTaskType, LeadReadModel } from "@/features/leads/types"
import { ApiError } from "@/lib/api-error"
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatYesNo,
} from "@/lib/format"

export const metadata: Metadata = { title: "Lead Details" }

async function loadLead(id: string): Promise<LeadReadModel> {
  try {
    return await getLead(id)
  } catch (err) {
    // 422 = malformed id, which is just as missing as an unknown one.
    if (ApiError.isApiError(err) && (err.isNotFound() || err.isValidation())) {
      notFound()
    }
    throw err
  }
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [lead, vehicles] = await Promise.all([loadLead(id), getVehicleOptions()])

  const closed = isLeadClosed(lead.status)
  const vehicleLabel = lead.vehicleId
    ? (vehicles.find((v) => v.id === lead.vehicleId)?.label ?? "Linked vehicle")
    : null

  return (
    <div className="space-y-6">
      <Link
        href="/leads"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        All leads
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {lead.contactFullName}
            </h1>
            <LeadStatusBadge status={lead.status} />
          </div>
          <p className="text-muted-foreground text-sm">
            {LEAD_SOURCE_LABELS[lead.source] ?? lead.source} lead · created{" "}
            {formatDate(lead.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ScheduleFollowUpDialog leadId={lead.id} disabled={closed} />
          <LinkVehicleDialog
            leadId={lead.id}
            currentVehicleId={lead.vehicleId}
            vehicles={vehicles}
            disabled={closed}
          />
          <ChangeStatusDialog
            lead={{ id: lead.id, status: lead.status, vehicleId: lead.vehicleId }}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <Detail label="Phone">
                <a href={`tel:${lead.contactPhone}`} className="hover:underline">
                  {lead.contactPhone}
                </a>
              </Detail>
              <Detail label="Email">
                {lead.contactEmail ? (
                  <a href={`mailto:${lead.contactEmail}`} className="hover:underline">
                    {lead.contactEmail}
                  </a>
                ) : (
                  "—"
                )}
              </Detail>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <Detail label="Linked vehicle">
                {lead.vehicleId ? (
                  <Link href={`/vehicles/${lead.vehicleId}`} className="hover:underline">
                    {vehicleLabel}
                  </Link>
                ) : (
                  "None"
                )}
              </Detail>
              <Detail label="Preferred vehicle">{lead.preferredVehicle ?? "—"}</Detail>
              <Detail label="Current vehicle">{lead.currentVehicle ?? "—"}</Detail>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next follow-up</CardTitle>
          </CardHeader>
          <CardContent>
            {lead.nextFollowUp ? (
              <dl className="space-y-3">
                <Detail label="When">{formatDateTime(lead.nextFollowUp.scheduledAt)}</Detail>
                <Detail label="Task">
                  {FOLLOW_UP_TASK_TYPE_LABELS[
                    lead.nextFollowUp.taskType as FollowUpTaskType
                  ] ?? lead.nextFollowUp.taskType}
                </Detail>
                {lead.nextFollowUp.notes && (
                  <Detail label="Notes">{lead.nextFollowUp.notes}</Detail>
                )}
              </dl>
            ) : (
              <p className="text-muted-foreground text-sm">Nothing scheduled.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Budget">{formatCurrency(lead.budget)}</Detail>
              <Detail label="Purchase timeline">{lead.purchaseTimeline ?? "—"}</Detail>
              <Detail label="Finance required">{formatYesNo(lead.financeRequired)}</Detail>
              <Detail label="Trade-in required">{formatYesNo(lead.tradeInRequired)}</Detail>
              <Detail label="Notes">
                <span className="whitespace-pre-wrap">{lead.notes ?? "—"}</span>
              </Detail>
              <Detail label="Last updated">{formatDateTime(lead.updatedAt)}</Detail>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
