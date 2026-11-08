"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/finance", label: "Overview" },
  { href: "/finance/entries", label: "Ledger" },
  { href: "/finance/reports", label: "Reports" },
  { href: "/finance/settings", label: "Settings" },
]

export function FinanceNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Finance sections" className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
      <ul className="flex gap-5 border-b border-muted">
        {LINKS.map((link) => {
          const active = link.href === "/finance" ? pathname === "/finance" : pathname.startsWith(link.href)
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex min-h-11 items-center text-sm font-medium whitespace-nowrap transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
                {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
