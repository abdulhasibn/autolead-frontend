import { cn } from "@/lib/utils"
import { formatPlate } from "../utils"

/** Registration styled like a white number plate. */
export function NumberPlate({
  registration,
  className,
}: {
  registration: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "font-mono-data inline-block rounded border border-border bg-card px-1.5 py-0.5 text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-foreground",
        className
      )}
    >
      {formatPlate(registration)}
    </span>
  )
}
