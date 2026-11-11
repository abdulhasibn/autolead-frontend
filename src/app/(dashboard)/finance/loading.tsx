import { Skeleton } from "@/components/ui/skeleton"

/** Shown while the finance layout checks the vault, before any finance page renders. */
export default function FinanceShellLoading() {
  return (
    <div className="flex flex-col gap-4 sm:gap-5" aria-busy="true" aria-label="Loading finance">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28 rounded-lg bg-border" />
          <Skeleton className="h-4 w-48 rounded bg-muted" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg bg-border" />
      </div>
      <div className="flex gap-5 border-b border-muted">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="my-3.5 h-4 w-16 rounded bg-border" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-3 w-20 rounded bg-muted" />
            <Skeleton className="h-7 w-24 rounded bg-border" />
          </div>
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl border border-border bg-card" />
    </div>
  )
}
