import type { Metadata } from "next"

export const metadata: Metadata = { title: "Vehicle Details" }

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  void params
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Vehicle Details</h1>
      <p className="text-muted-foreground text-sm">
        Vehicle detail view coming soon.
      </p>
    </div>
  )
}
