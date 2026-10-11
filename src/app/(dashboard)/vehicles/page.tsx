import type { Metadata } from "next"
import { Car } from "lucide-react"
import { getMakes, getModels } from "@/features/catalog/api"
import type { MakeReadModel, ModelReadModel } from "@/features/catalog/types"
import { getOwners } from "@/features/owners/api"
import type { OwnerDto } from "@/features/owners/types"
import { getVehicles } from "@/features/vehicles/api"
import { VEHICLE_STATUSES, VEHICLES_PAGE_SIZE } from "@/features/vehicles/constants"
import {
  countActiveFilters,
  pageToOffset,
  parseVehiclesSearchParams,
  toListQuery,
  type RawSearchParams,
} from "@/features/vehicles/search-params"
import type { VehicleStatus } from "@/features/vehicles/types"
import { earliestExpiry } from "@/features/vehicles/utils"
import { SignedUrlRefresher } from "@/features/vehicles/components/signed-url-refresher"
import { VehicleCard } from "@/features/vehicles/components/vehicle-card"
import { VehicleFormSheet } from "@/features/vehicles/components/vehicle-form-sheet"
import { VehicleStatusTabs } from "@/features/vehicles/components/vehicle-status-tabs"
import { VehiclesPagination } from "@/features/vehicles/components/vehicles-pagination"
import { VehiclesTable } from "@/features/vehicles/components/vehicles-table"
import { VehiclesToolbar } from "@/features/vehicles/components/vehicles-toolbar"

export const metadata: Metadata = { title: "Vehicles" }

/** Lookups degrade to empty lists rather than breaking the page. */
async function safe<T>(load: () => Promise<{ items: T[] }>): Promise<T[]> {
  try {
    return (await load()).items
  } catch {
    return []
  }
}

async function countByStatus(
  query: ReturnType<typeof toListQuery>
): Promise<Record<VehicleStatus | "all", number | null>> {
  const statuses = [undefined, ...VEHICLE_STATUSES]
  const totals = await Promise.all(
    statuses.map((status) =>
      getVehicles({ ...query, status, limit: 1 })
        .then((page) => page.total)
        .catch(() => null)
    )
  )
  return Object.fromEntries(
    statuses.map((status, i) => [status ?? "all", totals[i]])
  ) as Record<VehicleStatus | "all", number | null>
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const params = parseVehiclesSearchParams(await searchParams)
  const query = toListQuery(params)

  const [vehiclesPage, counts, makes, models, owners] = await Promise.all([
    getVehicles({
      ...query,
      status: params.status,
      limit: VEHICLES_PAGE_SIZE,
      offset: pageToOffset(params.page),
    }),
    countByStatus(query),
    safe<MakeReadModel>(getMakes),
    params.makeId
      ? safe<ModelReadModel>(() => getModels(params.makeId!))
      : Promise.resolve([] as ModelReadModel[]),
    safe<OwnerDto>(() => getOwners({ limit: 100 })),
  ])

  const vehicles = vehiclesPage.items
  const now = new Date()
  const hasFilters = Boolean(params.q) || countActiveFilters(params) > 0
  const resultCount = vehiclesPage.total

  return (
    <div className="space-y-5">
      <SignedUrlRefresher
        expiresAt={earliestExpiry(vehicles.map((v) => v.frontImageUrlExpiresAt))}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Vehicles</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {resultCount} {resultCount === 1 ? "vehicle" : "vehicles"}
            {hasFilters ? " match the filters" : params.status ? "" : " in inventory"}
          </p>
        </div>
        <VehicleFormSheet mode="create" makes={makes} owners={owners} />
      </div>

      <VehicleStatusTabs params={params} counts={counts} />
      <VehiclesToolbar params={params} makes={makes} models={models} />

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center">
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-accent">
            <Car className="size-5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">No vehicles found</p>
          <p className="text-xs text-subtle-foreground">
            {hasFilters || params.status
              ? "Try a different search or clear the filters."
              : "Add your first vehicle to get started."}
          </p>
        </div>
      ) : params.layout === "table" ? (
        <VehiclesTable vehicles={vehicles} now={now.toISOString()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} now={now} />
          ))}
        </div>
      )}

      {vehiclesPage.total > 0 && (
        <VehiclesPagination
          params={params}
          total={vehiclesPage.total}
          pageSize={VEHICLES_PAGE_SIZE}
        />
      )}
    </div>
  )
}
