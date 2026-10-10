import Link from "next/link"
import {
  CarFront,
  FileBadge,
  MapPin,
  Phone,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import type { OwnerDto } from "@/features/owners/types"
import { cn } from "@/lib/utils"
import { ACQUISITION_TYPE_LABELS, FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "../constants"
import type { VehicleDto } from "../types"
import { formatKm, formatOwners, paperworkHealth, type HealthItem, type HealthTone } from "../utils"

function Tile({ value, label, mono }: { value: React.ReactNode; label: string; mono?: boolean }) {
  return (
    <div className="min-w-0 px-2 py-3 text-center">
      <p className={cn("truncate text-base font-semibold text-[#111827]", mono && "font-mono-data")}>{value}</p>
      <p className="text-[11px] text-[#9CA3AF]">{label}</p>
    </div>
  )
}

/** The six facts every conversation about a car starts with. */
export function GlancePanel({ vehicle }: { vehicle: VehicleDto }) {
  return (
    <section aria-label="Key specs" className="rounded-xl border border-[#E5E7EB] bg-white">
      <div className="grid grid-cols-3 divide-x divide-[#F3F4F6] border-b border-[#F3F4F6]">
        <Tile value={formatKm(vehicle.kmDriven)} label="km driven" mono />
        <Tile value={FUEL_TYPE_LABELS[vehicle.fuelType] ?? vehicle.fuelType} label="fuel" />
        <Tile value={TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission} label="transmission" />
      </div>
      <div className="grid grid-cols-3 divide-x divide-[#F3F4F6]">
        <Tile value={vehicle.year} label="year" mono />
        <Tile
          value={vehicle.numPreviousOwners === 0 ? "None" : formatOwners(vehicle.numPreviousOwners).replace(" owner", "")}
          label={vehicle.numPreviousOwners === 0 ? "prior owners" : "owner"}
        />
        <Tile value={vehicle.colour} label="colour" />
      </div>
    </section>
  )
}

const ICONS: Record<HealthItem["key"], LucideIcon> = {
  insurance: ShieldCheck,
  rc: FileBadge,
  service: Wrench,
  accident: CarFront,
}

const TONES: Record<HealthTone, { text: string; dot: string }> = {
  good: { text: "text-[#047857]", dot: "bg-[#10B981]" },
  warn: { text: "text-[#B45309]", dot: "bg-[#F59E0B]" },
  bad: { text: "text-[#B91C1C]", dot: "bg-[#EF4444]" },
  unknown: { text: "text-[#9CA3AF]", dot: "bg-[#D1D5DB]" },
}

/** Paperwork and condition as a traffic-light checklist. */
export function PaperworkPanel({ vehicle, now }: { vehicle: VehicleDto; now: Date }) {
  const items = paperworkHealth(vehicle, now)
  const attention = items.filter((i) => i.tone === "warn" || i.tone === "bad").length
  const unknown = items.filter((i) => i.tone === "unknown").length

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white">
      <div className="flex items-center justify-between border-b border-[#F3F4F6] px-4 py-3">
        <h2 className="text-sm font-semibold text-[#111827]">Paperwork &amp; condition</h2>
        {attention > 0 ? (
          <span className="rounded-full bg-[#FFFBEB] px-2 py-0.5 text-[11px] font-semibold text-[#B45309]">
            {attention} need{attention === 1 ? "s" : ""} attention
          </span>
        ) : unknown > 0 ? (
          <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#6B7280]">
            {unknown} not recorded
          </span>
        ) : (
          <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-semibold text-[#047857]">
            All clear
          </span>
        )}
      </div>
      <ul className="divide-y divide-[#F3F4F6] text-sm">
        {items.map((item) => {
          const Icon = ICONS[item.key]
          const tone = TONES[item.tone]
          return (
            <li key={item.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="flex items-center gap-2 text-[#4B5563]">
                <Icon aria-hidden className="size-4 text-[#9CA3AF]" />
                {item.label}
              </span>
              <span className={cn("flex items-center gap-1.5 text-right font-medium", tone.text)}>
                <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", tone.dot)} />
                {item.value}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function OwnerCard({ vehicle, owner }: { vehicle: VehicleDto; owner: OwnerDto | null }) {
  const acquisition = ACQUISITION_TYPE_LABELS[vehicle.acquisitionType] ?? vehicle.acquisitionType
  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#CCFBF1] bg-[#F0FDFA] font-semibold text-[#0D9488]"
        >
          {owner ? owner.fullName.charAt(0).toUpperCase() : "?"}
        </span>
        <div className="min-w-0 flex-1">
          {owner ? (
            <Link href={`/owners/${owner.id}`} className="block truncate text-sm font-semibold text-[#0D9488] hover:underline">
              {owner.fullName}
            </Link>
          ) : (
            <p className="text-sm font-semibold text-[#9CA3AF]">Owner unavailable</p>
          )}
          <p className="text-xs text-[#9CA3AF]">Owner · {acquisition}</p>
        </div>
        {owner && (
          <a
            href={`tel:${owner.phone}`}
            title={`Call ${owner.phone}`}
            aria-label={`Call ${owner.fullName}`}
            className="flex size-8 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#0D9488] hover:bg-[#F0FDFA]"
          >
            <Phone className="size-4" />
          </a>
        )}
      </div>
      {vehicle.location && (
        <div className="mt-3 flex items-center gap-2 border-t border-[#F3F4F6] pt-3 text-xs text-[#6B7280]">
          <MapPin aria-hidden className="size-3.5 text-[#9CA3AF]" />
          {vehicle.location}
        </div>
      )}
    </section>
  )
}
