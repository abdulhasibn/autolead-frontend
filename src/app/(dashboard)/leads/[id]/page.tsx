import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  CalendarClock,
  Car,
  ClipboardList,
  User,
} from "lucide-react"
import { Detail, InfoCard } from "@/components/info-card"
import { getMakes } from "@/features/catalog/api"
import { getLead } from "@/features/leads/api"
import {
  FOLLOW_UP_TASK_TYPE_LABELS,
  isLeadClosed,
  LEAD_SOURCE_LABELS,
} from "@/features/leads/constants"
import { getVehicleOptions } from "@/features/leads/vehicle-options"
import { ChangeStatusDialog } from "@/features/leads/components/change-status-dialog"
import { LeadPreferenceCard } from "@/features/leads/components/lead-preference-card"
import { LeadStatusBadge } from "@/features/leads/components/lead-status-badge"
import { LinkVehicleDialog } from "@/features/leads/components/link-vehicle-dialog"
import { ScheduleFollowUpDialog } from "@/features/leads/components/schedule-follow-up-dialog"
import type { FollowUpTaskType, LeadReadModel } from "@/features/leads/types"
import { ApiError } from "@/lib/api-error"
import {
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

const EMPTY = <span className="text-[#D1D5DB]">—</span>

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [lead, vehicles, makes] = await Promise.all([
    loadLead(id),
    getVehicleOptions(),
    // The preference make picker degrades to "any" if the catalog is down.
    getMakes().then((page) => page.items).catch(() => []),
  ])

  const closed = isLeadClosed(lead.status)
  const vehicleLabel = lead.vehicleId
    ? (vehicles.find((v) => v.id === lead.vehicleId)?.label ?? "Linked vehicle")
    : null
  const linkClass = "text-[#0D9488] hover:text-[#0F766E] hover:underline"

  return (
    <div className="space-y-6">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1 text-sm font-medium text-[#6B7280] transition-colors hover:text-[#0D9488]"
      >
        <ArrowLeft className="size-4" />
        All leads
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[#CCFBF1] bg-[#F0FDFA] text-lg font-semibold text-[#0D9488]"
          >
            {lead.contactFullName.charAt(0).toUpperCase()}
          </span>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
                {lead.contactFullName}
              </h1>
              <LeadStatusBadge status={lead.status} />
            </div>
            <p className="text-sm text-[#6B7280]">
              {LEAD_SOURCE_LABELS[lead.source] ?? lead.source} lead · created{" "}
              {formatDate(lead.createdAt)}
            </p>
          </div>
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
        <InfoCard title="Contact" icon={User}>
          <dl className="space-y-4">
            <Detail label="Phone">
              <a href={`tel:${lead.contactPhone}`} className={linkClass}>
                {lead.contactPhone}
              </a>
            </Detail>
            <Detail label="Email">
              {lead.contactEmail ? (
                <a href={`mailto:${lead.contactEmail}`} className={linkClass}>
                  {lead.contactEmail}
                </a>
              ) : (
                EMPTY
              )}
            </Detail>
          </dl>
        </InfoCard>

        <InfoCard title="Vehicle" icon={Car}>
          <dl className="space-y-4">
            <Detail label="Linked vehicle">
              {lead.vehicleId ? (
                <Link href={`/vehicles/${lead.vehicleId}`} className={linkClass}>
                  {vehicleLabel}
                </Link>
              ) : (
                <span className="text-[#9CA3AF]">None</span>
              )}
            </Detail>
            <Detail label="Preferred vehicle">{lead.preferredVehicle ?? EMPTY}</Detail>
            <Detail label="Current vehicle">{lead.currentVehicle ?? EMPTY}</Detail>
          </dl>
        </InfoCard>

        <InfoCard title="Next follow-up" icon={CalendarClock}>
          {lead.nextFollowUp ? (
            <dl className="space-y-4">
              <Detail label="When">{formatDateTime(lead.nextFollowUp.scheduledAt)}</Detail>
              <Detail label="Task">
                <span className="inline-flex items-center rounded-full bg-[#F0FDFA] px-2 py-0.5 text-[11px] font-semibold text-[#0D9488]">
                  {FOLLOW_UP_TASK_TYPE_LABELS[
                    lead.nextFollowUp.taskType as FollowUpTaskType
                  ] ?? lead.nextFollowUp.taskType}
                </span>
              </Detail>
              {lead.nextFollowUp.notes && (
                <Detail label="Notes">{lead.nextFollowUp.notes}</Detail>
              )}
            </dl>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="mb-2 flex size-8 items-center justify-center rounded-full bg-[#F0FDFA]">
                <CalendarClock className="size-4 text-[#0D9488]" />
              </div>
              <p className="text-xs text-[#9CA3AF]">Nothing scheduled.</p>
            </div>
          )}
        </InfoCard>

        <LeadPreferenceCard
          lead={lead}
          makes={makes}
          closed={closed}
          className="lg:col-span-3"
        />

        <InfoCard title="Requirements" icon={ClipboardList} className="lg:col-span-3">
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Purchase timeline">{lead.purchaseTimeline ?? EMPTY}</Detail>
            <Detail label="Finance required">{formatYesNo(lead.financeRequired)}</Detail>
            <Detail label="Trade-in required">{formatYesNo(lead.tradeInRequired)}</Detail>
            <Detail label="Notes">
              {lead.notes ? <span className="whitespace-pre-wrap">{lead.notes}</span> : EMPTY}
            </Detail>
            <Detail label="Last updated">
              <span className="text-[#6B7280]">{formatDateTime(lead.updatedAt)}</span>
            </Detail>
          </dl>
        </InfoCard>
      </div>
    </div>
  )
}
