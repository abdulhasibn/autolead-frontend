import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BadgeCheck } from "lucide-react"
import { auth } from "@/lib/auth"
import { ApiError } from "@/lib/api-error"
import { formatDate, formatDateTime } from "@/lib/format"
import { getLeads } from "@/features/leads/api"
import type { LeadReadModel } from "@/features/leads/types"
import { getOwner } from "@/features/owners/api"
import type { OwnerDto } from "@/features/owners/types"
import {
  getVehicle,
  getVehicleDocuments,
  getVehicleMedia,
  getVehicleStatusHistory,
} from "@/features/vehicles/api"
import { ACQUISITION_TYPE_LABELS } from "@/features/vehicles/constants"
import type {
  VehicleDocumentDto,
  VehicleDto,
  VehicleMediaDto,
  VehicleStatusHistoryItem,
} from "@/features/vehicles/types"
import { earliestExpiry, formatVehicleTitle, stockAge } from "@/features/vehicles/utils"
import { ChangeVehicleStatusDialog } from "@/features/vehicles/components/change-vehicle-status-dialog"
import { DocumentsPanel } from "@/features/vehicles/components/documents-panel"
import { NumberPlate } from "@/features/vehicles/components/number-plate"
import { PhotoManager } from "@/features/vehicles/components/photo-manager"
import { SignedUrlRefresher } from "@/features/vehicles/components/signed-url-refresher"
import { VehicleHistory, VehicleLeadsList } from "@/features/vehicles/components/vehicle-activity"
import { VehicleFormSheet } from "@/features/vehicles/components/vehicle-form-sheet"
import { VehicleGallery } from "@/features/vehicles/components/vehicle-gallery"
import { VehicleStatusBadge } from "@/features/vehicles/components/vehicle-status-badge"
import { GlancePanel, OwnerCard, PaperworkPanel } from "@/features/vehicles/components/vehicle-summary"
import { VehicleTabs } from "@/features/vehicles/components/vehicle-tabs"

export const metadata: Metadata = { title: "Vehicle Details" }

async function loadVehicle(id: string): Promise<VehicleDto> {
  try {
    return await getVehicle(id)
  } catch (err) {
    // 422 = malformed id, which is just as missing as an unknown one.
    if (ApiError.isApiError(err) && (err.isNotFound() || err.isValidation())) {
      notFound()
    }
    throw err
  }
}

/** Secondary sections degrade to empty rather than failing the whole page. */
async function items<T>(load: () => Promise<{ items: T[] }>): Promise<T[]> {
  try {
    return (await load()).items
  } catch {
    return []
  }
}

const EMPTY = <span className="text-[#D1D5DB]">—</span>

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-[11px] font-medium tracking-wide text-[#9CA3AF] uppercase">{label}</dt>
      <dd className="text-sm text-[#111827]">{children}</dd>
    </div>
  )
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const vehicle = await loadVehicle(id)

  const [session, media, documents, history, leads, owner] = await Promise.all([
    auth(),
    items<VehicleMediaDto>(() => getVehicleMedia(id)),
    items<VehicleDocumentDto>(() => getVehicleDocuments(id)),
    items<VehicleStatusHistoryItem>(() => getVehicleStatusHistory(id)),
    items<LeadReadModel>(() => getLeads({ vehicleId: id, limit: 100 })),
    getOwner(vehicle.ownerId).catch((): OwnerDto | null => null),
  ])

  const isAdmin = session?.user.roles?.includes("admin") ?? false
  const now = new Date()
  const title = formatVehicleTitle(vehicle)
  const age = stockAge(vehicle, now)
  const soldLead = vehicle.soldLeadId ? leads.find((l) => l.id === vehicle.soldLeadId) : null

  return (
    <div className="space-y-5">
      <SignedUrlRefresher
        expiresAt={earliestExpiry([
          ...media.map((m) => m.urlExpiresAt),
          ...documents.map((d) => d.urlExpiresAt),
        ])}
      />

      <Link
        href="/vehicles"
        className="inline-flex items-center gap-1 text-sm font-medium text-[#6B7280] transition-colors hover:text-[#0D9488]"
      >
        <ArrowLeft className="size-4" />
        All vehicles
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">{title}</h1>
            <VehicleStatusBadge status={vehicle.status} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280]">
            {vehicle.variantName && (
              <>
                <span>{vehicle.variantName}</span>
                <span aria-hidden className="text-[#D1D5DB]">·</span>
              </>
            )}
            <NumberPlate registration={vehicle.registrationNumber} className="text-xs" />
            {age && (
              <>
                <span aria-hidden className="text-[#D1D5DB]">·</span>
                <span>
                  In stock{" "}
                  <b className={age.aging ? "text-[#B45309]" : "text-[#111827]"}>
                    {age.days} {age.days === 1 ? "day" : "days"}
                  </b>
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <VehicleFormSheet mode="edit" vehicle={vehicle} />
          {isAdmin && (
            <ChangeVehicleStatusDialog
              vehicleId={vehicle.id}
              title={title}
              status={vehicle.status}
              linkedLeadCount={vehicle.linkedLeadCount}
            />
          )}
        </div>
      </div>

      {vehicle.status === "sold" && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] px-4 py-3 text-sm text-[#5B21B6]">
          <BadgeCheck className="size-4 shrink-0" />
          <span className="font-semibold">Sold</span>
          {vehicle.soldLeadId && (
            <>
              <span>via</span>
              <Link href={`/leads/${vehicle.soldLeadId}`} className="font-semibold underline-offset-2 hover:underline">
                {soldLead?.contactFullName ?? "the converting lead"} →
              </Link>
            </>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <VehicleGallery
          media={media}
          title={title}
          photosHref={`/vehicles/${vehicle.id}?tab=photos#vehicle-tabs`}
          dimmed={vehicle.status === "dropped"}
        />
        <aside className="space-y-4">
          <GlancePanel vehicle={vehicle} />
          <PaperworkPanel vehicle={vehicle} now={now} />
          <OwnerCard vehicle={vehicle} owner={owner} />
        </aside>
      </div>

      <VehicleTabs
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-2 lg:col-span-2">
                  <h3 className="text-[11px] font-medium tracking-wide text-[#9CA3AF] uppercase">Description</h3>
                  {vehicle.description ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#374151]">
                      {vehicle.description}
                    </p>
                  ) : (
                    <p className="text-sm text-[#9CA3AF]">No description yet. Use Edit details to add one.</p>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-4">
                  <Detail label="Acquisition">
                    {ACQUISITION_TYPE_LABELS[vehicle.acquisitionType] ?? vehicle.acquisitionType}
                  </Detail>
                  <Detail label="Insurance until">
                    {vehicle.insuranceValidUntil ? formatDate(vehicle.insuranceValidUntil) : EMPTY}
                  </Detail>
                  <Detail label="Added">{formatDate(vehicle.createdAt)}</Detail>
                  <Detail label="Last updated">
                    <span className="text-[#6B7280]">{formatDateTime(vehicle.updatedAt)}</span>
                  </Detail>
                </dl>
              </div>
            ),
          },
          {
            id: "photos",
            label: "Photos",
            count: media.length,
            content: <PhotoManager vehicleId={vehicle.id} media={media} canDelete={isAdmin} />,
          },
          {
            id: "documents",
            label: "Documents",
            count: documents.length,
            content: <DocumentsPanel vehicleId={vehicle.id} documents={documents} canDelete={isAdmin} />,
          },
          {
            id: "leads",
            label: "Leads",
            count: vehicle.linkedLeadCount,
            highlight: true,
            content: <VehicleLeadsList leads={leads} />,
          },
          {
            id: "history",
            label: "History",
            content: <VehicleHistory items={history} createdAt={vehicle.createdAt} />,
          },
        ]}
      />
    </div>
  )
}
