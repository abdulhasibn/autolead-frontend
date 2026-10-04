import type { Metadata } from "next"

export const metadata: Metadata = { title: "Owners" }

export default function OwnersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Owners</h1>
      <p className="text-muted-foreground text-sm">Owners list coming soon.</p>
    </div>
  )
}
