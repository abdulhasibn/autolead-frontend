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
import { Money } from "@/features/finance/components/money"
import { useVehicleMoney } from "@/features/finance/use-vehicle-money"
import type { VehicleMoneySummary } from "@/features/finance/types"

/** A purchase car's landing cost needs its rate; a commission car's is its costs. */
function landingCostOf(summary: VehicleMoneySummary | undefined): number | null {
  if (!summary) return null
  return summary.saleModel === "commission" || summary.purchaseRate != null ? summary.landingCost : null
}

const EMPTY = <span className="text-subtle-foreground">—</span>

/** Dense view for scanning many cars at once; rows open the vehicle. */
export function VehiclesTable({
  vehicles,
  now,
  financeUnlocked = false,
}: {
  vehicles: VehicleDto[]
  now: string
  /** Admin with an unlocked finance session: money columns load separately. */
  financeUnlocked?: boolean
}) {
  const router = useRouter()
  const nowDate = new Date(now)
  const money = useVehicleMoney(
    vehicles.map((v) => v.id),
    financeUnlocked
  )

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-card/50 hover:bg-card/50">
            <TableHead className="text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase">Vehicle</TableHead>
            <TableHead className="hidden text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase md:table-cell">Plate</TableHead>
            <TableHead className="hidden text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase lg:table-cell">Km</TableHead>
            <TableHead className="hidden text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase lg:table-cell">Fuel · Gearbox</TableHead>
            <TableHead className="text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase">Status</TableHead>
            <TableHead className="hidden text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase sm:table-cell">Leads</TableHead>
            {money && (
              <>
                <TableHead className="hidden text-right text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase xl:table-cell">Landing cost</TableHead>
                <TableHead className="hidden text-right text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase xl:table-cell">Quote</TableHead>
                <TableHead className="hidden text-right text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase md:table-cell">Profit</TableHead>
              </>
            )}
            <TableHead className="text-right text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase">In stock</TableHead>
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
                className="cursor-pointer hover:bg-card/50"
                onClick={() => router.push(href)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-accent text-primary">
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
                        className="block truncate font-medium text-foreground hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {title}
                      </Link>
                      <p className="truncate text-xs text-subtle-foreground">{vehicle.variantName}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <NumberPlate registration={vehicle.registrationNumber} />
                </TableCell>
                <TableCell className="font-mono-data hidden text-xs lg:table-cell">
                  {formatKm(vehicle.kmDriven)}
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                  {FUEL_TYPE_LABELS[vehicle.fuelType] ?? vehicle.fuelType} ·{" "}
                  {TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission}
                </TableCell>
                <TableCell>
                  <VehicleStatusBadge status={vehicle.status} />
                </TableCell>
                <TableCell className="font-mono-data hidden text-xs sm:table-cell">
                  {vehicle.linkedLeadCount || EMPTY}
                </TableCell>
                {money && (
                  <>
                    <TableCell className="hidden text-right text-xs xl:table-cell">
                      <Money value={landingCostOf(money.get(vehicle.id))} />
                    </TableCell>
                    <TableCell className="hidden text-right text-xs xl:table-cell">
                      <Money value={money.get(vehicle.id)?.currentQuote} />
                    </TableCell>
                    <TableCell className="hidden text-right text-xs md:table-cell">
                      <Money value={money.get(vehicle.id)?.profit} tone signed />
                    </TableCell>
                  </>
                )}
                <TableCell
                  className={cn(
                    "text-right text-xs",
                    age?.aging ? "font-semibold text-warning" : "text-subtle-foreground"
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
