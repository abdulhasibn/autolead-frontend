"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Camera } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "../constants"
import type { VehicleDto } from "../types"
import { formatKm, formatVehicleTitle, stockAge } from "../utils"
import { NumberPlate } from "./number-plate"
import { VehicleStatusBadge } from "./vehicle-status-badge"

const EMPTY = <span className="text-[#D1D5DB]">—</span>

/** Dense view for scanning many cars at once; rows open the vehicle. */
export function VehiclesTable({ vehicles, now }: { vehicles: VehicleDto[]; now: string }) {
  const router = useRouter()
  const nowDate = new Date(now)

  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
            <TableHead className="text-[11px] font-semibold tracking-wide text-[#9CA3AF] uppercase">Vehicle</TableHead>
            <TableHead className="hidden text-[11px] font-semibold tracking-wide text-[#9CA3AF] uppercase md:table-cell">Plate</TableHead>
            <TableHead className="hidden text-[11px] font-semibold tracking-wide text-[#9CA3AF] uppercase lg:table-cell">Km</TableHead>
            <TableHead className="hidden text-[11px] font-semibold tracking-wide text-[#9CA3AF] uppercase lg:table-cell">Fuel · Gearbox</TableHead>
            <TableHead className="text-[11px] font-semibold tracking-wide text-[#9CA3AF] uppercase">Status</TableHead>
            <TableHead className="hidden text-[11px] font-semibold tracking-wide text-[#9CA3AF] uppercase sm:table-cell">Leads</TableHead>
            <TableHead className="text-right text-[11px] font-semibold tracking-wide text-[#9CA3AF] uppercase">In stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => {
            const href = `/vehicles/${vehicle.id}`
            const title = formatVehicleTitle(vehicle)
            const age = stockAge(vehicle, nowDate)
            return (
              <TableRow
                key={vehicle.id}
                className="cursor-pointer hover:bg-[#F9FAFB]"
                onClick={() => router.push(href)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F0FDFA] text-[#0D9488]">
                      {vehicle.frontImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={vehicle.frontImageUrl}
                          alt=""
                          loading="lazy"
                          className={cn("size-full object-cover", vehicle.status === "dropped" && "grayscale")}
                        />
                      ) : (
                        <Camera aria-hidden className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={href}
                        className="block truncate font-medium text-[#111827] hover:text-[#0D9488]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {title}
                      </Link>
                      <p className="truncate text-xs text-[#9CA3AF]">{vehicle.variantName}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <NumberPlate registration={vehicle.registrationNumber} />
                </TableCell>
                <TableCell className="font-mono-data hidden text-xs lg:table-cell">
                  {formatKm(vehicle.kmDriven)}
                </TableCell>
                <TableCell className="hidden text-xs text-[#4B5563] lg:table-cell">
                  {FUEL_TYPE_LABELS[vehicle.fuelType] ?? vehicle.fuelType} ·{" "}
                  {TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission}
                </TableCell>
                <TableCell>
                  <VehicleStatusBadge status={vehicle.status} />
                </TableCell>
                <TableCell className="font-mono-data hidden text-xs sm:table-cell">
                  {vehicle.linkedLeadCount || EMPTY}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right text-xs",
                    age?.aging ? "font-semibold text-[#B45309]" : "text-[#9CA3AF]"
                  )}
                >
                  {age ? `${age.days}d` : EMPTY}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
