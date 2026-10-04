import type { Metadata } from "next"

export const metadata: Metadata = { title: "Users" }

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      <p className="text-muted-foreground text-sm">
        User management coming soon.
      </p>
    </div>
  )
}
