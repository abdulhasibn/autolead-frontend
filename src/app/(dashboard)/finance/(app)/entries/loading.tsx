import { Skeleton } from "@/components/ui/skeleton"

export default function LedgerLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading ledger">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-40 rounded bg-muted" />
        <div className="flex gap-2 max-sm:hidden">
          <Skeleton className="h-9 w-28 rounded-lg bg-border" />
          <Skeleton className="h-9 w-28 rounded-lg bg-border" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 min-w-0 flex-1 basis-56 rounded-lg bg-border" />
        <Skeleton className="h-9 w-36 rounded-lg bg-border" />
        <Skeleton className="h-9 w-28 rounded-lg bg-border" />
      </div>
      <div className="grid grid-cols-3 divide-x divide-muted rounded-xl border border-border bg-card">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-2 px-3 py-3 sm:px-4">
            <Skeleton className="h-3 w-16 rounded bg-muted" />
            <Skeleton className="h-6 w-20 rounded bg-border" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-10 border-b border-border/50 bg-card/50" />
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-3 w-16 rounded bg-muted" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-16 rounded-full bg-accent" />
                  <Skeleton className="h-5 w-12 rounded-full bg-accent" />
                </div>
                <Skeleton className="h-3 w-40 max-w-full rounded bg-muted" />
              </div>
              <Skeleton className="h-4 w-20 rounded bg-border" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
