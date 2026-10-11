"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Bell, LogOut, MonitorSmartphone } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MobileSidebar } from "@/components/layout/sidebar"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSignOut } from "@/features/auth/use-sign-out"
import type { UserRole } from "@/types/auth"
import { cn } from "@/lib/utils"

function getInitials(name?: string | null) {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  salesperson: "Salesperson",
}

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  leads: "Leads",
  vehicles: "Vehicles",
  owners: "Owners",
  notifications: "Notifications",
  users: "Staff",
}

function PageTitle() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const section = segments[0] ?? ""
  const sub = segments[1]

  const label = BREADCRUMB_LABELS[section] ?? section

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="font-semibold text-foreground">{label}</span>
      {sub && (
        <>
          <span className="text-subtle-foreground">/</span>
          <span className="text-muted-foreground font-medium capitalize">
            {sub.length === 36 ? "Detail" : sub}
          </span>
        </>
      )}
    </div>
  )
}

interface HeaderProps {
  unreadCount?: number
  roles?: UserRole[]
}

export function Header({ unreadCount = 0, roles = [] }: HeaderProps) {
  const { data: session } = useSession()
  const { pending: signOutPending, signOutWith } = useSignOut()
  const [confirmSignOutAll, setConfirmSignOutAll] = useState(false)

  const primaryRole = roles[0] ?? session?.user?.roles?.[0]

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 gap-3">
      {/* Left: mobile menu + page title */}
      <div className="flex items-center gap-2">
        <MobileSidebar roles={roles} />
        <PageTitle />
      </div>

      {/* Right: theme toggle + notifications + user menu */}
      <div className="flex items-center gap-1.5">
        <ThemeToggle />

        {/* Notifications bell */}
        <Link
          href="/notifications"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
          className={cn(
            "relative inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-bold text-primary-foreground leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors outline-none"
            aria-label="User menu"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                {getInitials(session?.user?.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
              {session?.user?.name?.split(" ")[0]}
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* Base UI requires a group label to live inside a group. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-foreground">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session?.user?.email}
                  </p>
                  {primaryRole && (
                    <Badge
                      variant="secondary"
                      className="w-fit mt-0.5 text-[10px] h-4 px-1.5 bg-accent text-accent-foreground border border-accent-border"
                    >
                      {ROLE_LABELS[primaryRole] ?? primaryRole}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              disabled={signOutPending !== null}
              onClick={() => signOutWith("local")}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={signOutPending !== null}
              onClick={() => setConfirmSignOutAll(true)}
            >
              <MonitorSmartphone className="mr-2 h-4 w-4" />
              Sign out of all devices
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ConfirmDialog
          open={confirmSignOutAll}
          onOpenChange={(open) => {
            if (signOutPending === null) setConfirmSignOutAll(open)
          }}
          title="Sign out of all devices?"
          description="You'll be signed out here and on every other phone, tablet or browser where you're signed in to AutoLead."
          confirmLabel="Sign out everywhere"
          pendingLabel="Signing out…"
          pending={signOutPending === "global"}
          onConfirm={() => signOutWith("global")}
        />
      </div>
    </header>
  )
}
