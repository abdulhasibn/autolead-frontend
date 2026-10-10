import type { LucideIcon } from "lucide-react"
import { Inbox } from "lucide-react"
import { Empty, EmptyDescription, EmptyMedia } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

/** Small centred "nothing here" note: teal icon dot plus one line of text. */
export function EmptyState({
  message,
  icon: Icon = Inbox,
  className,
}: {
  message: string
  icon?: LucideIcon
  className?: string
}) {
  return (
    <Empty className={cn("gap-0 rounded-none border-0 px-4 py-6", className)}>
      <EmptyMedia className="size-8 rounded-full bg-accent text-accent-foreground">
        <Icon aria-hidden className="size-4" />
      </EmptyMedia>
      <EmptyDescription className="text-xs text-subtle-foreground">{message}</EmptyDescription>
    </Empty>
  )
}
