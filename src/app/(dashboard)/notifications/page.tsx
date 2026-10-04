import type { Metadata } from "next"

export const metadata: Metadata = { title: "Notifications" }

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
      <p className="text-muted-foreground text-sm">
        Notifications list coming soon.
      </p>
    </div>
  )
}
