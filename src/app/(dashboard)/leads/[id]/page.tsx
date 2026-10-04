import type { Metadata } from "next"

export const metadata: Metadata = { title: "Lead Details" }

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  void params
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Lead Details</h1>
      <p className="text-muted-foreground text-sm">Lead detail view coming soon.</p>
    </div>
  )
}
