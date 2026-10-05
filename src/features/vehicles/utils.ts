import type { VehicleDto } from "./types"

/** Only open or linked vehicles can be linked to a lead. */
export function isVehicleLinkable(vehicle: Pick<VehicleDto, "status">): boolean {
  return vehicle.status === "open" || vehicle.status === "linked"
}

export function formatVehicleLabel(
  vehicle: Pick<
    VehicleDto,
    "year" | "makeName" | "modelName" | "variantName" | "registrationNumber"
  >
): string {
  const name = [vehicle.year, vehicle.makeName, vehicle.modelName, vehicle.variantName]
    .filter(Boolean)
    .join(" ")
  return `${name} · ${vehicle.registrationNumber}`
}
