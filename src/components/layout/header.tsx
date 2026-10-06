"use client"

import { signOut, useSession } from "next-auth/react"
import { Bell, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MobileSidebar } from "@/components/layout/sidebar"
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
      <span className="font-semibold text-[#111827]">{label}</span>
      {sub && (
        <>
          <span className="text-[#D1D5DB]">/</span>
          <span className="text-[#9CA3AF] font-medium capitalize">
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

  const primaryRole = roles[0] ?? session?.user?.roles?.[0]

  return (
    <header className="flex h-14 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 gap-3">
      {/* Left: mobile menu + page title */}
      <div className="flex items-center gap-2">
        <MobileSidebar roles={roles} />
        <PageTitle />
      </div>

      {/* Right: notifications + user menu */}
      <div className="flex items-center gap-1.5">
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
            "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
          )}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0D9488] px-0.5 text-[10px] font-bold text-white leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-[#F3F4F6] transition-colors outline-none"
            aria-label="User menu"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-[#F0FDFA] text-[#0D9488] text-xs font-semibold">
                {getInitials(session?.user?.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium text-[#111827] max-w-[120px] truncate">
              {session?.user?.name?.split(" ")[0]}
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-[#111827]">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-[#6B7280] truncate">
                  {session?.user?.email}
                </p>
                {primaryRole && (
                  <Badge
                    variant="secondary"
                    className="w-fit mt-0.5 text-[10px] h-4 px-1.5 bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1]"
                  >
                    {ROLE_LABELS[primaryRole] ?? primaryRole}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[#DC2626] focus:text-[#DC2626] focus:bg-[#FEF2F2] cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
