import Link from "next/link"
import { AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatMoney } from "../logic/money"

function Notice({
  tone,
  children,
  className,
}: {
  tone: "warning" | "info"
  children: React.ReactNode
  className?: string
}) {
  const Icon = tone === "warning" ? AlertTriangle : Info
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-xl border px-4 py-3 text-sm",
        tone === "warning"
          ? "border-warning/30 bg-warning-muted text-warning"
          : "border-border bg-card text-muted-foreground",
        className
      )}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** Any finance response with `truncated: true`. */
export function TruncatedBanner({ truncated, className }: { truncated: boolean; className?: string }) {
  if (!truncated) return null
  return (
    <Notice tone="warning" className={className}>
      Too many entries for this range; figures may be incomplete. Narrow the dates.
    </Notice>
  )
}

/** Sold cars without a purchase rate or commission % stay out of sales and profit. */
export function UncountedSalesWarning({
  uncountedSales,
  carsMissingPurchaseRate,
  href = "/finance/reports?tab=vehicle-profit",
  className,
}: {
  uncountedSales: number
  carsMissingPurchaseRate?: number
  href?: string
  className?: string
}) {
  if (!(uncountedSales > 0)) return null
  return (
    <Notice tone="warning" className={className}>
      <span className="font-semibold">{formatMoney(uncountedSales)}</span> of sales not counted until the purchase rate
      or commission % is entered
      {carsMissingPurchaseRate ? ` (${carsMissingPurchaseRate} ${carsMissingPurchaseRate === 1 ? "car" : "cars"})` : ""}.{" "}
      <Link href={href} className="font-semibold underline underline-offset-2">
        See which cars →
      </Link>
    </Notice>
  )
}

export { Notice }
