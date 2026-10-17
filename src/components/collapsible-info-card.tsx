"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

/**
 * `InfoCard` that folds away on phones, for secondary sections that would
 * otherwise make a long scroll. Always open on desktop.
 */
export function CollapsibleInfoCard({
  title,
  icon,
  className,
  children,
}: {
  title: string
  /** Rendered icon element (components can't cross the server boundary). */
  icon: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const expanded = !isMobile || open

  return (
    <Card className={cn("gap-0 py-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!isMobile}
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-center gap-2 px-4 py-3 text-left disabled:cursor-default max-md:min-h-12",
          expanded && "border-b border-muted"
        )}
      >
        <span className="flex size-6 items-center justify-center rounded-md bg-accent text-accent-foreground [&_svg]:size-3.5">
          {icon}
        </span>
        <span className="text-sm font-semibold">{title}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "ml-auto size-4 text-subtle-foreground transition-transform md:hidden",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded && <CardContent className="p-4">{children}</CardContent>}
    </Card>
  )
}
