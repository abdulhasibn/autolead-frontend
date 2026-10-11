import Link from "next/link"
import { Camera, Cog, Fuel, Gauge, MapPin, User, Users2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "../constants"
import type { VehicleDto } from "../types"
import { formatKm, formatOwners, formatPlate, formatVehicleTitle, stockAge } from "../utils"
import { VehicleStatusBadge } from "./vehicle-status-badge"

function SpecChip({ icon: Icon, children }: { icon: typeof Gauge; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-card/15 px-2 py-0.5 backdrop-blur-sm">
      <Icon aria-hidden className="size-3" />
      {children}
    </span>
  )
}

/** Full-bleed photo card with the details laid over a bottom gradient. */
export function VehicleCard({ vehicle, now }: { vehicle: VehicleDto; now: Date }) {
  const title = formatVehicleTitle(vehicle)
  const age = stockAge(vehicle, now)
  const dropped = vehicle.status === "dropped"

  return (
    <Link
      href={`/vehicles/${vehicle.id}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-[#0F172A] shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      {vehicle.frontImageUrl ? (
        // Signed, short-lived URL: skip the Next image cache.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={vehicle.frontImageUrl}
          alt={title}
          loading="lazy"
          className={cn(
            "absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.04]",
            dropped && "grayscale"
          )}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-[#134E4A] via-[#0F766E] to-[#0D9488] pb-28 text-white/80">
          <Camera aria-hidden className="size-6" />
          <span className="text-xs font-semibold">No photos yet</span>
        </div>
      )}

      {/* Scrims: top keeps the pills legible, bottom carries the text. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#05100F]/60 to-transparent" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[78%]"
        style={{
          background:
            "linear-gradient(to top, rgba(4,12,12,0.97) 0%, rgba(4,12,12,0.92) 28%, rgba(6,18,18,0.7) 52%, rgba(6,18,18,0.3) 78%, transparent 100%)",
        }}
      />

      <VehicleStatusBadge status={vehicle.status} variant="overlay" className="absolute top-3 left-3" />
      {vehicle.linkedLeadCount > 0 && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
          <Users2 aria-hidden className="size-3" />
          {vehicle.linkedLeadCount} {vehicle.linkedLeadCount === 1 ? "lead" : "leads"}
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 space-y-2.5 p-4 text-white">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base leading-tight font-bold drop-shadow">{title}</h3>
            <p className="truncate text-xs text-white/70">{vehicle.variantName ?? " "}</p>
          </div>
          <span className="font-mono-data shrink-0 rounded bg-card px-1.5 py-0.5 text-[10px] font-bold tracking-[0.06em] text-foreground shadow">
            {formatPlate(vehicle.registrationNumber)}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px] font-medium">
          <SpecChip icon={Gauge}>
            <span className="font-mono-data">{formatKm(vehicle.kmDriven)}</span> km
          </SpecChip>
          <SpecChip icon={Fuel}>{FUEL_TYPE_LABELS[vehicle.fuelType] ?? vehicle.fuelType}</SpecChip>
          <SpecChip icon={Cog}>
            {TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission}
          </SpecChip>
          <SpecChip icon={User}>{formatOwners(vehicle.numPreviousOwners)}</SpecChip>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-white/15 pt-2 text-[11px]">
          <span className="flex min-w-0 items-center gap-1 text-white/70">
            {vehicle.location && (
              <>
                <MapPin aria-hidden className="size-3 shrink-0" />
                <span className="truncate">{vehicle.location}</span>
              </>
            )}
          </span>
          {age && (
            <span
              className={cn(
                "shrink-0",
                age.aging
                  ? "rounded-full bg-[#F59E0B] px-1.5 font-semibold text-[#451A03]"
                  : "text-white/70"
              )}
            >
              {age.days}d in stock
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
