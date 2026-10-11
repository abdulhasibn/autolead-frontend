"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users2,
  Car,
  UserCheck,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui.store"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { UserRole } from "@/types/auth"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[] // undefined = all roles
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

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shrink-0">
        <svg
          className="w-4.5 h-4.5"
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
      {!collapsed && (
        <div>
          <span className="text-sm font-bold tracking-tight text-foreground">
            Wheels <span className="text-primary">Experts</span>
          </span>
          <span className="block text-[10px] text-subtle-foreground uppercase tracking-wider font-medium">
            Sales Management
          </span>
        </div>
      )}
    </div>
  )
}

interface NavLinkProps {
  item: NavItem
  collapsed: boolean
  active: boolean
}

function NavLink({ item, collapsed, active }: NavLinkProps) {
  const Icon = item.icon

  const linkEl = (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        active
          ? "bg-accent text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
      )}
      <Icon className={cn("shrink-0 h-4 w-4", active ? "text-primary" : "")} />
      {!collapsed && item.label}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger>{linkEl}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return linkEl
}

interface SidebarNavProps {
  roles: UserRole[]
  collapsed: boolean
}

function SidebarNav({ roles, collapsed }: SidebarNavProps) {
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
            {!collapsed && (
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5 px-2">
              {visibleItems.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.href}>
                    <NavLink item={item} collapsed={collapsed} active={active} />
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
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside
      className={cn(
        "relative hidden md:flex h-full flex-col border-r border-border bg-sidebar dark:bg-[#111C1A] text-sidebar-foreground transition-all duration-200",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border px-3">
        <Logo collapsed={sidebarCollapsed} />
      </div>

      <SidebarNav roles={roles} collapsed={sidebarCollapsed} />

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-full text-subtle-foreground hover:text-foreground hover:bg-muted"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  )
}

/** Mobile sidebar sheet — triggered by a Menu button in the Header */
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
            <Logo collapsed={false} />
          </SheetHeader>
          {/* Reuse nav with collapsed=false */}
          <div className="flex flex-col h-[calc(100%-3.5rem)] overflow-hidden">
            <SidebarNav roles={roles} collapsed={false} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
