import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Car, FileText, Phone, User } from "lucide-react"
import { auth } from "@/lib/auth"
import { Detail, InfoCard } from "@/components/info-card"
import { getOwner } from "@/features/owners/api"
import { DeactivateOwnerDialog } from "@/features/owners/components/deactivate-owner-dialog"
import { EditOwnerSheet } from "@/features/owners/components/edit-owner-sheet"
import { OwnerVehiclesPanel } from "@/features/owners/components/owner-vehicles-panel"
import { PreferredContactBadge } from "@/features/owners/components/preferred-contact-badge"
import { getVehicles } from "@/features/vehicles/api"
import { ApiError } from "@/lib/api-error"
import { formatDate, formatDateTime } from "@/lib/format"

export const metadata: Metadata = { title: "Owner Details" }

async function loadOwner(id: string) {
  try {
    return await getOwner(id)
  } catch (err) {
    if (ApiError.isApiError(err) && (err.isNotFound() || err.isValidation())) {
      notFound()
    }
    throw err
  }
}

const EMPTY = <span className="text-subtle-foreground">—</span>
const linkClass = "text-primary hover:text-primary/80 hover:underline"

export default async function OwnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [session, owner, vehiclesPage] = await Promise.all([
    auth(),
    loadOwner(id),
    // Degrade gracefully if vehicles endpoint is down.
    getVehicles({ ownerId: id, limit: 100 }).catch(() => null),
  ])

  const isAdmin = session?.user.roles?.includes("admin") ?? false
  const vehicles = vehiclesPage?.items ?? []

  return (
    <div className="space-y-6">
      <Link
        href="/owners"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        All owners
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-accent text-lg font-semibold text-primary"
          >
            {owner.fullName.charAt(0).toUpperCase()}
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {owner.fullName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Added {formatDate(owner.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <EditOwnerSheet owner={owner} />
          {isAdmin && (
            <DeactivateOwnerDialog ownerId={owner.id} ownerName={owner.fullName} />
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Contact" icon={Phone}>
          <dl className="space-y-4">
            <Detail label="Phone">
              <a href={`tel:${owner.phone}`} className={linkClass}>
                {owner.phone}
              </a>
            </Detail>
            <Detail label="Alt phone">
              {owner.altPhone ? (
                <a href={`tel:${owner.altPhone}`} className={linkClass}>
                  {owner.altPhone}
                </a>
              ) : (
                EMPTY
              )}
            </Detail>
            <Detail label="Email">
              {owner.email ? (
                <a href={`mailto:${owner.email}`} className={linkClass}>
                  {owner.email}
                </a>
              ) : (
                EMPTY
              )}
            </Detail>
            <Detail label="Preferred method">
              <PreferredContactBadge method={owner.preferredContactMethod} />
            </Detail>
          </dl>
        </InfoCard>

        <InfoCard title="Address" icon={User}>
          <dl className="space-y-4">
            <Detail label="City">{owner.city ?? EMPTY}</Detail>
            <Detail label="Address">{owner.address ?? EMPTY}</Detail>
          </dl>
        </InfoCard>

        <InfoCard title="Identity &amp; notes" icon={FileText}>
          <dl className="space-y-4">
            <Detail label="ID info">{owner.idInfo ?? EMPTY}</Detail>
            <Detail label="Notes">
              {owner.notes ? (
                <span className="whitespace-pre-wrap">{owner.notes}</span>
              ) : (
                EMPTY
              )}
            </Detail>
            <Detail label="Last updated">
              <span className="text-muted-foreground">
                {formatDateTime(owner.updatedAt)}
              </span>
            </Detail>
          </dl>
        </InfoCard>

        <InfoCard
          title={vehicles.length > 0 ? `Vehicles (${vehicles.length})` : "Vehicles"}
          icon={Car}
          className="lg:col-span-3"
        >
          <OwnerVehiclesPanel vehicles={vehicles} />
        </InfoCard>
      </div>
    </div>
  )
}
