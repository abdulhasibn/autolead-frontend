import Link from "next/link"
import { Car } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { VEHICLE_STATUS_LABELS } from "@/features/vehicles/constants"
import type { VehicleDto } from "@/features/vehicles/types"

interface OwnerVehiclesPanelProps {
  vehicles: VehicleDto[]
}

const HEAD =
  "h-9 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
const CELL = "px-4 py-3"

export function OwnerVehiclesPanel({ vehicles }: OwnerVehiclesPanelProps) {
  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <div className="flex size-9 items-center justify-center rounded-full bg-accent">
          <Car className="size-4 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">No vehicles</p>
        <p className="text-xs text-subtle-foreground">
          No vehicles are registered to this owner.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader className="bg-card/50">
        <TableRow className="border-border/50 hover:bg-transparent">
          <TableHead className={HEAD}>Registration</TableHead>
          <TableHead className={HEAD}>Make / Model</TableHead>
          <TableHead className={HEAD}>Year</TableHead>
          <TableHead className={HEAD}>Colour</TableHead>
          <TableHead className={HEAD}>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vehicles.map((v) => {
          const label = [v.makeName, v.modelName, v.variantName]
            .filter(Boolean)
            .join(" ")
          return (
            <TableRow key={v.id} className="border-border/50 hover:bg-card/50">
              <TableCell className={CELL}>
                <Link
                  href={`/vehicles/${v.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {v.registrationNumber}
                </Link>
              </TableCell>
              <TableCell className={`${CELL} text-sm`}>{label || "—"}</TableCell>
              <TableCell className={`${CELL} text-sm`}>{v.year}</TableCell>
              <TableCell className={`${CELL} text-sm`}>{v.colour}</TableCell>
              <TableCell className={`${CELL} text-sm text-muted-foreground`}>
                {VEHICLE_STATUS_LABELS[v.status] ?? v.status}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
