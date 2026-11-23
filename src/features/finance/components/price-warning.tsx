import { TriangleAlert } from "lucide-react"

/** An inline, non-blocking warning: it never stops a form from saving. */
export function PriceWarning({ children }: { children: string | null }) {
  if (!children) return null
  return (
    <p role="status" className="flex items-start gap-1.5 rounded-lg bg-warning-muted px-3 py-2 text-xs text-foreground">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
      <span>{children}</span>
    </p>
  )
}
