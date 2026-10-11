"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users2,
  Car,
  UserCheck,
  UserCog,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useUIStore } from "@/stores/ui.store"
import type { UserRole } from "@/types/auth"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
}

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/leads", label: "Leads", icon: Users2 },
    ],
  },
  {
    label: "Inventory",
    items: [
      { href: "/vehicles", label: "Vehicles", icon: Car },
      { href: "/owners", label: "Owners", icon: UserCheck },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/users", label: "Staff", icon: UserCog, roles: ["admin"] },
    ],
  },
]

function Logo() {
  return (
    <div className="flex h-14 items-center gap-3 px-3.5 border-b border-white/[0.06] shrink-0">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shrink-0">
        <svg
          style={{ width: "1.1rem", height: "1.1rem" }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="2" x2="12" y2="9" />
          <line x1="4.22" y1="6.22" x2="9.17" y2="9.17" />
          <line x1="19.78" y1="6.22" x2="14.83" y2="9.17" />
        </svg>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-75 whitespace-nowrap overflow-hidden min-w-0">
        <span className="text-sm font-bold tracking-tight text-foreground block leading-tight">
          Wheels <span className="text-primary">Experts</span>
        </span>
        <span className="text-[10px] text-subtle-foreground uppercase tracking-wider font-medium block">
          Sales Management
        </span>
      </div>
    </div>
  )
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-primary"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
      )}
      <Icon className={cn("shrink-0 h-[18px] w-[18px]", active && "text-primary")} />
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-75 whitespace-nowrap text-[13px] leading-none">
        {item.label}
      </span>
    </Link>
  )
}

function SidebarNav({ roles }: { roles: UserRole[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
      {NAV_GROUPS.map((group) => {
        const visibleItems = group.items.filter(
          (item) => !item.roles || item.roles.some((r) => roles.includes(r))
        )
        if (visibleItems.length === 0) return null

        return (
          <div key={group.label} className="mb-1">
            <p className="px-3.5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-75 whitespace-nowrap">
              {group.label}
            </p>
            <ul className="space-y-0.5 px-2">
              {visibleItems.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.href}>
                    <NavLink item={item} active={active} />
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

export function Sidebar({ roles = [] }: { roles?: UserRole[] }) {
  return (
    <aside
      className={cn(
        "group fixed left-3 top-3 bottom-3 z-30 hidden md:flex flex-col",
        "w-[60px] hover:w-[220px] transition-[width] duration-200 ease-out",
        "rounded-2xl overflow-hidden",
        "bg-sidebar dark:bg-[#111C1A]",
        "border border-border/40",
        "shadow-[0_4px_24px_rgba(0,0,0,0.10)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.45)]",
      )}
    >
      <Logo />
      <SidebarNav roles={roles} />
    </aside>
  )
}

export function MobileSidebar({ roles = [] }: { roles?: UserRole[] }) {
  const { activeModal, openModal, closeModal } = useUIStore()
  const isOpen = activeModal === "mobile-sidebar"

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-muted-foreground hover:text-foreground"
        onClick={() => openModal("mobile-sidebar")}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={isOpen} onOpenChange={(v) => !v && closeModal()}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="h-14 border-b border-border px-4 flex flex-row items-center">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            {/* Inline logo for mobile sheet */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shrink-0">
                <svg
                  style={{ width: "1.1rem", height: "1.1rem" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="2" x2="12" y2="9" />
                  <line x1="4.22" y1="6.22" x2="9.17" y2="9.17" />
                  <line x1="19.78" y1="6.22" x2="14.83" y2="9.17" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-foreground">
                  Wheels <span className="text-primary">Experts</span>
                </span>
                <span className="block text-[10px] text-subtle-foreground uppercase tracking-wider font-medium">
                  Sales Management
                </span>
              </div>
            </div>
          </SheetHeader>
          <div className="flex flex-col h-[calc(100%-3.5rem)] overflow-hidden">
            {/* Render nav with all labels visible in mobile sheet */}
            <MobileNav roles={roles} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function MobileNav({ roles }: { roles: UserRole[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 overflow-y-auto py-3">
      {NAV_GROUPS.map((group) => {
        const visibleItems = group.items.filter(
          (item) => !item.roles || item.roles.some((r) => roles.includes(r))
        )
        if (visibleItems.length === 0) return null
        return (
          <div key={group.label} className="mb-1">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
              {group.label}
            </p>
            <ul className="space-y-0.5 px-2">
              {visibleItems.map((item) => {
                const Icon = item.icon
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-accent text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                      )}
                      <Icon className={cn("shrink-0 h-4 w-4", active && "text-primary")} />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
