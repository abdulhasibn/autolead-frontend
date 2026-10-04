import type { Metadata } from "next"

export const metadata: Metadata = { title: "Leads" }

export default function LeadsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
      <p className="text-muted-foreground text-sm">Leads list coming soon.</p>
    </div>
  )
}
