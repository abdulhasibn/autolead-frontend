"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useThemePreference } from "@/components/theme-provider"
import type { ThemePreference } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
  { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
  { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
]

/** Theme choices as items for an existing menu (the header account menu on phones). */
export function ThemeMenuItems({ className }: { className?: string }) {
  const { preference, setPreference } = useThemePreference()

  return (
    <DropdownMenuGroup className={className}>
      <DropdownMenuLabel className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">
        Theme
      </DropdownMenuLabel>
      {OPTIONS.map((opt) => (
        <DropdownMenuItem
          key={opt.value}
          className="gap-2 cursor-pointer"
          onClick={() => setPreference(opt.value)}
          aria-current={preference === opt.value ? "true" : undefined}
        >
          <span className={preference === opt.value ? "text-primary" : "text-muted-foreground"}>
            {opt.icon}
          </span>
          <span className={preference === opt.value ? "font-medium text-primary" : ""}>
            {opt.label}
          </span>
        </DropdownMenuItem>
      ))}
    </DropdownMenuGroup>
  )
}

export function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useThemePreference()

  const current = OPTIONS.find((o) => o.value === preference) ?? OPTIONS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn("inline-flex size-8 pointer-coarse:size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none", className)}
        aria-label="Toggle theme"
      >
        {current?.icon}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            className="gap-2 cursor-pointer"
            onClick={() => setPreference(opt.value)}
            aria-current={preference === opt.value ? "true" : undefined}
          >
            <span className={preference === opt.value ? "text-primary" : "text-muted-foreground"}>
              {opt.icon}
            </span>
            <span className={preference === opt.value ? "font-medium text-primary" : ""}>
              {opt.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
