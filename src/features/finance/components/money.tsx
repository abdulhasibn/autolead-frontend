import { cn } from "@/lib/utils"
import { formatMoney, formatSignedMoney } from "../logic/money"

interface MoneyProps {
  value: number | null | undefined
  /** Colour losses red (and gains green with `signed`). */
  tone?: boolean
  /** Prefix gains with "+". */
  signed?: boolean
  /** Shown as a tooltip and to screen readers when the value is null. */
  nullHint?: string
  className?: string
}

/** A rupee figure: Indian grouping, real minus sign, "—" for unknown (never ₹0). */
export function Money({ value, tone = false, signed = false, nullHint, className }: MoneyProps) {
  if (value == null) {
    return (
      <span className={cn("font-mono-data text-subtle-foreground", className)} title={nullHint}>
        —{nullHint && <span className="sr-only"> ({nullHint})</span>}
      </span>
    )
  }
  return (
    <span
      className={cn(
        "font-mono-data whitespace-nowrap",
        tone && value < 0 && "text-destructive",
        tone && signed && value > 0 && "text-success",
        className
      )}
    >
      {signed ? formatSignedMoney(value) : formatMoney(value)}
    </span>
  )
}
