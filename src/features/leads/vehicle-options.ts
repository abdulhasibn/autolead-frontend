import { getVehicles } from "@/features/vehicles/api"
import { formatVehicleLabel, isVehicleLinkable } from "@/features/vehicles/utils"
import type { VehicleOption } from "./components/types"

/**
 * Vehicles for lead filters and pickers. The API caps a page at 100, which
 * covers a showroom's stock; a lookup failure degrades to an empty list
 * rather than breaking the leads pages.
 */
export async function getVehicleOptions(): Promise<VehicleOption[]> {
  try {
    const page = await getVehicles({ limit: 100 })
    return page.items.map((vehicle) => ({
      id: vehicle.id,
      label: formatVehicleLabel(vehicle),
      linkable: isVehicleLinkable(vehicle),
    }))
  } catch {
    return []
  }
}
