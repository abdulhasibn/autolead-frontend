import { cn } from "@/lib/utils"
import type { FinanceTag } from "../types"

export function TagChip({ tag, className }: { tag: Pick<FinanceTag, "name" | "color" | "archived">; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
        tag.archived && "opacity-60",
        className
      )}
    >
      <span
        aria-hidden
        className="size-2 rounded-full"
        style={{ backgroundColor: tag.color ?? "var(--color-subtle-foreground, #94a3b8)" }}
      />
      {tag.name}
    </span>
  )
}
