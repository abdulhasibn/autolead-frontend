import type { Metadata } from "next"

export const metadata: Metadata = { title: "Vehicles" }

export default function VehiclesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Vehicles</h1>
      <p className="text-muted-foreground text-sm">Vehicles list coming soon.</p>
    </div>
  )
}
