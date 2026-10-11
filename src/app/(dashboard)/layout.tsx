import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getNotifications } from "@/features/notifications/api"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const roles = session.user.roles ?? []

  // Fetch unread notification count — swallow errors so a backend hiccup
  // doesn't break the whole shell.
  let unreadCount = 0
  try {
    const notificationsPage = await getNotifications({ limit: 100 })
    unreadCount = notificationsPage.items.filter((n) => !n.isRead).length
  } catch {
    // Non-fatal: badge stays at 0
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      <Sidebar roles={roles} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header unreadCount={unreadCount} roles={roles} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
