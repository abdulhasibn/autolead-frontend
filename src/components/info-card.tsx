import type { LucideIcon } from "lucide-react"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** Label/value pair inside a `<dl>`. */
export function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  )
}

/** White card with a teal icon tile and title; `action` sits at the right of the header. */
export function InfoCard({
  title,
  icon: Icon,
  action,
  className,
  children,
}: {
  title: string
  icon: LucideIcon
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={cn("gap-0 py-0", className)}>
      <CardHeader className="flex items-center gap-2 border-b border-muted px-4 py-3">
        <span className="flex size-6 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Icon className="size-3.5" />
        </span>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {action && <CardAction className="ml-auto self-center">{action}</CardAction>}
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  )
}
