import type { Metadata } from "next"

export const metadata: Metadata = { title: "Owner Details" }

export default function OwnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  void params
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Owner Details</h1>
      <p className="text-muted-foreground text-sm">
        Owner detail view coming soon.
      </p>
    </div>
  )
}
