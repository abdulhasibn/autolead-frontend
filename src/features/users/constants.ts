import type { StaffRole } from "./types"

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Admin",
  salesperson: "Salesperson",
}

export const ROLE_HINTS: Record<StaffRole, string> = {
  admin: "Everything, including finance, staff and assigning leads",
  salesperson: "Their own leads, cars and owners",
}
