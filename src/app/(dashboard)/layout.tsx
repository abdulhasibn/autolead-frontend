import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getNotifications } from "@/features/notifications/api"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ScrollGradient } from "@/components/layout/scroll-gradient"

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

  // Fetch notifications for the drawer initial state — swallow errors so a
  // backend hiccup doesn't break the whole shell.
  let initialNotifications: Awaited<ReturnType<typeof getNotifications>>["items"] = []
  let unreadCount = 0
  try {
    const page = await getNotifications({ limit: 50 })
    initialNotifications = page.items
    unreadCount = page.unreadCount
  } catch {
    // Non-fatal: drawer shows empty, badge stays at 0
  }

  return (
    <div className="h-screen overflow-hidden bg-muted">
      <Sidebar roles={roles} />
      <div className="flex flex-col h-full overflow-hidden md:ml-[80px]">
        <div className="relative flex-1 min-h-0">
          <ScrollGradient>{children}</ScrollGradient>
          {/* Floating header — no card, just text */}
          <div className="absolute inset-x-0 top-0 z-20 md:pr-3">
            <Header notifications={initialNotifications} unreadCount={unreadCount} roles={roles} />
          </div>
        </div>
      </div>
    </div>
  )
}
